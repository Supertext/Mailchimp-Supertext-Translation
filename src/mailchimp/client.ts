import { LocalizedError } from '../i18n/error.js';
import { retryDelayMs } from '../supertext/client.js';

/**
 * The Mailchimp calls this app needs: the OAuth code exchange and account
 * metadata, and the Marketing API v3 for campaigns, their content and
 * campaign folders.
 */

export class MailchimpError extends LocalizedError {
  constructor(
    message: string,
    code: string,
    options: { status?: number; detail?: string; params?: Record<string, string | number> } = {},
  ) {
    super(message, code, options.params ?? {}, options.detail);
    this.name = 'MailchimpError';
    this.status = options.status;
  }

  public readonly status?: number;
}

export interface Metadata {
  dc: string;
  apiEndpoint: string;
  accountName: string;
  accountId: string;
}

export interface SegmentCondition {
  condition_type?: string;
  field: string;
  op: string;
  value?: unknown;
}

export interface SegmentOpts {
  saved_segment_id?: number;
  match?: 'any' | 'all';
  conditions?: SegmentCondition[];
}

export interface Campaign {
  id: string;
  web_id?: number;
  type: string;
  status: string;
  content_type?: string;
  create_time?: string;
  send_time?: string;
  emails_sent?: number;
  recipients?: { list_id?: string; list_name?: string; segment_opts?: SegmentOpts; segment_text?: string };
  settings: {
    title?: string;
    subject_line?: string;
    preview_text?: string;
    from_name?: string;
    reply_to?: string;
    folder_id?: string;
    template_id?: number;
  };
}

export interface CampaignContent {
  html?: string;
  plain_text?: string;
  variate_contents?: unknown[];
}

export interface Folder {
  id: string;
  name: string;
  count?: number;
}

