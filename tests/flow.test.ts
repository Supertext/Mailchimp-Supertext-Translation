import { describe, expect, it } from 'vitest';
import { services } from '../src/app.js';
import { pollAccount } from '../src/translation/folders.js';
import { ACCOUNT_ID, setup, STANDARD_SETTINGS } from './helpers.js';
import { moveToFolder } from './standin/mailchimp.js';

const folderId = (env: ReturnType<typeof setup>, name: string) =>
  [...env.mailchimp.folders.values()].find((folder) => folder.name === name)?.id;

describe('connecting Mailchimp', () => {
  it('shows the connect page without a session', async () => {
    const env = setup();
    const page = await (await env.request('/')).text();
    expect(page).toContain('Connect Mailchimp');
    expect(page).toContain('href="/oauth/start"');
  });

  it('runs the OAuth flow, stores the account and opens the settings first', async () => {
    const env = setup();
    const callback = await env.connect();
    expect(callback.status).toBe(302);
    expect(callback.headers.get('location')).toBe('/settings');
    const account = await env.store.getAccount(ACCOUNT_ID);
    expect(account).toMatchObject({ accountName: 'Swiss Chocolate Co.', dc: 'us21', accessToken: 'standin-token' });
    const settings = await (await env.request('/settings')).text();
    expect(settings).toContain('Swiss Chocolate Co.');
    expect(settings).toContain('https://www.supertext.com/person/en/account/signin');
    expect(settings).toContain('https://www.supertext.com/en/integrations/api');
  });

  it('refuses a callback whose state does not match', async () => {
    const env = setup();
    const response = await env.request('/oauth/callback?code=standin-code&state=forged');
    expect(response.headers.get('location')).toBe('/?error=session');
    expect(await env.store.getAccount(ACCOUNT_ID)).toBeUndefined();
  });

  it('goes back to the start page when the user declines', async () => {
    const env = setup();
    await env.request('/oauth/start');
    const response = await env.request('/oauth/callback?error=access_denied');
    expect(response.headers.get('location')).toBe('/?denied=1');
  });

  it('refuses API calls without the CSRF token', async () => {
    const env = setup();
    await env.connect();
    const response = await env.request('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: 'c-autumn', languages: ['de'] }),
    });
    expect(response.status).toBe(403);
  });
});

describe('settings', () => {
  it('saves languages and creates the Supertext folders in the interface language', async () => {
    const env = setup();
    await env.connect();
    const saved = await env.saveSettings(STANDARD_SETTINGS);
    expect(saved.headers.get('location')).toBe('/settings?saved=1');
    const account = (await env.store.getAccount(ACCOUNT_ID))!;
    expect(account.targets).toEqual(['de', 'fr']);
    expect(account.languageCodes).toEqual({ de: 'de-CH', fr: 'fr-CH' });
    const names = [...env.mailchimp.folders.values()].map((folder) => folder.name).sort();
    expect(names).toEqual(['Seasonal', 'Supertext → All languages', 'Supertext → French', 'Supertext → German']);

    // Fewer languages and German folder names: renamed, the unused (empty) folder removed.
    await env.request('/settings?lang=de');
    await env.saveSettings(STANDARD_SETTINGS.filter(([name, value]) => !(name === 'target' && value === 'fr')));
    const after = [...env.mailchimp.folders.values()].map((folder) => folder.name).sort();
    expect(after).toEqual(['Seasonal', 'Supertext → Alle Sprachen', 'Supertext → Deutsch']);
  });

  it('removes the folders when the folder trigger is turned off, and keeps one way on', async () => {
    const env = setup();
    await env.connect();
    await env.saveSettings(STANDARD_SETTINGS);
    const off = await env.saveSettings(STANDARD_SETTINGS.filter(([name]) => name !== 'folderTrigger' && name !== 'appTrigger'));
    expect(off.headers.get('location')).toContain('bothOff=1');
    expect([...env.mailchimp.folders.values()].map((folder) => folder.name)).toEqual(['Seasonal']);
    expect((await env.store.getAccount(ACCOUNT_ID))!.appTrigger).toBe(true);
  });

  it('reports invalid language codes and keeps the rest', async () => {
    const env = setup();
    await env.connect();
    const saved = await env.saveSettings([...STANDARD_SETTINGS.filter(([name]) => name !== 'code:fr'), ['code:fr', 'french!']]);
    expect(decodeURIComponent(saved.headers.get('location')!)).toContain('invalid=french!');
    expect((await env.store.getAccount(ACCOUNT_ID))!.languageCodes).toEqual({ de: 'de-CH' });
  });

  it('stores the API key encrypted-ready and tests it', async () => {
    const env = setup();
    await env.connect();
    await env.saveSettings([...STANDARD_SETTINGS, ['apiKey', 'Supertext-Auth-Key own-key']]);
    expect((await env.store.getAccount(ACCOUNT_ID))!.apiKey).toBe('Supertext-Auth-Key own-key');
    const ok = await (await env.api('POST', '/api/test', {})).json();
    expect(ok).toEqual({ ok: true, message: 'Connected. The API key works.' });
    const bad = await (await env.api('POST', '/api/test', { apiKey: 'invalid' })).json();
    expect(bad.ok).toBe(false);
    expect(bad.message).toMatch(/^Authentication failed/);
  });

  it('shows the version linked to its release', async () => {
    const env = setup();
    await env.connect();
    const page = await (await env.request('/settings')).text();
    expect(page).toMatch(/Supertext Translation for Mailchimp, version <a href="https:\/\/github.com\/Supertext\/Mailchimp-Supertext-Translation\/releases\/tag\/v\d+\.\d+\.\d+"/);
  });
});

