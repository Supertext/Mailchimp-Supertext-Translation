// Mailchimp subscriber languages ↔ Supertext language codes. Shared by server and browser.
//
// Mailchimp stores each subscriber's language as a two-letter code ("de"),
// detected from the browser or set in the audience; the language segment
// condition takes the same code. Supertext needs a regional target code
// ("de-CH", "fr-FR"), which each account can set per language.

/** Languages offered as targets: Mailchimp code → default Supertext code. */
export const LANGUAGES: Record<string, string> = {
  ar: 'ar-SA',
  bg: 'bg-BG',
  cs: 'cs-CZ',
  da: 'da-DK',
  de: 'de-DE',
  el: 'el-GR',
  en: 'en-US',
  es: 'es-ES',
  et: 'et-EE',
  fi: 'fi-FI',
  fr: 'fr-FR',
  hr: 'hr-HR',
  hu: 'hu-HU',
  it: 'it-IT',
  ja: 'ja-JP',
  ko: 'ko-KR',
  lt: 'lt-LT',
  lv: 'lv-LV',
  nl: 'nl-NL',
  no: 'nb-NO',
  pl: 'pl-PL',
  pt: 'pt-PT',
  ro: 'ro-RO',
  ru: 'ru-RU',
  sk: 'sk-SK',
  sl: 'sl-SI',
  sr: 'sr-RS',
  sv: 'sv-SE',
  th: 'th-TH',
  tr: 'tr-TR',
  uk: 'uk-UA',
  vi: 'vi-VN',
  zh: 'zh-CN',
};

export const LANGUAGE_CODES = Object.keys(LANGUAGES);

export const isLanguage = (code: string): boolean => code in LANGUAGES;

/** The language's name in the given interface language ("de" in French → "allemand"). */
export function languageName(code: string, uiLocale: string): string {
  try {
    const name = new Intl.DisplayNames([uiLocale], { type: 'language' }).of(code === 'no' ? 'nb' : code);
    if (name && name !== code) return name.charAt(0).toLocaleUpperCase(uiLocale) + name.slice(1);
  } catch {
    // fall through
  }
  return code;
}

/** "pt-br" → "pt-BR"; "de" → "de". */
export function normalizeCode(code: string): string {
  const [language, ...rest] = code.trim().replace(/_/g, '-').split('-');
  if (!language) return '';
  const region = rest.join('-');
  if (!region) return language.toLowerCase();
  return `${language.toLowerCase()}-${region.length === 2 ? region.toUpperCase() : region}`;
}

/** The code sent to Supertext for a Mailchimp language: the account's own setting, else the default. */
export function supertextCode(language: string, overrides: Record<string, string>): string {
  const own = overrides[language]?.trim();
  return own ? normalizeCode(own) : (LANGUAGES[language] ?? language);
}

/** A plausible language code: "de", "de-CH", "zh-Hant", "es-419". */
export const isValidCode = (code: string): boolean =>
  /^[a-z]{2,3}(-([A-Z]{2}|[A-Za-z]{4}|\d{3}))?$/.test(normalizeCode(code));
