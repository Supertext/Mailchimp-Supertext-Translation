import { describe, expect, it } from 'vitest';
import { originalSegment, translationSegment } from '../src/translation/segments.js';

const lang = (op: string, value: string) => ({ condition_type: 'Language', field: 'language', op, value });
const tag = { condition_type: 'StaticSegment', field: 'static_segment', op: 'static_is', value: 7 };

describe('translationSegment', () => {
  it('sends to the language when the original goes to the whole audience', () => {
    expect(translationSegment(undefined, 'de')).toEqual({ segment: { match: 'all', conditions: [lang('is', 'de')] }, combined: true });
    expect(translationSegment({}, 'de').combined).toBe(true);
  });

  it("keeps the original's 'all' conditions and replaces an earlier language condition", () => {
    const result = translationSegment({ match: 'all', conditions: [tag, lang('not', 'fr')] }, 'de');
    expect(result).toEqual({ segment: { match: 'all', conditions: [tag, lang('is', 'de')] }, combined: true });
  });

  it("can't combine 'any' conditions or a saved segment", () => {
    expect(translationSegment({ match: 'any', conditions: [tag] }, 'de')).toEqual({
      segment: { match: 'all', conditions: [lang('is', 'de')] },
      combined: false,
    });
    expect(translationSegment({ saved_segment_id: 12 }, 'de').combined).toBe(false);
    expect(translationSegment({ match: 'all', conditions: [tag, tag, tag, tag, tag] }, 'de').combined).toBe(false);
  });
});

describe('originalSegment', () => {
  it('excludes the translated languages', () => {
    expect(originalSegment({}, ['de', 'fr'])).toEqual({ match: 'all', conditions: [lang('not', 'de'), lang('not', 'fr')] });
    expect(originalSegment({ match: 'all', conditions: [tag, lang('not', 'it')] }, ['de'])).toEqual({
      match: 'all',
      conditions: [tag, lang('not', 'de')],
    });
  });

  it("gives up where Mailchimp's segments can't express it", () => {
    expect(originalSegment({ saved_segment_id: 3 }, ['de'])).toBeUndefined();
    expect(originalSegment({}, ['de', 'fr', 'it', 'es', 'pt', 'nl'])).toBeUndefined();
    expect(originalSegment({}, [])).toBeUndefined();
  });
});
