/**
 * Screenshots of the app's pages for the guides (docs/images), taken with
 * Playwright against the stand-in Mailchimp and Supertext APIs, which return
 * real translations of the sample account (tests/standin/samples.json).
 *
 *   npm run docs:screenshots
 *
 * Chromium: Playwright's own (npx playwright install chromium), or CHROME=/path.
 */
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { mkdirSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { chromium, type Locator, type Page } from 'playwright';
import { createApp } from '../../src/app.js';
import { loadConfig } from '../../src/config.js';
import { translator } from '../../src/i18n/index.js';
import { MemoryStore } from '../../src/store/store.js';
import { createMailchimpStandin } from '../standin/mailchimp.js';
import { createSupertextStandin } from '../standin/supertext.js';

const out = new URL('../../docs/images/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });

const listen = (fetch: (request: Request) => Response | Promise<Response>, port = 0) =>
  new Promise<string>((resolve) => {
    const server = serve({ fetch, port, hostname: '127.0.0.1' }, () => {
      resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
    });
  });

async function main() {
  const mailchimp = createMailchimpStandin();
  const supertext = createSupertextStandin();
  const mailchimpUrl = await listen((request) => mailchimp.handle(request));
  mailchimp.apiBase = mailchimpUrl;
  const supertextUrl = await listen((request) => supertext.handle(request));
  const port = 8790;
  const appUrl = `http://127.0.0.1:${port}`;
  const app = createApp({
    config: loadConfig({
      APP_URL: appUrl,
      MAILCHIMP_CLIENT_ID: 'screenshots',
      MAILCHIMP_CLIENT_SECRET: 'screenshots-secret',
      MAILCHIMP_LOGIN_BASE: mailchimpUrl,
      SUPERTEXT_API_ENDPOINT: `${supertextUrl}/v1/`,
      // Version reports go to the stand-in, never to the live Commando Center.
      SUPERTEXT_REPORT_URL: `${supertextUrl}/report`,
      FOLDER_POLL_SECONDS: '0',
    }),
    store: new MemoryStore(),
  });
  app.use('/static/*', serveStatic({ root: new URL('../../public/', import.meta.url).pathname, rewriteRequestPath: (path) => path.replace(/^\/static/, '') }));
  await listen(app.fetch, port);

  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await browser.newPage({ viewport: { width: 1120, height: 900 }, deviceScaleFactor: 1, locale: 'en-US' });
  const shot = async (name: string, target: Locator | Page = page) => {
    await target.screenshot({ path: `${out}${name}.png`, animations: 'disabled' });
    console.log(`docs/images/${name}.png`);
  };

  // Start page, then connect (the stand-in approves at once and the app opens its settings).
  await page.goto(appUrl);
  await shot('connect', page.locator('.connect'));
  await page.click('text=Connect Mailchimp');
  await page.waitForURL(`${appUrl}/settings`);

  // Settings: key, languages, triggers, and a successful connection test.
  await page.fill('input[name="apiKey"]', 'Supertext-Auth-Key 0123456789abcdef');
  await page.selectOption('select[name="sourceLanguage"]', 'en');
  for (const code of ['de', 'fr', 'it']) await page.check(`#t-${code}`);
  await page.fill('input[name="code:de"]', 'de-CH');
  await page.fill('input[name="code:fr"]', 'fr-CH');
  await page.fill('input[name="code:it"]', 'it-CH');
  await page.click('button.primary');
  await page.waitForSelector('.notice.success');
  await page.click('#test-button');
  await page.waitForSelector('#test-result.ok');
  // Only the chosen languages and the cards around them: the full table of languages is long.
  await page.evaluate(() => {
    document.querySelectorAll('#targets tr.other').forEach((row, i) => {
      if (i > 2) (row as HTMLElement).style.display = 'none';
    });
  });
  // The key check's time changes with every run: show a fixed one (formatted as the page
  // does), so the image only changes when the UI does.
  const checkedAt = translator('en').t('settings.keyCheck.at', {
    time: new Date('2026-10-06T09:00:00Z').toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }),
  });
  await page.locator('#key-check .muted').evaluate((element, text) => {
    element.textContent = text;
  }, checkedAt);
  await shot('settings', page.locator('main'));

  // Translate page: the autumn newsletter, German and French.
  await page.goto(appUrl);
  await page.check('input[name="campaign"][value="c-autumn"]');
  await page.uncheck('input[name="language"][value="it"]');
  await shot('translate-page', page.locator('#translate-form'));

  // Results after translating.
  await page.click('#translate-button');
  await page.waitForURL(/campaign=c-autumn/, { timeout: 30_000 });
  await page.waitForSelector('.job .notice.success');
  await shot('translate-results', page.locator('.job'));
  await shot('translated-state', page.locator('table.items'));

  // Updating existing drafts: the warning.
  await page.check('#overwrite');
  await shot('overwrite-warning', page.locator('#translate-form'));

  // The page in German.
  await page.goto(`${appUrl}/?lang=de`);
  await page.check('input[name="campaign"][value="c-advent"]');
  await shot('translate-page-de', page.locator('#translate-form'));

  await browser.close();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
