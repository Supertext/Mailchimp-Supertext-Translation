# Developer guide — Supertext Translation for Mailchimp

A hosted app: a Node.js/TypeScript service (Hono, server-rendered pages) that users connect to their Mailchimp account with OAuth 2. It reads and writes campaigns through the Mailchimp Marketing API v3 and translates them with the Supertext AI file translation API. Hosted on Railway. Mailchimp has no extension point inside its own UI, so the app adds one in Mailchimp itself (campaign folders it watches) and has its own *Translate* page.

## Repository layout

```
src/
  server.ts               entry: database, static files, folder poller, HTTP server
  app.ts                  routes (Hono): start/translate page, OAuth, settings, API for the page's script, health
  config.ts               environment variables
  version.ts              version from package.json, release link
  auth/session.ts         signed session cookies, CSRF tokens, OAuth state
  mailchimp/
    client.ts             OAuth code exchange + metadata; Marketing API (campaigns, content, folders), 429 retries
    email-html.ts         campaign HTML ↔ segments: text blocks, merge-tag placeholders, mc:edit sections
  translation/
    translate.ts          one campaign × one language: segments → Supertext → draft (replicate, settings, segment, content)
    jobs.ts               a job: one campaign × languages, progress, error handling, limiting the original
    segments.ts           the language segment of a draft and of the original
    folders.ts            the Supertext folders: create/rename/remove, poll, start jobs
    languages.ts          Mailchimp language codes, Supertext defaults, names
  supertext/
    client.ts             Supertext AI file translation client (same as the other plugins)
    html.ts               packs segments into one HTML document and back
  store/
    store.ts              Store interface, in-memory store, AES-GCM for tokens and keys
    postgres.ts           PostgreSQL store (creates its database and tables)
  i18n/                   en, de, fr, it messages; translator; LocalizedError
  views/                  server-rendered pages (hono/jsx): connect, translate, job panel and history, settings
public/                   app.js (selection, start, polling, test connection), app.css
scripts/probe.ts          look at a real account (read-only; --write tries the writes on a throw-away copy)
scripts/smoke.sh          the built app against the stand-ins (CI)
tests/                    Vitest tests; standin/ (Mailchimp and Supertext stand-ins, sample account); docs/screenshots.ts
```

## How it fits into Mailchimp

- **OAuth 2** (authorization code): `/oauth/start` redirects to `https://login.mailchimp.com/oauth2/authorize` (`response_type=code`, `client_id`, `redirect_uri=APP_URL/oauth/callback`, `state`); the callback exchanges the code at `POST /oauth2/token` and reads `GET /oauth2/metadata` (header `Authorization: OAuth <token>`) for the data center (`dc`), the API endpoint, the account name and `user_id`, which is the account's key in the database. Mailchimp tokens don't expire; a 401 means the user revoked access, so the token is cleared and the user has to connect again. The `state` is a random value in a signed, short-lived cookie.
- **Sessions:** a signed cookie (HMAC-SHA256, 30 days) with the account ID; the token stays in the database (encrypted). Form posts and API calls carry a CSRF token derived from the session cookie. Pages refuse framing (`frame-ancestors 'none'`).
- **API calls:** `https://<dc>.api.mailchimp.com/3.0/…` with `Authorization: Bearer <token>`. HTTP 429 (Mailchimp allows 10 simultaneous connections per user) is retried up to 4 times like Supertext's. Errors become `MailchimpError`s with codes the UI translates (`mailchimpAuth`, `mailchimpForbidden`, `mailchimpUnavailable` …); Mailchimp's own `detail` is shown untranslated.

| Call | Endpoint |
| --- | --- |
| Campaign list (translate page, folder check) | `GET /campaigns?sort_field=create_time&sort_dir=DESC&fields=…` |
| One campaign | `GET /campaigns/{id}` |
| Copy for a language | `POST /campaigns/{id}/actions/replicate` |
| Title, subject, preview, folder, recipients | `PATCH /campaigns/{id}` |
| Content | `GET /campaigns/{id}/content`, `PUT /campaigns/{id}/content` (`template.sections`, else `html`; `plain_text` for plain-text campaigns) |
| Clean-up of a half-made draft | `DELETE /campaigns/{id}` |
| Supertext folders | `GET/POST /campaign-folders`, `PATCH/DELETE /campaign-folders/{id}` |
| Connection check | `GET /ping` |

## How a translation runs

