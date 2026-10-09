// Shared by the server and the browser (no server-only code here).
//
// Mailchimp doesn't tell apps the user's interface language, so the app
// follows the language picked in its top bar (a cookie), else the browser's
// Accept-Language header, else English.

import { de } from './de.js';
import { en, type MessageKey, type Messages } from './en.js';
import type { ErrorInfo, MessageParams } from './error.js';
import { fr } from './fr.js';
import { it } from './it.js';

export type { MessageKey, Messages };
export type { ErrorInfo, MessageParams };

export const LOCALES = ['en', 'de', 'fr', 'it'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const MESSAGES: Record<Locale, Messages> = { en, de, fr, it };

export const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

/** The first supported language among the candidates ("de-CH" → "de"), else English. */
export function resolveLocale(...candidates: (string | null | undefined)[]): Locale {
  for (const candidate of candidates) {
    const language = candidate?.trim().split(/[-_]/)[0].toLowerCase();
    if (language && isLocale(language)) return language;
  }
  return DEFAULT_LOCALE;
}

/** The `lang` query parameter, the language cookie, then Accept-Language. */
export function localeFromRequest(request: Request): Locale {
  const param = new URL(request.url).searchParams.get('lang');
  const cookie = /(?:^|;\s*)st_locale=([a-z]{2})/.exec(request.headers.get('cookie') ?? '')?.[1];
  const accepted = (request.headers.get('accept-language') ?? '').split(',').map((part) => part.split(';')[0]);
  return resolveLocale(param, cookie, ...accepted);
}

/** Replaces {name} placeholders; unknown placeholders stay as they are. */
export function format(template: string, params: MessageParams = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}

/** Keys that have .one / .other plural forms, without the suffix. */
type PluralBase<K> = K extends `${infer Base}.other` ? Base : never;
export type PluralKey = PluralBase<MessageKey>;

export interface Translator {
  locale: Locale;
  t(key: MessageKey, params?: MessageParams): string;
  /** Plural form for `count` (also available as {count}). */
  tn(key: PluralKey, count: number, params?: MessageParams): string;
  /** An error from the server in this language; untranslatable errors keep their English message. */
  error(info: ErrorInfo): string;
}

export function translator(locale: Locale): Translator {
  const messages = MESSAGES[locale];
  const plural = new Intl.PluralRules(locale);
  const t = (key: MessageKey, params?: MessageParams) => format(messages[key] ?? en[key] ?? key, params);
  return {
    locale,
    t,
    tn: (key, count, params) => {
      const form = plural.select(count) === 'one' ? 'one' : 'other';
      return t(`${key}.${form}` as MessageKey, { count, ...params });
    },
    error: (info) => {
      const key = `error.${info.code}`;
      const text = info.code && key in messages ? t(key as MessageKey, info.params) : info.message;
      return info.detail ? `${text} (${info.detail})` : text;
    },
  };
}
