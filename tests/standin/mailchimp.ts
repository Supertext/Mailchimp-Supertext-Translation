import { parse } from 'node-html-parser';
import { ACCOUNT, CAMPAIGNS, FOLDERS, LIST } from './seed.js';

/**
 * A stand-in for Mailchimp's OAuth endpoints and the parts of the Marketing
 * API v3 the app uses, serving the sample account in seed.ts. It behaves like
 * Mailchimp where the app depends on it: OAuth code → token → metadata,
 * Bearer tokens, campaign lists with folder filters, replicate (titles
 * "… (copy 01)"), PATCH merging settings, sent campaigns refusing changes,
 * template sections written into the `mc:edit` elements, and folders with
 * campaign counts.
 */

export const STANDIN_CODE = 'standin-code';
export const STANDIN_TOKEN = 'standin-token';

type Json = Record<string, any>;

export interface MailchimpStandin {
  handle(request: Request): Promise<Response>;
  campaigns: Map<string, Json>;
  contents: Map<string, { html: string; plain_text?: string }>;
  folders: Map<string, { id: string; name: string }>;
  /** Every API call: method and path. */
  calls: string[];
  /** Answers with this status for content PUTs with template sections (to test the HTML fallback). */
  refuseSections?: boolean;
  /** Base URL the metadata reports as the API endpoint (set by the server). */
  apiBase: string;
}

