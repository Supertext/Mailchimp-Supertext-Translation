import type { SegmentCondition, SegmentOpts } from '../mailchimp/client.js';

/**
 * Who gets which campaign. A translation goes to the subscribers whose
 * Mailchimp language is that language; the original, if the account wants
 * that, to everyone else. Both keep the original's own conditions where
 * Mailchimp's segment format allows combining them ("all" conditions, no
 * saved segment, at most five conditions).
 */

/** Mailchimp allows up to five conditions in a segment built with the API. */
export const MAX_CONDITIONS = 5;

const language = (op: 'is' | 'not', value: string): SegmentCondition => ({
  condition_type: 'Language',
  field: 'language',
  op,
  value,
});

const ownConditions = (source: SegmentOpts | undefined): SegmentCondition[] | undefined => {
  if (!source || (!source.saved_segment_id && !(source.conditions ?? []).length)) return [];
  if (source.saved_segment_id || source.match === 'any') return undefined;
  return (source.conditions ?? []).filter((condition) => condition.field !== 'language');
};

/** The segment for the translation into `code`; `combined` is false if the original's own segment couldn't be kept. */
export function translationSegment(source: SegmentOpts | undefined, code: string): { segment: SegmentOpts; combined: boolean } {
  const own = ownConditions(source);
  if (own && own.length + 1 <= MAX_CONDITIONS) {
    return { segment: { match: 'all', conditions: [...own, language('is', code)] }, combined: true };
  }
  return { segment: { match: 'all', conditions: [language('is', code)] }, combined: own !== undefined && own.length === 0 };
}

/** The original's segment without the translated languages, or undefined if it can't be built. */
export function originalSegment(source: SegmentOpts | undefined, codes: string[]): SegmentOpts | undefined {
  const own = ownConditions(source);
  if (!own || codes.length === 0 || own.length + codes.length > MAX_CONDITIONS) return undefined;
  return { match: 'all', conditions: [...own, ...codes.map((code) => language('not', code))] };
}
