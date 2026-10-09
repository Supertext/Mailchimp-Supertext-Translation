import { HTMLElement, parse, TextNode, type Node } from 'node-html-parser';
import { LocalizedError } from '../i18n/error.js';
import { escapeHtml } from '../supertext/html.js';

/**
 * Finds the texts in a campaign's HTML and puts the translations back.
 *
 * Supertext translates each `data-st-id` element on its own, so a whole
 * paragraph (heading, list item, table cell, button) must travel as one
 * segment with its formatting and links as inline tags. A "text block" is the
 * innermost element that has text and no block-level elements inside; its
 * inner HTML is one segment. Loose text between blocks, image alt texts and
 * link titles are plain-text segments. Styles, scripts, Outlook conditional
 * comments and everything marked `translate="no"` stay as they are.
 *
 * Mailchimp merge tags (*|FNAME|*, *|IF:…|*, *|UNSUB|*) must reach the
 * subscriber unchanged: in the text they travel as empty
 * `<span data-mc="N"></span>` placeholders and are put back afterwards (in
 * attributes Supertext doesn't translate anything anyway).
 */

const BLOCK = new Set([
  'address', 'article', 'aside', 'blockquote', 'body', 'center', 'dd', 'details', 'dialog', 'div', 'dl', 'dt',
  'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'html',
  'li', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul',
]);
const SKIP = new Set(['head', 'style', 'script', 'noscript', 'template', 'svg', 'code', 'textarea', 'select']);
const TRANSLATED_ATTRIBUTES = ['alt', 'title'];
const MARKER = 'data-st-a';

const MERGE_TAG = /\*\|[^|*]{1,200}\|\*/g;
const PLACEHOLDER = /<span\b[^>]*?\bdata-mc="(\d+)"[^>]*?(?:\/>|>\s*<\/span>)/g;

/** A text to translate: `html` is what Supertext gets (merge tags as placeholders). */
export interface EmailSegment {
  html: string;
  /** Plain text (attribute, subject line): the translation comes back as text. */
  plain: boolean;
  /** The merge tags replaced by placeholders, in order. */
  tags: string[];
}

/** True if the text has letters once merge tags and markup are left out. */
export const hasLetters = (text: string): boolean => /\p{L}/u.test(text.replace(MERGE_TAG, '').replace(/<[^>]*>/g, ''));

/** Merge tags → placeholders, outside of tags only (attributes keep theirs). */
export function protect(html: string): { html: string; tags: string[] } {
  const tags: string[] = [];
  const out = html
    .split(/(<[^>]*>)/)
    .map((part) =>
      part.startsWith('<')
        ? part
        : part.replace(MERGE_TAG, (tag) => {
            tags.push(tag);
            return `<span data-mc="${tags.length - 1}"></span>`;
          }),
    )
    .join('');
  return { html: out, tags };
}

/** Placeholders → merge tags. Every tag must come back exactly once, else the segment is refused. */
export function restore(html: string, tags: string[]): string {
  const seen = new Set<number>();
  const out = html.replace(PLACEHOLDER, (all, index: string) => {
    const i = Number(index);
    if (i >= tags.length || seen.has(i)) return '';
    seen.add(i);
    return tags[i];
  });
  if (seen.size !== tags.length) {
    throw new LocalizedError(
      `Supertext returned ${seen.size} of ${tags.length} merge tags; nothing was saved for this language.`,
      'mergeTags',
      { received: seen.size, sent: tags.length },
    );
  }
  return out;
}

/** A plain text as a segment (escaped, merge tags protected). */
export function plainSegment(text: string): EmailSegment {
  const { html, tags } = protect(escapeHtml(text));
  return { html, plain: true, tags };
}

/** The translation of a segment: HTML for text blocks, decoded text for plain segments. */
export function segmentResult(segment: EmailSegment, translated: string): string {
  const html = restore(translated, segment.tags);
  if (!segment.plain) return html;
  return parse(html.replace(/<br\s*\/?>/gi, '\n')).text.replace(/[ \t]+/g, ' ').trim();
}

interface Slot {
  segment: EmailSegment;
  apply(value: string): void;
}

/** The texts of a campaign's HTML, and a way to write their translations back. */
export class EmailDocument {
  private readonly root: HTMLElement;
  private readonly slots: Slot[] = [];

