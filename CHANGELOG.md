# Changelog

All notable changes to Supertext Translation for Mailchimp.

## Unreleased

- Changed: Supertext is reached through the Supertext SDK for TypeScript (bundled from `vendor/supertext-sdk/` until it is on npm) instead of the app's own client. Same protocol; the app now identifies itself in the User-Agent, and the API key is masked wherever Supertext's answer echoes it.
- Changed: Supertext SDK 0.2.1 (API in the `v1` namespace).
- Changed: no more guessed language codes. Each language is sent with the Supertext code you set under Settings → Languages (picked from Supertext's list; one mapping for the target and the campaign language), else its Mailchimp code if Supertext uses it as it is (`es`, `nl`). A language without one isn't sent and fails with *has no Supertext code yet* (`unsupported_language`); there are no default regions any more (`de` used to be sent as `de-DE`). The settings page shows what each language is sent as and warns about ticked languages without a code; the Translate page marks them.
- Changed: the form of address is sent only for languages where Supertext offers it.
- Added: automatic API key check when the settings are saved, shown under the API key; *Test connection* shows the same messages (with the account and API key links).
- Added: *Send version information to Supertext* (on by default; `SUPERTEXT_VERSION_REPORTS=0` turns it off for all accounts): reports the Mailchimp account's ID, the app, Node.js and SDK versions and the key check result to Supertext's Commando Center. No content, API key or personal data.
- Fixed: a target language Supertext doesn't know is now reported as an unsupported language pair (was: not found).

## 0.1.0 — 2026-10-09

First version (in development: tested against a stand-in of the Mailchimp API, not yet on a real account).

- Hosted app connected to Mailchimp with OAuth: turns a campaign into one draft per language, next to the original, with the subject line, preview text and content translated by Supertext AI.
- Two ways to start, each can be turned off: move a campaign into a *Supertext* folder in Mailchimp (*All languages* or one per language; the original goes back to its folder), or pick campaign and languages on the app's *Translate* page.
- Each draft goes to the subscribers with its language (Mailchimp's language condition, combined with the original's own segment where possible); optionally the original goes only to subscribers without a translated language.
- Keeps layout, images, links and merge tags (refuses a translation that lost one); template campaigns are written into their editable sections, others as HTML; plain-text campaigns too.
- Existing drafts are kept unless *Update existing drafts* is ticked (with a warning); moving a campaign into a folder again translates it afresh.
- Settings per Mailchimp account: Supertext API key (stored encrypted, with account and API key links), *Test connection*, campaign language, target languages with their Supertext codes, the two triggers, the original's audience, form of address, disconnecting, and the app version linked to its release.
- Recent translations from both triggers with the result per language and links into Mailchimp.
- Interface in English, German, French and Italian.
- `npm run mailchimp:probe` to check a real account (read-only, or `--write` on a throw-away copy).
