import { describe, expect, it } from 'vitest';
import { en } from '../src/i18n/en.js';
import { errorInfo } from '../src/i18n/error.js';
import { LOCALES, MESSAGES, localeFromRequest, resolveLocale, translator } from '../src/i18n/index.js';
import { SupertextClient } from '../src/supertext/client.js';
import { languageName, supertextCode, supertextSource } from '../src/translation/languages.js';

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const urls = (text: string) => [...text.matchAll(/https:\/\/\S+?(?=[\s;)]|\.?$|\. )/g)].map((m) => m[0]).sort();

describe('message files', () => {
  for (const locale of LOCALES) {
    const messages = MESSAGES[locale];

    it(`${locale} has exactly the English keys`, () => {
      expect(Object.keys(messages).sort()).toEqual(Object.keys(en).sort());
    });

    it(`${locale} keeps placeholders, URLs, "Supertext" and "Mailchimp"`, () => {
      for (const [key, english] of Object.entries(en)) {
        const text = messages[key as keyof typeof en];
        expect(text.trim(), key).not.toBe('');
        expect(placeholders(text), key).toEqual(placeholders(english));
        expect(urls(text), key).toEqual(urls(english));
        if (english.includes('Supertext')) expect(text, key).toContain('Supertext');
        if (english.includes('Mailchimp')) expect(text, key).toContain('Mailchimp');
      }
    });
  }

  it('keeps the agreed wording of the main action', () => {
    expect(MESSAGES.de['translate.submit']).toBe('Mit Supertext übersetzen');
    expect(MESSAGES.fr['translate.submit']).toBe('Traduire avec Supertext');
    expect(MESSAGES.it['translate.submit']).toBe('Traduci con Supertext');
  });
});

describe('locale', () => {
  it('uses the lang parameter, then the cookie, then Accept-Language, then English', () => {
    expect(localeFromRequest(new Request('https://app.test/?lang=de'))).toBe('de');
    expect(localeFromRequest(new Request('https://app.test/', { headers: { cookie: 'a=b; st_locale=it' } }))).toBe('it');
    expect(localeFromRequest(new Request('https://app.test/', { headers: { 'accept-language': 'ja, fr-CH;q=0.8' } }))).toBe('fr');
    expect(localeFromRequest(new Request('https://app.test/'))).toBe('en');
    expect(resolveLocale('pt-BR', 'de')).toBe('de');
  });
});

describe('translator', () => {
  it('fills placeholders and picks plural forms', () => {
    expect(translator('de').tn('translate.submitCount', 2)).toBe('In 2 Sprachen mit Supertext übersetzen');
    expect(translator('fr').tn('translate.submitCount', 1)).toBe('Traduire dans 1 langue avec Supertext');
  });

  it("translates errors and keeps the service's own detail", async () => {
    const client = new SupertextClient({
      apiKey: 'Supertext-Auth-Key wrong-key',
      fetch: (async () => new Response('{"detail":"bad key: wrong-key"}', { status: 401 })) as unknown as typeof fetch,
    });
    const info = errorInfo(await client.validate().catch((error) => error));
    expect(info.code).toBe('auth');
    // The SDK masks the key wherever the API echoes it.
    expect(translator('de').error(info)).toMatch(/^Authentifizierung fehlgeschlagen\..*\(\{"detail":"bad key: \*\*\*"\}\)$/);
    expect(translator('de').error(info)).not.toContain('wrong-key');
    expect(translator('it').error({ message: 'Something else' })).toBe('Something else');
  });
});

describe('languages', () => {
  it('names languages in the interface language', () => {
    expect(languageName('de', 'fr')).toBe('Allemand');
    expect(languageName('fr', 'de')).toBe('Französisch');
    expect(languageName('no', 'en')).toBe('Norwegian Bokmål');
  });

  it("sends the account's Supertext code, else a regional default", () => {
    expect(supertextCode('de', { de: 'de-ch' })).toBe('de-CH');
    expect(supertextCode('fr', {})).toBe('fr-FR');
    expect(supertextCode('no', {})).toBe('nb-NO');
    expect(supertextCode('de', { de: 'de_ch' })).toBe('de-CH');
    expect(supertextCode('xx', {})).toBe('xx');
  });

  it('sends the source as the bare language', () => {
    expect(supertextSource('en', {})).toBe('en');
    expect(supertextSource('no', {})).toBe('nb');
    expect(supertextSource('pt', { pt: 'pt-BR' })).toBe('pt');
    expect(supertextSource('', {})).toBe('');
  });
});