  constructor(html: string) {
    this.root = parse(html, { comment: true, blockTextElements: { script: true, style: true, pre: true } });
    const title = this.root.querySelector('head title');
    if (title && hasLetters(title.text)) {
      const node = title;
      this.add(plainSegment(node.text.trim()), (value) => node.set_content(escapeHtml(value)));
    }
    // Elements with an alt text or title get a marker first: if they sit inside
    // a text block, the block is replaced by its translation, and the marker
    // (an attribute, which Supertext keeps) finds them again there.
    const marked: [string, string, string][] = [];
    for (const element of this.root.querySelectorAll(TRANSLATED_ATTRIBUTES.map((a) => `[${a}]`).join(','))) {
      if (skipped(element)) continue;
      for (const name of TRANSLATED_ATTRIBUTES) {
        const value = element.getAttribute(name);
        if (!value || !hasLetters(value)) continue;
        const marker = String(marked.length);
        if (!element.getAttribute(MARKER)) element.setAttribute(MARKER, marker);
        marked.push([element.getAttribute(MARKER)!, name, value]);
      }
    }
    this.walk(this.root);
    for (const [marker, name, value] of marked) {
      this.add(plainSegment(value), (translated) => {
        this.root.querySelector(`[${MARKER}="${marker}"]`)?.setAttribute(name, translated);
      });
    }
  }

  get segments(): EmailSegment[] {
    return this.slots.map((slot) => slot.segment);
  }

  /** Writes the translations (segment index → Supertext's HTML) and returns the new HTML. */
  apply(translations: Map<number, string>): string {
    // Check every segment first, so a refused one leaves the document unchanged.
    const results = this.slots.map((slot, index) => {
      const value = translations.get(index);
      return value === undefined ? undefined : segmentResult(slot.segment, value);
    });
    this.slots.forEach((slot, index) => {
      const value = results[index];
      if (value !== undefined) slot.apply(value);
    });
    for (const element of this.root.querySelectorAll(`[${MARKER}]`)) element.removeAttribute(MARKER);
    return this.root.toString();
  }

  /** The HTML as it is now, without markers (for documents that weren't translated). */
  toString(): string {
    return this.root.toString().replace(/ data-st-a="\d+"/g, '');
  }

  /** Inner HTML of each element with a Mailchimp editable section (`mc:edit`), after `apply`. */
  sections(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const element of this.root.querySelectorAll('*')) {
      const name = element.getAttribute('mc:edit');
      if (name && !(name in result)) result[name] = element.innerHTML;
    }
    return result;
  }

  private add(segment: EmailSegment, apply: (value: string) => void) {
    this.slots.push({ segment, apply });
  }

  private walk(element: HTMLElement) {
    if (isSkipped(element)) return;
    if (!hasBlockInside(element)) {
      if (hasLetters(element.text)) {
        const { html, tags } = protect(element.innerHTML.trim());
        this.add({ html, plain: false, tags }, (value) => element.set_content(value));
      }
      return;
    }
    for (const child of [...element.childNodes]) {
      if (child instanceof TextNode) {
        if (!hasLetters(child.text)) continue;
        const raw = child.rawText;
        const lead = raw.match(/^\s*/)?.[0] ?? '';
        const trail = raw.match(/\s*$/)?.[0] ?? '';
        const { html, tags } = protect(raw.trim());
        this.add({ html, plain: false, tags }, (value) =>
          element.exchangeChild(child, new TextNode(lead + value + trail, element)),
        );
      } else if (child instanceof HTMLElement) {
        this.walk(child);
      }
    }
  }
}

const tagName = (element: HTMLElement) => (element.rawTagName ?? '').toLowerCase();

function isSkipped(element: HTMLElement): boolean {
  const tag = tagName(element);
  if (SKIP.has(tag)) return true;
  if (element.getAttribute('translate') === 'no') return true;
  return /(^|\s)notranslate(\s|$)/.test(element.getAttribute('class') ?? '');
}

/** True if the element or one of its ancestors is left alone. */
function skipped(element: HTMLElement): boolean {
  for (let node: HTMLElement | null = element; node; node = node.parentNode as HTMLElement | null) {
    if (node.rawTagName && isSkipped(node)) return true;
  }
  return false;
}

function hasBlockInside(element: HTMLElement): boolean {
  const visit = (node: Node): boolean =>
    node instanceof HTMLElement && (BLOCK.has(tagName(node)) || SKIP.has(tagName(node)) || node.childNodes.some(visit));
  return element.childNodes.some(visit);
}