1. **Start.** From the app: `POST /api/jobs` with the campaign and languages (only languages of the settings). From a folder: the poller (below). One job per campaign runs at a time; a second one waits for the first.
2. **Checks** (`jobs.ts`): the campaign exists, isn't a draft the app made (`translations` table), is `regular` or `plaintext`, and has HTML (or plain text).
3. **Segments** (`email-html.ts`, `translate.ts`): subject line and preview text as plain-text segments, then the content. A *text block* is the innermost element with letters and no block-level element inside (p, h1–h6, li, td, div …); its inner HTML is one segment, so a whole paragraph with its `<b>`, `<a href>` travels as one `data-st-id` (the shared rule). Loose text between blocks, `alt` and `title` attributes and the `<title>` are plain segments. `head`, `style`, `script`, `code`, Outlook conditional comments and anything with `translate="no"` or class `notranslate` are left alone. Elements whose attributes are translated get a temporary `data-st-a` marker so they are found again inside translated blocks; it's removed before writing.
4. **Merge tags** (`*|FNAME|*`, `*|IF:…|*`, `*|UNSUB|*` …) in text become empty `<span data-mc="N"></span>` placeholders (numbered per segment) and are put back after translation. If a segment comes back with a placeholder missing or doubled, nothing is written for that language (`mergeTags`); in attributes (links) merge tags aren't touched anyway.
5. **Supertext:** all segments of the language in one document (several above 900,000 characters); source = the account's campaign language, target = the language's Supertext code, `politeness` from the form of address. If fewer segments come back than were sent, nothing is written (`incomplete`).
6. **Draft:** the language's existing draft (status `save`) is kept, or updated if *Update existing drafts* / the folder trigger asks for it; a sent draft is left alone and a new one made. A new draft is a replica of the original. Then `PATCH` sets the title (`<title> · DE`), the translated subject and preview, the original's folder and the recipients (`segments.ts`): the original's list with a `Language is <code>` condition, combined with the original's own conditions when it uses `match: all`, no saved segment and the total stays within 5 conditions. Content: for `template`/`drag_and_drop` campaigns with a `template_id` the inner HTML of each `mc:edit` element is written as `template.sections`, so the draft stays editable in the classic builder; if Mailchimp refuses (400), the whole HTML is written (`notes: html`). Other campaigns get the HTML. If anything fails after the replica was made, the replica is deleted.
7. **Original:** with *Send the original only to subscribers without a translated language*, a draft or paused original gets `Language is not <code>` for every language with a draft (its earlier language conditions replaced), within the same limits; otherwise the job reports that the audience was kept.
8. **Errors:** authentication, limit, Mailchimp access and campaign problems stop the job; anything else (e.g. `INVALID_LANGUAGE_PAIR`) fails only that language. Jobs still running when the app restarts are marked *interrupted* on the next start.

### The folder trigger

`folders.ts`. On saving the settings (and connecting), `syncFolders()` keeps the account's folders in line: *Supertext → All languages* plus *Supertext → <language>* per target, named in the interface language of whoever saved (`folderLocale`); renamed when that changes; a folder no longer wanted is deleted if empty, else left as an ordinary folder. Folder IDs and what they start are stored with the account.

The poller (`startPoller`, every `FOLDER_POLL_SECONDS`, default 60) lists every campaign's ID and folder of each account with the folder trigger (one call per 1,000 campaigns, `fields` limited) and compares with the last look (`folder_entries`):

- a campaign in a Supertext folder is moved back to the folder it was last seen in outside them (`folder_id: ""` if none or unknown), then a job translates it into that folder's languages with `overwrite: true` (moving it in again asks for a fresh translation);
- if Mailchimp refuses the move (sent campaigns), the campaign is translated once and marked `handled` until it leaves the folder.

Runs don't overlap; a 401 clears the account's token.

## Interface languages

English, German, French and Italian. Mailchimp doesn't pass a language to apps, so the app follows `?lang=` (top-bar switch, stored in the `st_locale` cookie), then `Accept-Language`, then English. Strings live in `src/i18n/{en,de,fr,it}.ts`; `en.ts` defines the keys and the others are typed `Messages`, so a missing key fails `npm run typecheck`, and `tests/i18n.test.ts` checks keys, placeholders, URLs, "Supertext" and "Mailchimp". **Every new or changed string gets all four languages in the same commit**, formal address (Sie, vous, Lei) and Mailchimp's own terms (Kampagne, Zielgruppe, Entwurf, Merge-Tags; campagne, audience, brouillon, balises de fusion; campagna, pubblico, bozza, tag di unione), French narrow no-break space before `? ! : ;`. Language names come from `Intl.DisplayNames`. Errors are `LocalizedError`s (English message for logs, `code` → `error.<code>`).

