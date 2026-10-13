import { describe, expect, it } from 'vitest';
import { fromSdk, SupertextClient } from '../src/supertext/client.js';
import { SupertextError as SdkError } from 'supertext-sdk';

// The protocol itself is tested in the SDK repository; here only the app's layer.
describe('the app layer over the Supertext SDK', () => {
  it('refuses to start without an API key', () => {
    expect(() => new SupertextClient({ apiKey: ' ' })).toThrow(/No Supertext API key/);
  });

  it("maps the SDK's error codes to the app's", () => {
    const code = (error: SdkError) => (fromSdk(error) as { code: string }).code;
    expect(code(new SdkError('authentication_failure', { status: 401 }))).toBe('auth');
    expect(code(new SdkError('quota_exceeded'))).toBe('limitExceeded');
    expect(code(new SdkError('too_many_requests', { status: 429 }))).toBe('rateLimited');
    expect(code(new SdkError('transport_error', { detail: 'ECONNREFUSED' }))).toBe('unreachable');
    expect(code(new SdkError('incomplete_response'))).toBe('incomplete');
    expect(code(new SdkError('unexpected_status', { status: 418 }))).toBe('http');
    const pair = fromSdk(new SdkError('invalid_language_pair', { status: 400, sourceLang: 'en', targetLang: 'fr' })) as {
      code: string;
      params: Record<string, string>;
    };
    expect(pair.code).toBe('languagePair');
    expect(pair.params).toEqual({ source: 'en', target: 'fr' });
    expect(code(new SdkError('invalid_language_pair', { status: 400 }))).toBe('languagePairUnknown');
  });

  it('translates segments in order and sends the app as User-Agent', async () => {
    const seen: { ua?: string; target?: string; source?: string }[] = [];
    let html = '';
    const fetchFn = (async (url: string, init: RequestInit) => {
      const headers = init.headers as Record<string, string>;
      if (init.method === 'POST') {
        const form = await new Request(url, { method: 'POST', body: init.body, headers }).formData();
        html = await (form.get('file') as File).text();
        seen.push({ ua: headers['User-Agent'], target: String(form.get('target_lang')), source: String(form.get('source_lang')) });
        return Response.json({ file_id: 'f1' });
      }
      if (url.endsWith('/status')) return Response.json({ status: 'done' });
      if (url.endsWith('/translation')) return new Response(html.replace(/>Hello</g, '>Hallo<').replace(/>Bye</g, '>Tschüss<'));
      return Response.json({});
    }) as unknown as typeof fetch;
    const client = new SupertextClient({ apiKey: 'k', endpoint: 'https://api.test/v1', fetch: fetchFn });
    const out = await client.translateSegments(['Hello', '<b>Bye</b>'], { targetLanguage: 'de', sourceLanguage: 'en-US' });
    expect(out).toEqual(['Hallo', '<b>Tschüss</b>']);
    expect(seen[0].ua).toMatch(/^supertext-sdk-typescript Mailchimp-Supertext-Translation\//);
    expect(seen[0].target).toBe('de-DE');
    expect(seen[0].source).toBe('en');
  });

  it('reports an unknown target language (HTTP 404 INVALID_LANGUAGE_PAIR) as a language pair', async () => {
    const fetchFn = (async () =>
      new Response(JSON.stringify({ error_code: 'INVALID_LANGUAGE_PAIR', source_lang: 'en', target_lang: 'xx-XX' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })) as unknown as typeof fetch;
    const client = new SupertextClient({ apiKey: 'k', endpoint: 'https://api.test/v1', fetch: fetchFn });
    const error = (await client
      .translateSegments(['Hello'], { targetLanguage: 'xx-XX', sourceLanguage: 'en' })
      .catch((e: unknown) => e)) as { code: string; params: Record<string, string> };
    expect(error.code).toBe('languagePair');
    expect(error.params).toEqual({ source: 'en', target: 'xx-XX' });
  });
});
