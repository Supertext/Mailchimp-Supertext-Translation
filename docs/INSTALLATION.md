# Installation guide — Supertext Translation for Mailchimp

For Mailchimp account owners and administrators setting up Supertext Translation.

> **Status: in development.** The app is tested against a stand-in of the Mailchimp API. It isn't in the Mailchimp Marketplace yet and hasn't been tried on a real account. Ask Supertext before using it with a live audience.

## How it works

Supertext Translation is an app that runs on Supertext's servers and connects to your Mailchimp account. For each campaign you translate, it makes one **draft per language** in Mailchimp, next to the original: a copy with the subject line, preview text and content translated by Supertext AI, sent only to the subscribers whose language is that language. You review the drafts in Mailchimp and send them as usual.

You start a translation in one of two ways (you choose which in the settings):

- **In Mailchimp:** move a campaign into one of the *Supertext* folders the app creates, for example *Supertext → German*.
- **In the app:** pick the campaign and the languages on the app's *Translate* page.

The app never sends anything to your subscribers and never changes the original's content.

## Requirements

| | |
| --- | --- |
| Mailchimp | Any Mailchimp account. You connect it with a Mailchimp user who can create and edit campaigns (Admin or Manager). |
| Subscriber languages | Mailchimp knows each subscriber's language: it detects it from their browser when they sign up or open an email, or you set it in the audience (field *Language*, or with an import). The translations go to the subscribers with that language. |
| Supertext | An account with an API key, see [step 1](#1-get-a-supertext-account-and-api-key) |

## 1. Get a Supertext account and API key

1. **Account:** no Supertext account yet? [Log in or create one](https://www.supertext.com/person/en/account/signin) with your email address.
2. **API key:** generate it at [supertext.com → Integrations → API](https://www.supertext.com/en/integrations/api). Only users with the **Admin** role in the Supertext account can do this; otherwise ask your Supertext account admin for a key.

The app's settings page links to both, next to the API key field.

## 2. Connect Mailchimp

Open the app (Supertext sends you its address until it is listed in the Mailchimp Marketplace) and click **Connect Mailchimp**. Mailchimp asks you to log in and to allow *Supertext Translation* to access your account; confirm. You come back to the app's settings.

<img src="images/connect.png" alt="Supertext Translation for Mailchimp: what the app does in three points and the button Connect Mailchimp" width="640">

Everyone in your team who connects the same Mailchimp account shares its settings. The connection stays until you disconnect it in the app or remove the app in Mailchimp (Profile → Extras → Connected sites / apps).

## 3. Settings

Enter the API key, choose your languages and click **Save**. Then click **Test connection**: *Connected. The API key works.* means everything is in place.

<img src="images/settings.png" alt="Supertext settings: the saved API key with links to create a Supertext account and generate the key, Test connection with Connected. The API key works., the language of the campaigns (English), French, German and Italian ticked with the Supertext codes fr-CH, de-CH and it-CH, Start translations from: Mailchimp folders and The Supertext app, Send the original only to subscribers without a translated language, the form of address, the connected account and the version 0.1.0" width="720">

| Setting | Default | Purpose |
| --- | --- | --- |
| API key | – | Your Supertext key, with or without the `Supertext-Auth-Key` prefix; stored encrypted. *Remove the saved key* deletes it. |
| Test connection | – | Checks the key (entered or saved) with Supertext, without translating anything |
| Language of your campaigns | English | The language you write your campaigns in. *Let Supertext detect it* works too, but then the app can't leave that language out of the targets. |
| Translate into | none | The languages to translate into. Each one gets a draft per campaign and, with the folder trigger, its own Supertext folder. |
| Supertext code | the language's default (e.g. `de-DE`, `fr-FR`, `en-US`) | The variant Supertext translates into. Supertext needs a region, for example `de-CH` for Swiss German or `fr-CH` for French as written in Switzerland. The campaign language is sent without region (`en`). |
| Start translations from: Mailchimp folders | On | The app creates the folders *Supertext → All languages* and one per language (*Supertext → German* …) and checks them every minute. Turning it off deletes the empty Supertext folders. |
| Start translations from: The Supertext app | On | The *Translate* page offers the campaigns. At least one of the two stays on. |
| Send the original only to subscribers without a translated language | On | After translating, the original's audience gets "language is not German, not French …" added, so nobody receives two versions. Off: the original keeps its audience. |
| Form of address | Let Supertext decide | *Formal* (German "Sie", French "vous") or *Informal* ("du", "tu") |

The folder names are written in the language of the app's interface at the moment you save the settings (top right: EN, DE, FR, IT).

The settings page also shows the app's version, linked to its release notes.

## Who can translate

Everyone who has connected the Mailchimp account in the app, and, with the folder trigger, everyone who can move campaigns between folders in Mailchimp.

## Updating

Nothing to do: the app runs on Supertext's servers and is updated there. The settings page shows the current version.

## Disconnecting

**Settings → Disconnect Mailchimp** deletes your settings, the stored token and API key, and the empty Supertext folders. Drafts already made stay in Mailchimp. To also revoke the app's access on Mailchimp's side, remove it in Mailchimp under your profile's connected apps. If you only remove it there, the app notices at its next folder check and forgets the token.

## Troubleshooting

| Message | Cause / fix |
| --- | --- |
| *Your session has expired* | Connect Mailchimp again on the start page. |
| *Mailchimp access wasn't granted* | You declined on Mailchimp's page. Click **Connect Mailchimp** again. |
| *Mailchimp refused the connection* | The app's access was revoked in Mailchimp, or the user who connected it left the account. Connect again. |
| *Add your Supertext API key* / *No Supertext API key configured* | Enter the key under Settings (step 3). |
| *Authentication failed* | The key is wrong or revoked. Check it with **Test connection**; if needed, generate a new one at [supertext.com → Integrations → API](https://www.supertext.com/en/integrations/api) (Admin role required). |
| *Choose your languages* | No languages are ticked under Settings → Languages. |
| *Supertext doesn't translate into …* | Set the language's Supertext code with a region (e.g. `de-CH`). |
| *Saved, but the Supertext folders could not be updated in Mailchimp* | Mailchimp refused to create or rename a folder. Save again later; the reason is shown. |
| *Mailchimp returned no content for this campaign* | Campaigns made with Mailchimp's new email builder may not be readable through Mailchimp's API yet. Use the classic builder or code your own. |
| *Only regular and plain-text campaigns can be translated* | A/B tests (multivariate) and RSS campaigns aren't supported. |
| *Too many requests to Supertext / Mailchimp* | The per-second limit was still exceeded after 4 automatic retries. Wait a moment and start again. |
| *Your Supertext translation limit is exceeded* | Your Supertext plan's volume is used up. |
| *The app restarted during the translation* | Start the translation again; languages already done are kept. |
| A campaign stays in a Supertext folder | Mailchimp doesn't allow moving some sent campaigns. It is translated once anyway; move it out by hand. |

## Privacy and security

- The texts you translate are sent to Supertext (api.supertext.com) and deleted there right after download (they expire after 24 hours anyway).
- The app stores per Mailchimp account: the account name, the OAuth token and the Supertext API key (both encrypted), the settings above, which draft belongs to which campaign and language, where each campaign was last seen (for the folder trigger), and the list of recent translations (campaign names and results). It doesn't store your campaigns' content or any subscriber data.
- The app reads campaigns and folders and creates and edits draft campaigns. It never sends or schedules a campaign.