## Supertext API protocol

AI file translation API v1 at `https://api.supertext.com/v1/`, same as the WordPress plugin:

1. `POST translate/ai/file` (multipart): `file` (type exactly `text/html`), `target_lang`, `source_lang` (primary subtag only), optional `politeness` (`more`/`less`) → `{ file_id }`.
2. `GET translate/ai/file/{id}/status` every 2 s until `done` (`error`, `limit_exceeded`, `deleted` stop; timeout 3 minutes).
3. `GET translate/ai/file/{id}/translation` → the translated HTML.
4. `DELETE translate/ai/file/{id}`, always.

Header `Authorization: Supertext-Auth-Key <key>` (a pasted prefix is stripped). HTTP 429 is retried up to 4 times (`Retry-After`, else 1/2/4/8 s with jitter). `GET features` validates the key (*Test connection*). The key is the account's own (Settings, AES-256-GCM encrypted with `APP_ENCRYPTION_KEY`, else a key derived from `MAILCHIMP_CLIENT_SECRET`), else `SUPERTEXT_API_KEY`.

## Local development

Requirements: Node.js 22.12+. No Mailchimp account needed for most work: the stand-ins answer like Mailchimp (OAuth and the API calls above) and Supertext for a sample account (`tests/standin/seed.ts`: a Swiss chocolate shop with a template campaign, an HTML campaign in a folder of its own with an interest segment, and a sent campaign; `samples.json` holds human translations of their texts into German, French and Italian).

```bash
npm install
npm run standin            # stand-in Mailchimp :8766, stand-in Supertext :8765
MAILCHIMP_CLIENT_ID=standin MAILCHIMP_CLIENT_SECRET=standin-secret MAILCHIMP_LOGIN_BASE=http://127.0.0.1:8766 \
SUPERTEXT_API_ENDPOINT=http://127.0.0.1:8765/v1/ SUPERTEXT_API_KEY=any FOLDER_POLL_SECONDS=5 npm run dev
# open http://127.0.0.1:8080 and click Connect Mailchimp (the stand-in approves at once)
```

Without `DATABASE_URL`, everything lives in memory. To move a campaign into a folder of the stand-in: `curl -X PATCH http://127.0.0.1:8766/3.0/campaigns/c-advent -H 'Authorization: Bearer standin-token' -H 'Content-Type: application/json' -d '{"settings":{"folder_id":"<id>"}}'`.

Against real Mailchimp you need a registered app (below) whose redirect URI points at your app; for local work register `http://127.0.0.1:8080/oauth/callback` (Mailchimp accepts it for development).

### Looking at a real account

```bash
MAILCHIMP_API_KEY=<key>-us21 npm run mailchimp:probe -- [campaignId]           # read-only
MAILCHIMP_API_KEY=<key>-us21 npm run mailchimp:probe -- <campaignId> --write   # also tries the writes on a copy
```

An API key (Mailchimp → Profile → Extras → API keys) works like an OAuth token for these calls. The read-only run lists folders, the latest campaigns (type, content type, status, folder, template, segment) and how the app would split the chosen campaign (segments, merge tags, `mc:edit` sections, unchanged round trip), and saved segments with a language condition. `--write` replicates the campaign, moves the copy into a new folder and out again, sets the language segment and writes the content (sections, else HTML), then deletes the copy and the folder.

## Tests

```bash
npm test             # Vitest: email HTML and merge tags, segments, sessions, Supertext client, HTML packing, i18n, full flow
npm run typecheck
npm run build
bash scripts/smoke.sh   # after build: the built app against the stand-ins
```

`tests/flow.test.ts` runs the whole app (`createApp`) against the stand-ins with an in-memory store: OAuth, settings and folders, translating from the app (drafts, segments, merge tags, template sections and the HTML fallback, kept and updated drafts, errors) and from folders (moved back, sent campaigns), disconnecting.

## Screenshots

```bash
npm run docs:screenshots   # Playwright, 1× scale, into docs/images/
```

`tests/docs/screenshots.ts` starts the stand-ins and the app in-process, connects through the stand-in's OAuth and captures the app's pages (connect, settings, translate page, results, list afterwards, update warning, German UI). Regenerate them in the same commit as any UI change they show. Chromium: Playwright's own (`npx playwright install chromium`) or `CHROME=/path/to/chrome`. Screenshots of Mailchimp's own screens (the Supertext folders, a draft) follow from the demo account.

## CI

