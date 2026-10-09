import pg from 'pg';
import type { ErrorInfo } from '../i18n/error.js';
import {
  defaultAccount,
  type Account,
  type FolderEntry,
  type Job,
  type Secrets,
  type Store,
  type Translation,
} from './store.js';

/**
 * PostgreSQL store (the shared Railway Postgres; its own database, created on
 * first start). Accounts keep the OAuth token and the Supertext key encrypted;
 * the other settings are JSON.
 */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS accounts (
  account_id TEXT PRIMARY KEY,
  access_token TEXT NOT NULL DEFAULT '',
  api_key TEXT NOT NULL DEFAULT '',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS translations (
  account_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  language TEXT NOT NULL,
  target_id TEXT NOT NULL,
  web_id BIGINT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, source_id, language)
);
CREATE TABLE IF NOT EXISTS folder_entries (
  account_id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS translation_jobs (
  id UUID PRIMARY KEY,
  account_id TEXT NOT NULL,
  status TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS translation_jobs_account ON translation_jobs (account_id, created_at DESC);
`;

/** Creates the database named in the URL if it doesn't exist (the shared server has several). */
export async function ensureDatabase(databaseUrl: string): Promise<void> {
  const url = new URL(databaseUrl);
  const name = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!name || name === 'postgres') return;
  url.pathname = '/postgres';
  const admin = new pg.Client({ connectionString: url.toString() });
  await admin.connect();
  try {
    const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    if (exists.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${name.replace(/"/g, '""')}"`);
      console.log(`Created database ${name}.`);
    }
  } finally {
    await admin.end();
  }
}

export class PostgresStore implements Store {
  private readonly pool: pg.Pool;

  constructor(databaseUrl: string, private readonly secrets: Secrets) {
    this.pool = new pg.Pool({ connectionString: databaseUrl, max: 5 });
  }

  async migrate(): Promise<void> {
    await this.pool.query(SCHEMA);
  }

  private account(row: { account_id: string; access_token: string; api_key: string; data: Partial<Account> }): Account {
    return {
      ...defaultAccount(row.account_id),
      ...row.data,
      accountId: row.account_id,
      accessToken: this.secrets.decrypt(row.access_token),
      apiKey: this.secrets.decrypt(row.api_key),
    };
  }

  async getAccount(accountId: string) {
    const { rows } = await this.pool.query('SELECT * FROM accounts WHERE account_id = $1', [accountId]);
    return rows[0] ? this.account(rows[0]) : undefined;
  }

  async saveAccount(account: Account) {
    const { accessToken, apiKey, ...data } = account;
    await this.pool.query(
      `INSERT INTO accounts (account_id, access_token, api_key, data, updated_at) VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (account_id) DO UPDATE SET access_token = $2, api_key = $3, data = $4, updated_at = now()`,
      [account.accountId, this.secrets.encrypt(accessToken), this.secrets.encrypt(apiKey), data],
    );
  }

  async deleteAccount(accountId: string) {
    for (const table of ['accounts', 'translations', 'folder_entries', 'translation_jobs']) {
      await this.pool.query(`DELETE FROM ${table} WHERE account_id = $1`, [accountId]);
    }
  }

  async folderAccounts() {
    const { rows } = await this.pool.query(
      "SELECT * FROM accounts WHERE access_token <> '' AND (data->>'folderTrigger')::boolean IS TRUE",
    );
    return rows.map((row) => this.account(row)).filter((account) => account.accessToken);
  }

  async translations(accountId: string, sourceId: string): Promise<Translation[]> {
    const { rows } = await this.pool.query(
      'SELECT source_id, language, target_id, web_id, updated_at FROM translations WHERE account_id = $1 AND source_id = $2',
      [accountId, sourceId],
    );
    return rows.map((row) => ({
      sourceId: row.source_id,
      language: row.language,
      targetId: row.target_id,
      webId: row.web_id === null ? undefined : Number(row.web_id),
      updatedAt: new Date(row.updated_at).toISOString(),
    }));
  }

  async saveTranslation(accountId: string, translation: Translation) {
    await this.pool.query(
      `INSERT INTO translations (account_id, source_id, language, target_id, web_id, updated_at) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (account_id, source_id, language) DO UPDATE SET target_id = $4, web_id = $5, updated_at = $6`,
      [accountId, translation.sourceId, translation.language, translation.targetId, translation.webId ?? null, translation.updatedAt],
    );
  }

  async translationTargets(accountId: string) {
    const { rows } = await this.pool.query('SELECT target_id FROM translations WHERE account_id = $1', [accountId]);
    return new Set(rows.map((row) => row.target_id as string));
  }

  async folderEntries(accountId: string): Promise<Record<string, FolderEntry>> {
    const { rows } = await this.pool.query('SELECT data FROM folder_entries WHERE account_id = $1', [accountId]);
    return rows[0]?.data ?? {};
  }

  async saveFolderEntries(accountId: string, entries: Record<string, FolderEntry>) {
    await this.pool.query(
      `INSERT INTO folder_entries (account_id, data) VALUES ($1, $2)
       ON CONFLICT (account_id) DO UPDATE SET data = $2`,
      [accountId, entries],
    );
  }

  async saveJob(job: Job) {
    await this.pool.query(
      `INSERT INTO translation_jobs (id, account_id, status, data, created_at) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET status = $3, data = $4`,
      [job.id, job.accountId, job.status, job, job.createdAt],
    );
  }

  async getJob(accountId: string, id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
    const { rows } = await this.pool.query('SELECT data FROM translation_jobs WHERE id = $1 AND account_id = $2', [
      id,
      accountId,
    ]);
    return rows[0]?.data as Job | undefined;
  }

  async recentJobs(accountId: string, limit: number) {
    const { rows } = await this.pool.query(
      'SELECT data FROM translation_jobs WHERE account_id = $1 ORDER BY created_at DESC LIMIT $2',
      [accountId, limit],
    );
    return rows.map((row) => row.data as Job);
  }

  async failRunningJobs(error: ErrorInfo) {
    const { rows } = await this.pool.query("SELECT data FROM translation_jobs WHERE status = 'running'");
    for (const row of rows) {
      const job = row.data as Job;
      await this.saveJob({ ...job, status: 'failed', error, finishedAt: new Date().toISOString() });
    }
  }
}
