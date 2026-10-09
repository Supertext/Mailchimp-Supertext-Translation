/**
 * A look at what a real Mailchimp account returns, through the same calls the
 * app makes, to confirm what the app assumes (see docs/DEVELOPER.md →
 * Known limitations).
 *
 *   MAILCHIMP_API_KEY=…-us21 npm run mailchimp:probe -- [campaignId] [--write]
 *
 * Read-only by default: the account's folders, the latest campaigns (type,
 * content type, status, folder, template, segment), the chosen campaign's
 * content as the app would split it (segments, merge tags, editable
 * sections), and the audience's saved segments that use a language
 * condition (to compare their format with the one the app builds).
 *
 * With --write it also tries, on a throw-away copy of the campaign, what the
 * app writes: replicate, move into a new folder and out again (folder_id ""),
 * the language segment, and the content (template sections, else HTML). The
 * copy and the folder are deleted afterwards.
 *
 * An API key works like an OAuth token for these calls (Mailchimp → Profile →
 * Extras → API keys); its suffix is the data center.
 */
import { MailchimpClient, MailchimpError } from '../src/mailchimp/client.js';
import { EmailDocument } from '../src/mailchimp/email-html.js';
import { translationSegment } from '../src/translation/segments.js';

const args = process.argv.slice(2);
const write = args.includes('--write');
const chosen = args.find((arg) => !arg.startsWith('--'));
const key = process.env.MAILCHIMP_API_KEY ?? '';
const dc = process.env.MAILCHIMP_DC || key.split('-').pop() || '';
if (!key || !dc) {
  console.error('Usage: MAILCHIMP_API_KEY=<key>-<dc> npm run mailchimp:probe -- [campaignId] [--write]');
  process.exit(1);
}
const base = process.env.MAILCHIMP_API_BASE || `https://${dc}.api.mailchimp.com`;
const mailchimp = new MailchimpClient({ apiEndpoint: base, accessToken: key });
const short = (value: string, length = 80) => (value.length > length ? `${value.slice(0, length)}…` : value).replace(/\s+/g, ' ');
const KNOWN_CONTENT_TYPES = new Set(['template', 'drag_and_drop', 'html', 'url']);

async function raw(path: string): Promise<any> {
  const response = await fetch(`${base}/3.0/${path}`, { headers: { Authorization: `Bearer ${key}` } });
  return response.json();
}

async function step(name: string, run: () => Promise<unknown>): Promise<boolean> {
  try {
    const result = await run();
    console.log(`  ok    ${name}${result !== undefined ? `: ${short(JSON.stringify(result), 160)}` : ''}`);
    return true;
  } catch (error) {
    const detail = error instanceof MailchimpError ? `${error.status} ${error.detail ?? error.message}` : String(error);
    console.log(`  FAIL  ${name}: ${detail}`);
    return false;
  }
}