export interface MailchimpClientOptions {
  /** Marketing API base, e.g. https://us21.api.mailchimp.com (from the metadata). */
  apiEndpoint: string;
  accessToken: string;
  /** Injected for tests. */
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

/** Retries after HTTP 429 (Mailchimp allows 10 simultaneous connections per user). */
const RATE_LIMIT_RETRIES = 4;

export class MailchimpClient {
  private readonly base: string;
  private readonly fetchFn: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(private readonly options: MailchimpClientOptions) {
    if (!options.accessToken) {
      throw new MailchimpError('Mailchimp is not connected.', 'notConnected');
    }
    this.base = options.apiEndpoint.replace(/\/+$/, '') + '/3.0/';
    this.fetchFn = options.fetch ?? fetch;
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  /** Regular and plain-text campaigns, newest first. */
  async campaigns(options: { offset?: number; count?: number; status?: string; folderId?: string } = {}) {
    const query = new URLSearchParams({
      count: String(options.count ?? 25),
      offset: String(options.offset ?? 0),
      sort_field: 'create_time',
      sort_dir: 'DESC',
      fields:
        'total_items,campaigns.id,campaigns.web_id,campaigns.type,campaigns.status,campaigns.content_type,campaigns.create_time,campaigns.send_time,campaigns.settings.title,campaigns.settings.subject_line,campaigns.settings.folder_id,campaigns.recipients.list_name',
    });
    if (options.status) query.set('status', options.status);
    if (options.folderId) query.set('folder_id', options.folderId);
    const data = await this.json<{ campaigns?: Campaign[]; total_items?: number }>('GET', `campaigns?${query}`);
    return { campaigns: data.campaigns ?? [], total: data.total_items ?? 0 };
  }

  /** ID, title and folder of every campaign (for the folder check), up to `limit`. */
  async campaignFolders(limit = 5000): Promise<{ id: string; status: string; title: string; folderId: string }[]> {
    const result: { id: string; status: string; title: string; folderId: string }[] = [];
    for (let offset = 0; offset < limit; offset += 1000) {
      const query = new URLSearchParams({
        count: '1000',
        offset: String(offset),
        fields: 'total_items,campaigns.id,campaigns.status,campaigns.settings.title,campaigns.settings.folder_id',
      });
      const data = await this.json<{ campaigns?: Campaign[]; total_items?: number }>('GET', `campaigns?${query}`);
      for (const c of data.campaigns ?? []) {
        result.push({ id: c.id, status: c.status, title: c.settings?.title ?? '', folderId: c.settings?.folder_id ?? '' });
      }
      if (!data.campaigns || data.campaigns.length < 1000 || result.length >= (data.total_items ?? 0)) break;
    }
    return result;
  }

  /** The campaign, or undefined if it no longer exists. */
  async campaign(id: string): Promise<Campaign | undefined> {
    try {
      return await this.json<Campaign>('GET', `campaigns/${encodeURIComponent(id)}`);
    } catch (error) {
      if (error instanceof MailchimpError && error.status === 404) return undefined;
      throw error;
    }
  }

  async replicate(id: string): Promise<Campaign> {
    return this.json<Campaign>('POST', `campaigns/${encodeURIComponent(id)}/actions/replicate`);
  }

  async updateCampaign(
    id: string,
    patch: { settings?: Partial<Campaign['settings']>; recipients?: { list_id?: string; segment_opts?: SegmentOpts } },
  ): Promise<Campaign> {
    return this.json<Campaign>('PATCH', `campaigns/${encodeURIComponent(id)}`, patch);
  }

  async deleteCampaign(id: string): Promise<void> {
    await this.request('DELETE', `campaigns/${encodeURIComponent(id)}`);
  }

  async content(id: string): Promise<CampaignContent> {
    return this.json<CampaignContent>('GET', `campaigns/${encodeURIComponent(id)}/content`);
  }

  /** Raw HTML, plain text, or a template's editable sections. */
  async setContent(
    id: string,
    content: { html?: string; plain_text?: string; template?: { id: number; sections: Record<string, string> } },
  ): Promise<void> {
    await this.request('PUT', `campaigns/${encodeURIComponent(id)}/content`, content);
  }

  async folders(): Promise<Folder[]> {
    const data = await this.json<{ folders?: Folder[] }>('GET', 'campaign-folders?count=1000');
    return data.folders ?? [];
  }

  async createFolder(name: string): Promise<Folder> {
    const data = await this.json<Folder & { folders?: Folder[] }>('POST', 'campaign-folders', { name });
    // The reference documents a list in the response; the API returns the folder itself.
    return data.id ? data : (data.folders?.[0] as Folder);
  }

  async renameFolder(id: string, name: string): Promise<void> {
    await this.request('PATCH', `campaign-folders/${encodeURIComponent(id)}`, { name });
  }

  async deleteFolder(id: string): Promise<void> {
    await this.request('DELETE', `campaign-folders/${encodeURIComponent(id)}`);
  }

  /** Cheap check that the token works. */
  async ping(): Promise<void> {
    await this.request('GET', 'ping');
  }

  private async json<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await this.request(method, path, body);
    return (await response.json().catch(() => ({}))) as T;
  }

