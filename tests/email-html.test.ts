import { describe, expect, it } from 'vitest';
import { EmailDocument, hasLetters, plainSegment, protect, restore, segmentResult } from '../src/mailchimp/email-html.js';

const identity = (doc: EmailDocument) => new Map(doc.segments.map((segment, i) => [i, segment.html]));

describe('merge tags', () => {
  it('travel as placeholders in text and stay in attributes', () => {
    const { html, tags } = protect('Hi *|FNAME|*, <a href="*|UNSUB|*">leave</a> *|IF:VIP|*vip*|END:IF|*');
    expect(html).toBe(
      'Hi <span data-mc="0"></span>, <a href="*|UNSUB|*">leave</a> <span data-mc="1"></span>vip<span data-mc="2"></span>',
    );
    expect(tags).toEqual(['*|FNAME|*', '*|IF:VIP|*', '*|END:IF|*']);
    expect(restore(html.replace('Hi', 'Hallo'), tags)).toBe('Hallo *|FNAME|*, <a href="*|UNSUB|*">leave</a> *|IF:VIP|*vip*|END:IF|*');
  });

  it('are put back even when the translator moves or reshapes the placeholder', () => {
    expect(restore('<span data-mc="0"/>, hallo', ['*|FNAME|*'])).toBe('*|FNAME|*, hallo');
    expect(restore('Hallo <span class="x" data-mc="0"> </span>', ['*|FNAME|*'])).toBe('Hallo *|FNAME|*');
  });

  it('refuse a translation that lost one', () => {
    expect(() => restore('Hallo', ['*|FNAME|*'])).toThrow(/0 of 1 merge tags/);
  });

  it('are not counted as text', () => {
    expect(hasLetters('*|LIST:ADDRESSLINE|*')).toBe(false);
    expect(hasLetters('<b>*|FNAME|*</b> 2026')).toBe(false);
    expect(hasLetters('Grüezi')).toBe(true);
  });
});

describe('plain segments', () => {
  it('escape the text and come back as text with line breaks', () => {
    const segment = plainSegment('Fish & Chips < 10 CHF\nfor *|FNAME|*');
    expect(segment.html).toBe('Fish &amp; Chips &lt; 10 CHF\nfor <span data-mc="0"></span>');
    expect(segmentResult(segment, 'Fisch &amp; Chips &lt; 10 CHF<br>für <span data-mc="0"></span>')).toBe(
      'Fisch & Chips < 10 CHF\nfür *|FNAME|*',
    );
  });
});

describe('EmailDocument', () => {
  const html = `<!DOCTYPE html>
<html><head><title>Autumn news</title><style>p{color:red}</style><!--[if mso]><xml>x</xml><![endif]--></head>
<body>
<table><tr><td>Welcome, <b>dear</b> reader</td><td><img src="a.png" alt="A gift box"></td></tr></table>
<div>Loose text <p>A paragraph with <a href="https://example.com" title="Our shop">a link</a>.</p></div>
<p translate="no">Supertext AG</p>
<div class="notranslate">Brand claim</div>
<ul><li>One</li><li>Two</li></ul>
<pre>code stays</pre>
</body></html>`;

  it('finds text blocks, loose text, the title and alt and title attributes', () => {
    const doc = new EmailDocument(html);
    expect(doc.segments.map((s) => [s.html.replace(/ data-st-a="\d+"/g, ''), s.plain])).toEqual([
      ['Autumn news', true],
      ['Welcome, <b>dear</b> reader', false],
      ['Loose text', false],
      ['A paragraph with <a href="https://example.com" title="Our shop">a link</a>.', false],
      ['One', false],
      ['Two', false],
      ['code stays', false],
      ['A gift box', true],
      ['Our shop', true],
    ]);
  });

  it('returns the same HTML when nothing changes', () => {
    const doc = new EmailDocument(html);
    expect(doc.apply(identity(doc))).toBe(html);
  });

  it('writes translations, attributes included, inside translated blocks too', () => {
    const doc = new EmailDocument(html);
    const map = new Map<number, string>();
    doc.segments.forEach((segment, i) => map.set(i, segment.html.replace('A paragraph with', 'Ein Absatz mit').replace('Our shop', 'Unser Laden').replace('A gift box', 'Eine Geschenkbox').replace('Loose text', 'Loser Text')));
    const out = doc.apply(map);
    expect(out).toContain('<div>Loser Text <p>Ein Absatz mit <a href="https://example.com" title="Unser Laden">a link</a>.</p></div>');
    expect(out).toContain('alt="Eine Geschenkbox"');
    expect(out).toContain('<style>p{color:red}</style><!--[if mso]><xml>x</xml><![endif]-->');
    expect(out).toContain('<p translate="no">Supertext AG</p>');
    expect(out).not.toContain('data-st-a');
  });

  it('leaves the document unchanged if one segment lost a merge tag', () => {
    const doc = new EmailDocument('<p>Hi *|FNAME|*</p><p>Bye</p>');
    expect(() => doc.apply(new Map([[0, 'Hallo'], [1, 'Tschüss']]))).toThrow(/merge tags/);
    expect(doc.toString()).toBe('<p>Hi *|FNAME|*</p><p>Bye</p>');
  });

  it("reads the template's editable sections", () => {
    const doc = new EmailDocument('<table><tr><td mc:edit="body"><p>Hello</p></td><td mc:edit="footer">Bye</td></tr></table>');
    doc.apply(new Map([[0, 'Hallo'], [1, 'Tschüss']]));
    expect(doc.sections()).toEqual({ body: '<p>Hallo</p>', footer: 'Tschüss' });
  });
});