async function main() {
  await mailchimp.ping();
  console.log(`Connected to ${base}`);

  const folders = await mailchimp.folders();
  console.log(`\nCampaign folders (${folders.length}):`);
  for (const folder of folders) console.log(`  ${folder.id}  ${folder.name}  (${folder.count ?? '?'} campaigns)`);

  const { campaigns, total } = await mailchimp.campaigns({ count: 25 });
  console.log(`\nLatest campaigns (${campaigns.length} of ${total}):`);
  for (const c of campaigns) {
    const full = await mailchimp.campaign(c.id);
    const unknown = full?.content_type && !KNOWN_CONTENT_TYPES.has(full.content_type) ? '  ← content type the docs do not list' : '';
    console.log(
      `  ${c.id}  ${c.type}/${full?.content_type ?? '?'}  ${c.status}  folder "${c.settings.folder_id ?? ''}"  template ${full?.settings.template_id ?? '-'}  "${short(c.settings.title ?? '', 40)}"${unknown}`,
    );
    const segment = full?.recipients?.segment_opts;
    if (segment && (segment.conditions?.length || segment.saved_segment_id)) console.log(`      segment ${short(JSON.stringify(segment), 150)}`);
  }

  const campaign = chosen ? await mailchimp.campaign(chosen) : campaigns.find((c) => c.status === 'save') ?? campaigns[0];
  if (!campaign) return;
  const full = (await mailchimp.campaign(campaign.id))!;
  const content = await mailchimp.content(full.id);
  console.log(`\nCampaign ${full.id} "${full.settings.title}" (${full.type}, ${full.content_type}):`);
  console.log(`  subject "${full.settings.subject_line ?? ''}", preview "${full.settings.preview_text ?? ''}"`);
  console.log(`  html: ${content.html ? `${content.html.length} characters` : 'none'}; plain text: ${content.plain_text ? `${content.plain_text.length} characters` : 'none'}; variate contents: ${content.variate_contents?.length ?? 0}`);
  let document: EmailDocument | undefined;
  if (content.html) {
    document = new EmailDocument(content.html);
    const segments = document.segments;
    const tags = segments.flatMap((s) => s.tags);
    console.log(`  ${segments.length} segments, ${tags.length} merge tags in text (${[...new Set(tags)].join(' ')})`);
    for (const segment of segments.slice(0, 12)) console.log(`    ${segment.plain ? 'text' : 'html'}  ${short(segment.html)}`);
    console.log(`  editable sections (mc:edit): ${Object.keys(document.sections()).join(', ') || 'none'}`);
    const unchanged = document.apply(new Map(segments.map((s, i) => [i, s.html])));
    console.log(`  round trip without translation: ${unchanged === content.html ? 'identical' : `${unchanged.length - content.html.length} characters different`}`);
  }

  const listId = full.recipients?.list_id;
  if (listId) {
    const data = await raw(`lists/${listId}/segments?count=100&fields=segments.id,segments.name,segments.options`);
    const withLanguage = (data.segments ?? []).filter((s: any) => JSON.stringify(s.options ?? {}).includes('anguage'));
    console.log(`\nSaved segments of audience ${listId} with a language condition: ${withLanguage.length}`);
    for (const s of withLanguage) console.log(`  ${s.id} "${s.name}": ${short(JSON.stringify(s.options), 200)}`);
    console.log(`  the app builds: ${JSON.stringify(translationSegment(full.recipients?.segment_opts, 'de').segment)}`);
  }

  if (!write) {
    console.log('\nRead-only run. Add --write to try replicate, folders, segment and content on a throw-away copy.');
    return;
  }
  console.log('\nWrite checks on a throw-away copy:');
  const copy = await mailchimp.replicate(full.id);
  console.log(`  ok    replicate → ${copy.id} "${copy.settings.title}" (${copy.content_type}, template ${copy.settings.template_id ?? '-'})`);
  const folder = await mailchimp.createFolder('Supertext probe');
  try {
    await step('move into a folder', () => mailchimp.updateCampaign(copy.id, { settings: { folder_id: folder.id } }).then((c) => c.settings.folder_id));
    await step('move out of all folders (folder_id "")', () => mailchimp.updateCampaign(copy.id, { settings: { folder_id: '' } }).then((c) => c.settings.folder_id ?? '(none)'));
    await step('language segment', () =>
      mailchimp
        .updateCampaign(copy.id, { recipients: { list_id: listId, segment_opts: translationSegment(full.recipients?.segment_opts, 'de').segment } })
        .then((c) => c.recipients?.segment_text ?? c.recipients?.segment_opts),
    );
    if (document && full.settings.template_id) {
      const sections = document.sections();
      const ok = await step(`content as template sections (${Object.keys(sections).join(', ')})`, () =>
        mailchimp.setContent(copy.id, { template: { id: full.settings.template_id!, sections } }),
      );
      const after = await mailchimp.campaign(copy.id);
      console.log(`        content type afterwards: ${after?.content_type}`);
      if (!ok) await step('content as HTML', () => mailchimp.setContent(copy.id, { html: content.html }));
    } else if (content.html) {
      await step('content as HTML', () => mailchimp.setContent(copy.id, { html: content.html }));
    }
  } finally {
    await step('delete the copy', () => mailchimp.deleteCampaign(copy.id));
    await step('delete the probe folder', () => mailchimp.deleteFolder(folder.id));
  }
  if (full.status === 'sent') {
    await step('move a sent campaign (expected to fail if Mailchimp locks sent campaigns)', () =>
      mailchimp.updateCampaign(full.id, { settings: { folder_id: full.settings.folder_id ?? '' } }),
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? `${error.name}: ${error.message}${(error as { detail?: string }).detail ? ` (${(error as { detail?: string }).detail})` : ''}` : error);
  process.exit(1);
});
