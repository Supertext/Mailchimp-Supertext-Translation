# Changelog

All notable changes to Supertext Translation for Mailchimp.

## Unreleased

- Changed: Supertext is reached through the Supertext SDK for TypeScript (bundled from `vendor/supertext-sdk/` until it is on npm) instead of the app's own client. Same protocol; the app now identifies itself in the User-Agent, and the API key is masked wherever Supertext's answer echoes it.
- Changed: a Supertext code without a region in the language settings (e.g. `fr`) is sent with the default region (`fr-FR`) instead of being rejected by Supertext.
- Fixed: Norwegian as the campaign language is sent to Supertext as `nb` (the language of its Supertext code) instead of Mailchimp's `no`.

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