  private async request(method: string, path: string, body?: unknown): Promise<Response> {
    let response: Response;
    for (let attempt = 0; ; attempt++) {
      try {
        response = await this.fetchFn(this.base + path, {
          method,
          headers: {
            Authorization: `Bearer ${this.options.accessToken}`,
            Accept: 'application/json',
            ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(30_000),
        });
      } catch (error) {
        const reason = (error as Error).message;
        throw new MailchimpError(`Could not reach Mailchimp: ${reason}`, 'mailchimpUnreachable', { params: { reason } });
      }
      if (response.status !== 429 || attempt >= RATE_LIMIT_RETRIES) break;
      await response.body?.cancel().catch(() => undefined);
      await this.sleep(retryDelayMs(attempt, response.headers.get('retry-after')));
    }
    if (response.ok) return response;
    throw await mailchimpError(response);
  }
}

/** A MailchimpError for a failed response; Mailchimp's own `detail` is kept, untranslated. */
async function mailchimpError(response: Response): Promise<MailchimpError> {
  const status = response.status;
  const text = await response.text().catch(() => '');
  let detail = '';
  try {
    const data = JSON.parse(text) as { detail?: string; title?: string; errors?: { field?: string; message?: string }[] };
    const fields = (data.errors ?? []).map((e) => [e.field, e.message].filter(Boolean).join(': ')).join('; ');
    detail = [data.detail, fields].filter(Boolean).join(' ');
  } catch {
    detail = text.replace(/<[^>]*>/g, '').trim();
  }
  detail = detail.slice(0, 300);
  const options = { status, detail: detail || undefined, params: { status } };
  if (status === 401) {
    return new MailchimpError('Mailchimp refused the connection. Connect Mailchimp again.', 'mailchimpAuth', options);
  }
  if (status === 403) return new MailchimpError('Mailchimp refused the request.', 'mailchimpForbidden', options);
  if (status === 404) return new MailchimpError('Not found in Mailchimp.', 'mailchimpNotFound', options);
  if (status === 429) return new MailchimpError('Too many requests to Mailchimp.', 'mailchimpRateLimited', options);
  if (status >= 500) return new MailchimpError('Mailchimp is currently unavailable.', 'mailchimpUnavailable', options);
  return new MailchimpError(`Mailchimp answered with HTTP ${status}.`, 'mailchimpHttp', options);
}

export interface OAuthOptions {
  loginBase: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  fetch?: typeof fetch;
}

/** Where to send the user to authorise the app. */
export function authorizeUrl(options: OAuthOptions, state: string): string {
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: options.clientId,
    redirect_uri: options.redirectUri,
    state,
  });
  return `${options.loginBase}/oauth2/authorize?${query}`;
}

/** Exchanges the code for an access token and reads the account's data center and name. */
export async function exchangeCode(options: OAuthOptions, code: string): Promise<{ accessToken: string; metadata: Metadata }> {
  const fetchFn = options.fetch ?? fetch;
  const call = async (url: string, init: RequestInit) => {
    try {
      return await fetchFn(url, { ...init, signal: AbortSignal.timeout(30_000) });
    } catch (error) {
      const reason = (error as Error).message;
      throw new MailchimpError(`Could not reach Mailchimp: ${reason}`, 'mailchimpUnreachable', { params: { reason } });
    }
  };
  const tokenResponse = await call(`${options.loginBase}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: options.clientId,
      client_secret: options.clientSecret,
      redirect_uri: options.redirectUri,
      code,
    }),
  });
  const token = (await tokenResponse.json().catch(() => ({}))) as { access_token?: string; error?: string };
  if (!tokenResponse.ok || !token.access_token) {
    throw new MailchimpError('Mailchimp did not grant access.', 'oauthFailed', { detail: token.error });
  }
  const metaResponse = await call(`${options.loginBase}/oauth2/metadata`, {
    headers: { Authorization: `OAuth ${token.access_token}`, Accept: 'application/json' },
  });
  const meta = (await metaResponse.json().catch(() => ({}))) as {
    dc?: string;
    api_endpoint?: string;
    accountname?: string;
    user_id?: number | string;
  };
  if (!metaResponse.ok || !meta.dc || meta.user_id === undefined) {
    throw new MailchimpError('Mailchimp did not return the account details.', 'oauthFailed');
  }
  return {
    accessToken: token.access_token,
    metadata: {
      dc: meta.dc,
      apiEndpoint: meta.api_endpoint || `https://${meta.dc}.api.mailchimp.com`,
      accountName: meta.accountname ?? '',
      accountId: String(meta.user_id),
    },
  };
}

/** The campaign in Mailchimp's web app. */
export const campaignUrl = (dc: string, webId: number | undefined): string | undefined =>
  dc && webId ? `https://${dc}.admin.mailchimp.com/campaigns/show/?id=${webId}` : undefined;