`.github/workflows/ci.yml`: typecheck, tests, build, then `scripts/smoke.sh`: the built app against the stand-ins (OAuth with a cookie jar, settings, a job translating into two languages, a campaign moved into *Supertext → German* and translated by the poller and moved back, an API call without a session refused).

## Hosting (Railway)

The service **Mailchimp** in the Railway project *supertext-cms-demos* builds this repo's `Dockerfile` (context = repo root; set on the service, Railway ignores `railway.json`). Health check `/health`. Every push to `main` deploys. One instance only: the folder poller and jobs run in the web process.

| Variable | Value |
| --- | --- |
| `APP_URL` | the service's public URL; `APP_URL/oauth/callback` is the app's redirect URI in Mailchimp |
| `MAILCHIMP_CLIENT_ID`, `MAILCHIMP_CLIENT_SECRET` | from the registered app (below) |
| `SESSION_SECRET` | random secret for session cookies |
| `DATABASE_URL` | the shared Postgres service's URL with database `mailchimp_supertext` (created on first start) |
| `APP_ENCRYPTION_KEY` | random secret for stored tokens and keys; optional (falls back to the client secret) |
| `SUPERTEXT_API_KEY` | optional default key (the demo account) |
| `FOLDER_POLL_SECONDS` | optional, default 60 |

Never commit these values.

## Registering the app in Mailchimp

Once, in Supertext's Mailchimp account: **Profile → Extras → Registered apps → Register an app** (https://us1.admin.mailchimp.com/account/oauth2/): name *Supertext Translation*, website https://www.supertext.com, redirect URI `APP_URL/oauth/callback`. Copy the client ID and secret (shown once) into the Railway variables. A Mailchimp Marketplace listing (review by Mailchimp) comes later; until then users open the app's URL directly.

## Demo

The demo is a Mailchimp account, not a container: Mailchimp hosts the campaigns, Railway only the app. Set it up by hand (Mailchimp accounts can't be created from outside):

1. A free Mailchimp account *Supertext Demo* with an audience *Newsletter* and a few test contacts with the languages English, German, French and Italian.
2. Campaigns in English with the texts of `tests/standin/seed.ts`: one from a classic template, one in HTML.
3. **Accounts** (the demo accounts rule, as far as Mailchimp allows): Supertext staff get access as Mailchimp users with the **Admin** role; for tests and screenshots invite a user with the **Manager** role (can create and edit campaigns). Mailchimp users are invited by hand and can't be created from Railway variables; passwords stay in Keeper, never in the repo or chat.
4. Connect the demo account in the app, enter the API key under Settings or set `SUPERTEXT_API_KEY` on Railway, choose German, French and Italian.

## Releasing

`package.json` holds the version (the release workflow's `VERSION_FILES`); the settings page reads it at runtime.

1. Move the *Unreleased* entries in `CHANGELOG.md` under a new `## X.Y.Z — YYYY-MM-DD` heading, leaving *Unreleased* empty.
2. Set the same version in `package.json` and `package-lock.json` (`npm version X.Y.Z --no-git-tag-version`).
3. Push to `main`. `.github/workflows/release.yml` tags `vX.Y.Z` and creates the GitHub release with the changelog section; 0.x versions are pre-releases. Railway deploys the code on the same push.

Never tag or create releases by hand.

## Known limitations / roadmap

- **Not yet tested on a real Mailchimp account.** The app follows the Marketing API reference; check these with `npm run mailchimp:probe -- <campaign> --write` on the demo account, and adapt the code if Mailchimp differs:
  - that `PUT …/content` still accepts `template.sections` (the current reference documents only `html`, `plain_text` and `variate_contents`) and keeps a classic-template draft editable; otherwise the drafts are saved as HTML (code-your-own);
  - what campaigns made with Mailchimp's **new email builder** return: their content type and whether their HTML can be read and written through the API at all;
  - that `folder_id: ""` takes a campaign out of all folders, and whether sent campaigns can be moved between folders;
  - the language condition's format in segments (`{condition_type: "Language", field: "language", op: "is", value: "de"}`) and the limit of 5 conditions.
- The folder check needs one listing of all campaigns per account per minute; accounts with more than 5,000 campaigns are only checked for the newest 5,000.
- Jobs and the poller run inside the web process (one Railway instance); a restart marks a running job *interrupted*. A queue comes later.
- Not translated: A/B tests (variate content), RSS campaigns, automations / Customer Journeys, templates themselves, signup forms and landing pages.
- No Mailchimp Marketplace listing yet: needs Mailchimp's review; until then the app's URL.
