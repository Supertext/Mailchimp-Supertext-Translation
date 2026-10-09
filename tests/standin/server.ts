/**
 * Runs the stand-in Mailchimp (OAuth and Marketing API, port 8766) and the
 * stand-in Supertext API (port 8765) for local development, CI and the
 * screenshots.
 *
 *   npm run standin
 *   MAILCHIMP_CLIENT_ID=standin MAILCHIMP_CLIENT_SECRET=standin-secret \
 *   MAILCHIMP_LOGIN_BASE=http://127.0.0.1:8766 \
 *   SUPERTEXT_API_ENDPOINT=http://127.0.0.1:8765/v1/ SUPERTEXT_API_KEY=any npm run dev
 *
 * Then open http://127.0.0.1:8080 and click Connect Mailchimp: the stand-in
 * approves at once.
 */
import { serve } from '@hono/node-server';
import { createMailchimpStandin } from './mailchimp.js';
import { createSupertextStandin } from './supertext.js';

const mailchimpPort = Number(process.env.MAILCHIMP_STANDIN_PORT || 8766);
const supertextPort = Number(process.env.SUPERTEXT_STANDIN_PORT || 8765);
const mailchimp = createMailchimpStandin(`http://127.0.0.1:${mailchimpPort}`);
const supertext = createSupertextStandin();

serve({ fetch: (request) => mailchimp.handle(request), port: mailchimpPort, hostname: '127.0.0.1' });
serve({ fetch: (request) => supertext.handle(request), port: supertextPort, hostname: '127.0.0.1' });

console.log(
  `Stand-in Mailchimp on http://127.0.0.1:${mailchimpPort} (OAuth and /3.0/), stand-in Supertext API on http://127.0.0.1:${supertextPort}/v1/`,
);
