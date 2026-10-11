import { errorInfo, LocalizedError, type ErrorInfo } from '../i18n/error.js';
import { MailchimpClient, type Campaign } from '../mailchimp/client.js';
import type { SupertextClient } from '../supertext/client.js';
import { newJobId, type Account, type Job, type JobItem, type Store } from '../store/store.js';
import { supertextCode, supertextSource } from './languages.js';
import { originalSegment } from './segments.js';
import { translateCampaign } from './translate.js';

/**
 * A translation job: one campaign into one or more languages, one after the
 * other (Supertext limits requests per second). Runs in the web process;
 * progress is saved after every language so the page can poll it.
 */

export interface JobDeps {
  store: Store;
  mailchimp: (account: Account) => MailchimpClient;
  supertext: (account: Account) => Pick<SupertextClient, 'translateDocument'>;
}

export interface JobRequest {
  accountId: string;
  campaignId: string;
  languages: string[];
  overwrite: boolean;
  trigger: Job['trigger'];
  /** The original's folder (where the drafts go); undefined = the folder it is in now. */
  folderId?: string;
}

/** Errors that make every further language fail too: stop the job. */
const FATAL = new Set([
  'noApiKey',
  'auth',
  'limitExceeded',
  'unreachable',
  'notConnected',
  'mailchimpAuth',
  'mailchimpForbidden',
  'mailchimpUnreachable',
  'campaignMissing',
  'campaignType',
  'noContent',
  'isTranslation',
]);

/** Campaigns with a job running, so the same campaign isn't translated twice at once. */
const running = new Map<string, Promise<Job>>();

/** Starts the job and returns at once; `done` resolves when it has finished. */
export async function startJob(deps: JobDeps, request: JobRequest): Promise<{ job: Job; done: Promise<Job> }> {
  const key = `${request.accountId}|${request.campaignId}`;
  const job: Job = {
    id: newJobId(),
    accountId: request.accountId,
    status: 'running',
    trigger: request.trigger,
    campaignId: request.campaignId,
    campaignTitle: '',
    languages: [...new Set(request.languages)],
    overwrite: request.overwrite,
    items: [],
    createdAt: new Date().toISOString(),
  };
  await deps.store.saveJob(job);
  const previous = running.get(key) ?? Promise.resolve(undefined);
  const done = previous
    .catch(() => undefined)
    .then(() => runJob(deps, job, request.folderId))
    .catch(async (error) => {
      console.error('Supertext: job failed', error);
      job.status = 'failed';
      job.error = errorInfo(error);
      job.finishedAt = new Date().toISOString();
      await deps.store.saveJob(job).catch(() => undefined);
      return job;
    })
    .finally(() => {
      if (running.get(key) === done) running.delete(key);
    });
  running.set(key, done);
  return { job, done };
}

export async function runJob(deps: JobDeps, job: Job, folderId?: string): Promise<Job> {
  const { store } = deps;
  const account = await store.getAccount(job.accountId);
  if (!account) throw new LocalizedError('Mailchimp is not connected.', 'notConnected');
  const mailchimp = deps.mailchimp(account);
  const supertext = deps.supertext(account);

  const source = await mailchimp.campaign(job.campaignId);
  if (!source) throw new LocalizedError('The campaign no longer exists in Mailchimp.', 'campaignMissing');
  job.campaignTitle = source.settings.title || source.settings.subject_line || source.id;
  await store.saveJob(job);
  if ((await store.translationTargets(account.accountId)).has(source.id)) {
    throw new LocalizedError('This campaign is a translation made by Supertext.', 'isTranslation');
  }
  if (source.type !== 'regular' && source.type !== 'plaintext') {
    throw new LocalizedError('Only regular and plain-text campaigns can be translated.', 'campaignType', {
      type: source.type,
    });
  }
  const content = await mailchimp.content(source.id);
  if (source.type === 'regular' && !content.html) {
    throw new LocalizedError('Mailchimp returned no HTML for this campaign.', 'noContent');
  }

  const drafts = new Map((await store.translations(account.accountId, source.id)).map((t) => [t.language, t.targetId]));
  const targetFolder = folderId ?? source.settings.folder_id ?? '';

  for (const language of job.languages) {
    const item: JobItem = { language, state: 'kept' };
    try {
      if (language === account.sourceLanguage) {
        throw new LocalizedError('This is the language of the campaign itself.', 'sameLanguage');
      }
      const existingId = drafts.get(language);
      let target: Campaign | undefined = existingId ? await mailchimp.campaign(existingId) : undefined;
      // A draft that was sent (or scheduled) is left alone: a new draft is made.
      if (target && target.status !== 'save') target = undefined;
      const result = await translateCampaign({
        mailchimp,
        supertext,
        source,
        content,
        target,
        language,
        supertextTarget: supertextCode(language, account.languageCodes),
        sourceLanguage: supertextSource(account.sourceLanguage, account.languageCodes),
        politeness: account.tone,
        overwrite: job.overwrite,
        folderId: targetFolder,
      });
      Object.assign(item, result);
      if (result.targetId && result.state !== 'kept') {
        await store.saveTranslation(account.accountId, {
          sourceId: source.id,
          language,
          targetId: result.targetId,
          webId: result.webId,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      const info: ErrorInfo = errorInfo(error);
      item.state = 'failed';
      item.error = info;
      if (info.code && FATAL.has(info.code)) {
        job.items.push(item);
        return finish(store, job, 'failed', info);
      }
    }
    job.items.push(item);
    await store.saveJob(job);
  }

  // The original goes only to subscribers without a translation, if the account wants that.
  if (account.limitOriginal && (source.status === 'save' || source.status === 'paused')) {
    const languages = (await store.translations(account.accountId, source.id)).map((t) => t.language).sort();
    const segment = originalSegment(source.recipients?.segment_opts, languages);
    if (segment && languages.length > 0) {
      try {
        await mailchimp.updateCampaign(source.id, {
          recipients: { list_id: source.recipients?.list_id, segment_opts: segment },
        });
        job.originalLimited = true;
      } catch (error) {
        console.warn('Supertext: could not limit the original campaign', error);
        job.originalLimited = false;
      }
    } else if (languages.length > 0) {
      job.originalLimited = false;
    }
  }
  return finish(store, job, 'done');
}

async function finish(store: Store, job: Job, status: Job['status'], error?: ErrorInfo): Promise<Job> {
  job.status = status;
  if (error) job.error = error;
  job.finishedAt = new Date().toISOString();
  await store.saveJob(job);
  return job;
}

/** Totals for the summary line. */
export function jobTotals(job: Job): { created: number; updated: number; kept: number; failed: number } {
  const count = (state: JobItem['state']) => job.items.filter((item) => item.state === state).length;
  return { created: count('created'), updated: count('updated'), kept: count('kept'), failed: count('failed') };
}