describe('translating from the app', () => {
  it('lists campaigns and creates one draft per language with translated texts and segments', async () => {
    const env = setup();
    await env.connect();
    await env.saveSettings(STANDARD_SETTINGS);
    const page = await (await env.request('/')).text();
    expect(page).toContain('Autumn newsletter');
    expect(page).toContain('Advent calendar offer');

    const started = await env.api('POST', '/api/jobs', { campaignId: 'c-autumn', languages: ['de', 'fr'] });
    expect(started.status).toBe(200);
    const { id } = await started.json();
    await env.settle();
    const job = await (await env.api('GET', `/api/jobs/${id}`)).json();
    expect(job.status).toBe('done');
    expect(job.html).toContain('Done: 2 created, 0 updated, 0 kept, 0 failed.');
    expect(job.html).toContain('https://us21.admin.mailchimp.com/campaigns/show/?id=');

    const drafts = [...env.mailchimp.campaigns.values()].filter((c) => c.id.startsWith('c-copy-'));
    expect(drafts.map((c) => c.settings.title).sort()).toEqual(['Autumn newsletter · DE', 'Autumn newsletter · FR']);
    const german = drafts.find((c) => c.settings.title.endsWith('DE'))!;
    expect(german.settings.subject_line).toBe('Unsere Herbstschokoladen sind da');
    expect(german.settings.preview_text).toBe('Drei neue Pralinen und eine Degustation in Zürich');
    expect(german.recipients.segment_opts).toEqual({
      match: 'all',
      conditions: [{ condition_type: 'Language', field: 'language', op: 'is', value: 'de' }],
    });
    const html = env.mailchimp.contents.get(german.id)!.html;
    expect(html).toContain('<h1>Hallo *|FNAME|*, der Herbst ist da</h1>');
    expect(html).toContain('<strong>drei neue Pralinen</strong>');
    expect(html).toContain('<a href="*|UNSUB|*">Abmelden</a>');
    // Outside the editable sections the template stays as it is (as in Mailchimp's editor).
    expect(html).toContain('alt="Swiss Chocolate Co. logo"');
    expect(html).toContain('*|LIST:ADDRESSLINE|*');
    expect(html).toContain('<!--[if gte mso 15]>');
    expect(html).not.toContain('data-st-a');
    // Written into the template's editable sections, so the draft stays a template campaign.
    expect(german.content_type).toBe('template');
    expect(env.mailchimp.calls).toContain(`PUT campaigns/${german.id}/content`);

    // Supertext got the language pair and one document per language.
    expect(env.supertext.documents.map((d) => [d.source, d.target])).toEqual([
      ['en', 'de-CH'],
      ['en', 'fr-CH'],
    ]);

    // The original now goes only to subscribers without German or French.
    expect(env.mailchimp.campaigns.get('c-autumn')!.recipients.segment_opts).toEqual({
      match: 'all',
      conditions: [
        { condition_type: 'Language', field: 'language', op: 'not', value: 'de' },
        { condition_type: 'Language', field: 'language', op: 'not', value: 'fr' },
      ],
    });

    // The list shows the drafts, and the drafts themselves aren't offered.
    const list = await (await env.request('/')).text();
    expect(list.match(/badge done/g)?.length).toBe(2);
    expect(list).not.toContain('Autumn newsletter · DE');
  });

  it('keeps existing drafts unless asked to update them', async () => {
    const env = setup();
    await env.connect();
    await env.saveSettings(STANDARD_SETTINGS);
    await env.api('POST', '/api/jobs', { campaignId: 'c-advent', languages: ['de'] });
    await env.settle();
    const draft = [...env.mailchimp.campaigns.values()].find((c) => c.settings.title === 'Advent calendar offer · DE')!;
    env.mailchimp.contents.get(draft.id)!.html = '<p>Edited by hand</p>';

    const kept = await (await env.api('POST', '/api/jobs', { campaignId: 'c-advent', languages: ['de'] })).json();
    await env.settle();
    expect((await env.store.getJob(ACCOUNT_ID, kept.id))!.items[0].state).toBe('kept');
    expect(env.mailchimp.contents.get(draft.id)!.html).toBe('<p>Edited by hand</p>');

    const updated = await (await env.api('POST', '/api/jobs', { campaignId: 'c-advent', languages: ['de'], overwrite: true })).json();
    await env.settle();
    expect((await env.store.getJob(ACCOUNT_ID, updated.id))!.items[0]).toMatchObject({ state: 'updated', targetId: draft.id });
    expect(env.mailchimp.contents.get(draft.id)!.html).toContain('24 kleine Überraschungen');
    // An HTML campaign gets its whole HTML translated, alt texts included.
    expect(env.mailchimp.contents.get(draft.id)!.html).toContain('alt="Logo von Swiss Chocolate Co."');
    expect([...env.mailchimp.campaigns.values()].filter((c) => c.settings.title === 'Advent calendar offer · DE')).toHaveLength(1);
  });

  it("combines the original's own segment with the language", async () => {
    const env = setup();
    await env.connect();
    await env.saveSettings(STANDARD_SETTINGS);
    await env.api('POST', '/api/jobs', { campaignId: 'c-advent', languages: ['fr'] });
    await env.settle();
    const draft = [...env.mailchimp.campaigns.values()].find((c) => c.settings.title === 'Advent calendar offer · FR')!;
    expect(draft.settings.folder_id).toBe('f-seasonal');
    expect(draft.recipients.segment_opts.conditions).toEqual([
      { condition_type: 'Interests', field: 'interests-123', op: 'interestcontains', value: ['456'] },
      { condition_type: 'Language', field: 'language', op: 'is', value: 'fr' },
    ]);
  });

  it('falls back to HTML when Mailchimp refuses the template sections', async () => {
    const env = setup();
    env.mailchimp.refuseSections = true;
    await env.connect();
    await env.saveSettings(STANDARD_SETTINGS);
    const { id } = await (await env.api('POST', '/api/jobs', { campaignId: 'c-autumn', languages: ['de'] })).json();
    await env.settle();
    const job = (await env.store.getJob(ACCOUNT_ID, id))!;
    expect(job.items[0]).toMatchObject({ state: 'created', notes: ['html'] });
    const panel = await (await env.api('GET', `/api/jobs/${id}`)).json();
    expect(panel.html).toContain("Saved as HTML: edit it with Mailchimp&#39;s code editor.");
  });

  it('stops on an invalid Supertext key and leaves no half-made draft', async () => {
    const env = setup({ SUPERTEXT_API_KEY: 'invalid' });
    await env.connect();
    await env.saveSettings(STANDARD_SETTINGS);
    const { id } = await (await env.api('POST', '/api/jobs', { campaignId: 'c-autumn', languages: ['de', 'fr'] })).json();
    await env.settle();
    const job = (await env.store.getJob(ACCOUNT_ID, id))!;
    expect(job.status).toBe('failed');
    expect(job.error?.code).toBe('auth');
    expect(job.items).toHaveLength(1);
    expect([...env.mailchimp.campaigns.keys()].filter((key) => key.startsWith('c-copy-'))).toEqual([]);
  });

  it('skips a language Supertext refuses and goes on with the others', async () => {
    const env = setup();
    await env.connect();
    await env.saveSettings([...STANDARD_SETTINGS.filter(([name]) => name !== 'code:fr'), ['code:fr', 'fr-Latn']]);
    const { id } = await (await env.api('POST', '/api/jobs', { campaignId: 'c-autumn', languages: ['de', 'fr'] })).json();
    await env.settle();
    const job = (await env.store.getJob(ACCOUNT_ID, id))!;
    expect(job.status).toBe('done');
    expect(job.items.map((item) => [item.language, item.state, item.error?.code])).toEqual([
      ['de', 'created', undefined],
      ['fr', 'failed', 'languagePair'],
    ]);
  });

  it('refuses to translate a draft Supertext made', async () => {
    const env = setup();
    await env.connect();
    await env.saveSettings(STANDARD_SETTINGS);
    await env.api('POST', '/api/jobs', { campaignId: 'c-autumn', languages: ['de'] });
    await env.settle();
    const draft = [...env.mailchimp.campaigns.values()].find((c) => c.id.startsWith('c-copy-'))!;
    const { id } = await (await env.api('POST', '/api/jobs', { campaignId: draft.id, languages: ['fr'] })).json();
    await env.settle();
    expect((await env.store.getJob(ACCOUNT_ID, id))!.error?.code).toBe('isTranslation');
  });

  it('accepts only the languages of the settings', async () => {
    const env = setup();
    await env.connect();
    await env.saveSettings(STANDARD_SETTINGS);
    const response = await env.api('POST', '/api/jobs', { campaignId: 'c-autumn', languages: ['ja'] });
    expect(response.status).toBe(400);
  });
});