export function createMailchimpStandin(apiBase = 'https://mailchimp.test'): MailchimpStandin {
  const campaigns = new Map<string, Json>();
  const contents = new Map<string, { html: string; plain_text?: string }>();
  for (const { html, ...campaign } of structuredClone(CAMPAIGNS)) {
    campaigns.set(campaign.id, campaign);
    contents.set(campaign.id, { html });
  }
  const folders = new Map(FOLDERS.map((folder) => [folder.id, { ...folder }]));
  let next = 1;
  let webId = 1189000;

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const problem = (status: number, title: string, detail: string) =>
    json({ type: 'https://mailchimp.com/developer/marketing/docs/errors/', title, status, detail }, status);

  const state: MailchimpStandin = {
    campaigns,
    contents,
    folders,
    calls: [],
    apiBase,
    handle: async (request) => {
      const url = new URL(request.url);
      const path = url.pathname;

      // OAuth (login.mailchimp.com)
      if (path === '/oauth2/authorize') {
        const redirect = new URL(url.searchParams.get('redirect_uri') ?? '');
        redirect.searchParams.set('code', STANDIN_CODE);
        redirect.searchParams.set('state', url.searchParams.get('state') ?? '');
        return new Response(null, { status: 302, headers: { Location: redirect.toString() } });
      }
      if (path === '/oauth2/token' && request.method === 'POST') {
        const form = new URLSearchParams(await request.text());
        if (form.get('code') !== STANDIN_CODE || !form.get('client_secret')) return json({ error: 'invalid_grant' }, 400);
        return json({ access_token: STANDIN_TOKEN, expires_in: 0, scope: null });
      }
      if (path === '/oauth2/metadata') {
        if (request.headers.get('authorization') !== `OAuth ${STANDIN_TOKEN}`) return json({ error: 'invalid_token' }, 401);
        return json({ ...ACCOUNT, api_endpoint: state.apiBase, login_url: 'https://login.mailchimp.com' });
      }

      // Marketing API
      if (!path.startsWith('/3.0/')) return problem(404, 'Resource Not Found', 'Unknown path');
      if (request.headers.get('authorization') !== `Bearer ${STANDIN_TOKEN}`) {
        return problem(401, 'API Key Invalid', 'Your request did not include a valid access token.');
      }
      const route = path.slice('/3.0/'.length);
      state.calls.push(`${request.method} ${route}`);
      const body = request.method === 'GET' || request.method === 'DELETE' ? {} : ((await request.json().catch(() => ({}))) as Json);

      if (route === 'ping') return json({ health_status: "Everything's Chimpy!" });

      if (route === 'campaigns' && request.method === 'GET') {
        let list = [...campaigns.values()];
        const folder = url.searchParams.get('folder_id');
        const status = url.searchParams.get('status');
        if (folder) list = list.filter((c) => (c.settings.folder_id ?? '') === folder);
        if (status) list = list.filter((c) => c.status === status);
        list.sort((a, b) => String(b.create_time).localeCompare(String(a.create_time)));
        const offset = Number(url.searchParams.get('offset') ?? 0);
        const count = Number(url.searchParams.get('count') ?? 10);
        return json({ campaigns: list.slice(offset, offset + count), total_items: list.length });
      }

      let match = route.match(/^campaigns\/([^/]+)$/);
      if (match) {
        const campaign = campaigns.get(match[1]);
        if (!campaign) return problem(404, 'Resource Not Found', 'The requested resource could not be found.');
        if (request.method === 'GET') return json(campaign);
        if (request.method === 'DELETE') {
          campaigns.delete(campaign.id);
          contents.delete(campaign.id);
          return new Response(null, { status: 204 });
        }
        if (request.method === 'PATCH') {
          if (campaign.status === 'sent') {
            return problem(400, 'Bad Request', 'This campaign has already been sent and cannot be updated.');
          }
          if (body.settings?.folder_id && !folders.has(body.settings.folder_id)) {
            return problem(400, 'Invalid Resource', 'The folder does not exist.');
          }
          campaign.settings = { ...campaign.settings, ...(body.settings ?? {}) };
          if (body.recipients) {
            campaign.recipients = { ...campaign.recipients, ...body.recipients, list_name: LIST.name };
          }
          return json(campaign);
        }
      }

      match = route.match(/^campaigns\/([^/]+)\/actions\/replicate$/);
      if (match && request.method === 'POST') {
        const source = campaigns.get(match[1]);
        if (!source) return problem(404, 'Resource Not Found', 'The requested resource could not be found.');
        const copy = structuredClone(source);
        copy.id = `c-copy-${next++}`;
        copy.web_id = webId++;
        copy.status = 'save';
        copy.create_time = new Date(Date.parse(source.create_time) + next * 1000).toISOString();
        delete copy.send_time;
        delete copy.emails_sent;
        copy.settings.title = `${source.settings.title} (copy 01)`;
        campaigns.set(copy.id, copy);
        contents.set(copy.id, structuredClone(contents.get(source.id)!));
        return json(copy);
      }

      match = route.match(/^campaigns\/([^/]+)\/content$/);
      if (match) {
        const campaign = campaigns.get(match[1]);
        if (!campaign) return problem(404, 'Resource Not Found', 'The requested resource could not be found.');
        if (request.method === 'GET') return json(contents.get(campaign.id) ?? {});
        if (request.method === 'PUT') {
          if (campaign.status === 'sent') return problem(400, 'Bad Request', 'Cannot update the content of a sent campaign.');
          if (body.template) {
            if (state.refuseSections) return problem(400, 'Invalid Resource', 'The template has no such sections.');
            const root = parse(contents.get(campaign.id)!.html, { comment: true });
            for (const [name, html] of Object.entries(body.template.sections as Record<string, string>)) {
              const element = root.querySelectorAll('*').find((e) => e.getAttribute('mc:edit') === name);
              if (!element) return problem(400, 'Invalid Resource', `No editable section "${name}".`);
              element.set_content(html);
            }
            contents.set(campaign.id, { html: root.toString() });
          } else if (body.html !== undefined) {
            contents.set(campaign.id, { html: body.html });
            if (campaign.content_type === 'template' || campaign.content_type === 'drag_and_drop') campaign.content_type = 'html';
          } else if (body.plain_text !== undefined) {
            contents.set(campaign.id, { html: '', plain_text: body.plain_text });
          }
          return json(contents.get(campaign.id));
        }
      }

      if (route.startsWith('campaign-folders')) {
        const count = (id: string) => [...campaigns.values()].filter((c) => c.settings.folder_id === id).length;
        if (route.startsWith('campaign-folders?') || route === 'campaign-folders') {
          if (request.method === 'GET') {
            return json({ folders: [...folders.values()].map((f) => ({ ...f, count: count(f.id) })), total_items: folders.size });
          }
          if (request.method === 'POST') {
            const folder = { id: `f-${next++}`, name: String(body.name ?? '') };
            folders.set(folder.id, folder);
            return json({ ...folder, count: 0 });
          }
        }
        match = route.match(/^campaign-folders\/([^/]+)$/);
        const folder = match ? folders.get(match[1]) : undefined;
        if (!folder) return problem(404, 'Resource Not Found', 'The requested resource could not be found.');
        if (request.method === 'PATCH') {
          folder.name = String(body.name ?? folder.name);
          return json({ ...folder, count: count(folder.id) });
        }
        if (request.method === 'DELETE') {
          // Mailchimp moves the folder's campaigns out of it.
          for (const c of campaigns.values()) if (c.settings.folder_id === folder.id) c.settings.folder_id = '';
          folders.delete(folder.id);
          return new Response(null, { status: 204 });
        }
      }
      return problem(404, 'Resource Not Found', `No route for ${request.method} ${route}`);
    },
  };
  return state;
}

/** Moves a campaign into a folder, as an editor would in Mailchimp's campaign list. */
export function moveToFolder(standin: MailchimpStandin, campaignId: string, folderId: string): void {
  const campaign = standin.campaigns.get(campaignId);
  if (!campaign) throw new Error(`No campaign ${campaignId}`);
  campaign.settings.folder_id = folderId;
}
