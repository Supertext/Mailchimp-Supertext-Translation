import { LocalizedError } from '../i18n/error.js';
import { MailchimpError, type Campaign, type CampaignContent, type MailchimpClient } from '../mailchimp/client.js';
import { EmailDocument, plainSegment, segmentResult, type EmailSegment } from '../mailchimp/email-html.js';
import { MAX_DOCUMENT_CHARACTERS, type Politeness, type SupertextClient } from '../supertext/client.js';
import { buildDocument, parseDocument } from '../supertext/html.js';
import type { JobItem } from '../store/store.js';
import { translationSegment } from './segments.js';

/**
 * One campaign × one language: translate the subject line, preview text and
 * content in one Supertext document, then write them to the language's
 * draft — a replica of the original, made for the purpose, or the draft made
 * earlier when it is to be updated.
 */

export interface TranslateArgs {
  mailchimp: Pick<MailchimpClient, 'replicate' | 'updateCampaign' | 'setContent' | 'deleteCampaign'>;
  supertext: Pick<SupertextClient, 'translateDocument'>;
  source: Campaign;
  content: CampaignContent;
  /** The language's existing draft (status "save"), if there is one. */
  target?: Campaign;
  /** Mailchimp language code ("de"). */
  language: string;
  /** Supertext target code ("de-CH"). */
  supertextTarget: string;
  sourceLanguage: string;
  politeness: Politeness;
  /** Replace an existing draft (else it is kept). */
  overwrite: boolean;
  /** Folder of the original, where the draft goes too. */
  folderId: string;
}

export type TranslateResult = Pick<JobItem, 'state' | 'targetId' | 'webId' | 'notes'>;

const TEMPLATE_TYPES = new Set(['template', 'drag_and_drop']);

export async function translateCampaign(args: TranslateArgs): Promise<TranslateResult> {
  const { source, content, target } = args;
  if (target && !args.overwrite) {
    return { state: 'kept', targetId: target.id, webId: target.web_id };
  }

  // What to translate.
  const plainText = source.type === 'plaintext';
  const document = plainText ? undefined : new EmailDocument(content.html ?? '');
  const head: EmailSegment[] = [];
  const subject = source.settings.subject_line ?? '';
  const preview = source.settings.preview_text ?? '';
  if (subject.trim()) head.push(plainSegment(subject));
  if (preview.trim()) head.push(plainSegment(preview));
  const body: EmailSegment[] = plainText ? [plainSegment(content.plain_text ?? '')] : document!.segments;
  const segments = [...head, ...body];

  const translated = await translateSegments(args, segments);
  let index = 0;
  const translatedSubject = subject.trim() ? segmentResult(head[index], translated.get(index++)!) : subject;
  const translatedPreview = preview.trim() ? segmentResult(head[index], translated.get(index++)!) : preview;
  const bodyTranslations = new Map<number, string>();
  body.forEach((_, i) => bodyTranslations.set(i, translated.get(head.length + i)!));
  // Checks every merge tag before anything is written to Mailchimp.
  const html = document ? document.apply(bodyTranslations) : undefined;
  const plain = plainText ? segmentResult(body[0], bodyTranslations.get(0)!) : undefined;

  // Where it goes.
  const created = target ? undefined : await args.mailchimp.replicate(source.id);
  const draft = target ?? created!;
  const notes: string[] = [];
  try {
    const { segment, combined } = translationSegment(source.recipients?.segment_opts, args.language);
    if (!combined) notes.push('segmentNotCombined');
    await args.mailchimp.updateCampaign(draft.id, {
      settings: {
        title: `${source.settings.title || subject || source.id} · ${args.language.toUpperCase()}`,
        subject_line: translatedSubject,
        preview_text: translatedPreview,
        folder_id: args.folderId,
      },
      recipients: { list_id: source.recipients?.list_id, segment_opts: segment },
    });

    if (plainText) {
      await args.mailchimp.setContent(draft.id, { plain_text: plain });
    } else if (TEMPLATE_TYPES.has(source.content_type ?? '') && source.settings.template_id && document) {
      // Keep the draft editable in Mailchimp's builder: write the template's
      // editable sections. If Mailchimp refuses, write the HTML instead.
      const sections = document.sections();
      try {
        if (Object.keys(sections).length === 0) throw new MailchimpError('No editable sections', 'noSections');
        await args.mailchimp.setContent(draft.id, { template: { id: source.settings.template_id, sections } });
        notes.push('sections');
      } catch (error) {
        if (!(error instanceof MailchimpError) || (error.status !== undefined && error.status !== 400)) throw error;
        await args.mailchimp.setContent(draft.id, { html });
        notes.push('html');
      }
    } else {
      await args.mailchimp.setContent(draft.id, { html });
    }
  } catch (error) {
    if (created) await args.mailchimp.deleteCampaign(created.id).catch(() => undefined);
    throw error;
  }
  return { state: target ? 'updated' : 'created', targetId: draft.id, webId: draft.web_id, notes };
}

/** All segments in as few Supertext documents as the size limit allows; every segment must come back. */
async function translateSegments(args: TranslateArgs, segments: EmailSegment[]): Promise<Map<number, string>> {
  const result = new Map<number, string>();
  let batch: number[] = [];
  let size = 0;
  const flush = async () => {
    if (batch.length === 0) return;
    const parts = batch.map((i) => ({ text: segments[i].html, html: true }));
    const translated = parseDocument(
      await args.supertext.translateDocument(buildDocument(parts), {
        targetLanguage: args.supertextTarget,
        sourceLanguage: args.sourceLanguage,
        politeness: args.politeness,
      }),
      parts,
    );
    batch.forEach((segmentIndex, i) => {
      const value = translated.get(i);
      if (value !== undefined) result.set(segmentIndex, value);
    });
    batch = [];
    size = 0;
  };
  for (let i = 0; i < segments.length; i++) {
    const length = segments[i].html.length + 40;
    if (size + length > MAX_DOCUMENT_CHARACTERS) await flush();
    batch.push(i);
    size += length;
  }
  await flush();
  if (result.size !== segments.length) {
    throw new LocalizedError(
      `Supertext returned ${result.size} of ${segments.length} texts; nothing was saved for this language.`,
      'incomplete',
      { received: result.size, sent: segments.length },
    );
  }
  return result;
}