describe('translating from a Supertext folder', () => {
  it('translates a campaign moved into a folder and moves it back', async () => {
    const env = setup();
    await env.connect();
    await env.saveSettings(STANDARD_SETTINGS);
    const account = (await env.store.getAccount(ACCOUNT_ID))!;
    const deps = { ...services({ config: env.config, store: env.store, fetch: env.fetchFn }).jobDeps, onJob: env.onJob };

    // First look: remembers where every campaign is.
    expect((await pollAccount(deps, account)).started).toEqual([]);

    moveToFolder(env.mailchimp, 'c-advent', folderId(env, 'Supertext → German')!);
    const first = await pollAccount(deps, account);
    expect(first.started).toHaveLength(1);
    await env.settle();
    expect(env.mailchimp.campaigns.get('c-advent')!.settings.folder_id).toBe('f-seasonal');
    const titles = [...env.mailchimp.campaigns.values()].map((c) => c.settings.title);
    expect(titles).toContain('Advent calendar offer · DE');
    expect(titles).not.toContain('Advent calendar offer · FR');
    const job = (await env.store.getJob(ACCOUNT_ID, first.started[0]))!;
    expect(job).toMatchObject({ trigger: 'folder', status: 'done', languages: ['de'] });

    // Nothing to do on the next look.
    expect((await pollAccount(deps, account)).started).toEqual([]);

    // "All languages" translates into both and replaces the German draft.
    moveToFolder(env.mailchimp, 'c-advent', folderId(env, 'Supertext → All languages')!);
    const again = await pollAccount(deps, account);
    await env.settle();
    const second = (await env.store.getJob(ACCOUNT_ID, again.started[0]))!;
    expect(second.items.map((item) => [item.language, item.state])).toEqual([
      ['de', 'updated'],
      ['fr', 'created'],
    ]);
  });

  it('translates a sent campaign once, even though it cannot be moved back', async () => {
    const env = setup();
    await env.connect();
    await env.saveSettings(STANDARD_SETTINGS);
    const account = (await env.store.getAccount(ACCOUNT_ID))!;
    const deps = { ...services({ config: env.config, store: env.store, fetch: env.fetchFn }).jobDeps, onJob: env.onJob };
    await pollAccount(deps, account);
    moveToFolder(env.mailchimp, 'c-summer', folderId(env, 'Supertext → French')!);
    expect((await pollAccount(deps, account)).started).toHaveLength(1);
    await env.settle();
    expect((await pollAccount(deps, account)).started).toHaveLength(0);
    const draft = [...env.mailchimp.campaigns.values()].find((c) => c.settings.title === 'Summer sale · FR')!;
    expect(draft.settings.subject_line).toBe('Soldes d’été : 20 % sur les pralines glacées');
    expect(draft.status).toBe('save');
  });
});

describe('disconnecting', () => {
  it('removes the empty folders and all data of the account', async () => {
    const env = setup();
    await env.connect();
    await env.saveSettings(STANDARD_SETTINGS);
    const csrf = await env.csrf();
    const response = await env.request('/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrf }).toString(),
    });
    expect(response.headers.get('location')).toBe('/?disconnected=1');
    expect(await env.store.getAccount(ACCOUNT_ID)).toBeUndefined();
    expect([...env.mailchimp.folders.values()].map((folder) => folder.name)).toEqual(['Seasonal']);
    expect(await (await env.request('/?disconnected=1')).text()).toContain('Mailchimp is disconnected.');
  });
});
