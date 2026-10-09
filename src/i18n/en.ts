// English: the source language and the fallback for missing keys.
// Placeholders in braces ({count}, {settings}) are filled in by the code;
// never translate them. Keys ending in .one / .other are plural forms.

export const en = {
  // Top bar
  'nav.translate': 'Translate',
  'nav.settings': 'Settings',
  'nav.language': 'Language',

  // API key help (shown wherever the key is mentioned)
  'apiKeyHelp.text':
    'No Supertext account yet? {signup}. Generate your API key at {apiKey} (requires the Admin role).',
  'apiKeyHelp.signup': 'Create one at supertext.com',
  'apiKeyHelp.apiKey': 'supertext.com → Integrations → API',

  // Connect page
  'connect.heading': 'Supertext Translation for Mailchimp',
  'connect.intro':
    'Translate your Mailchimp campaigns with Supertext AI. Each language gets its own draft next to the original, sent only to the subscribers who speak it.',
  'connect.point1': 'Move a campaign into a Supertext folder in Mailchimp, or pick it here.',
  'connect.point2': 'Subject line, preview text and content are translated; layout, images, links and merge tags stay.',
  'connect.point3': 'Review the drafts in Mailchimp and send them as usual.',
  'connect.button': 'Connect Mailchimp',
  'connect.hint': 'You log in with Mailchimp and allow Supertext to read and create campaigns in your account.',
  'connect.denied': "Mailchimp access wasn't granted. Connect again to use the app.",
  'connect.disconnected': 'Mailchimp is disconnected. Your settings were removed.',

  // Translate page
  'translate.heading': 'Translate with Supertext',
  'translate.intro':
    'Turn a campaign into one draft per language. The drafts appear in Mailchimp next to the original, each sent only to subscribers with that language.',
  'translate.noKey.heading': 'Add your Supertext API key',
  'translate.noKey.text': 'The app needs a Supertext API key before it can translate. Enter it under {settings}.',
  'translate.noKey.settings': 'Settings',
  'translate.noLanguages.heading': 'Choose your languages',
  'translate.noLanguages.text': 'Choose the languages to translate into under {settings}.',
  'translate.appOff':
    'Translating from the app is turned off under Settings. Move a campaign into a Supertext folder in Mailchimp instead.',
  'translate.folderTip': 'You can also start in Mailchimp: move a campaign into the folder {folder}.',
  'translate.step1': '1. Choose a campaign',
  'translate.campaign': 'Campaign',
  'translate.audience': 'Audience',
  'translate.empty': 'No campaigns yet. Create one in Mailchimp, then come back here.',
  'translate.previousPage': 'Previous page',
  'translate.nextPage': 'Next page',
  'translate.step2': '2. Choose the languages',
  'translate.from': 'Translating from {language}.',
  'translate.fromAuto': 'Supertext detects the language of the campaign.',
  'translate.overwrite': 'Update existing drafts',
  'translate.overwriteHint': 'Without this option, languages that have a draft already are kept.',
  'translate.overwriteWarning':
    'The drafts made earlier will be replaced, including changes made by hand in Mailchimp.',
  'translate.submit': 'Translate with Supertext',
  'translate.submitCount.one': 'Translate into {count} language with Supertext',
  'translate.submitCount.other': 'Translate into {count} languages with Supertext',
  'translate.selectSomething': 'Select a campaign and at least one language.',
  'translate.starting': 'Starting…',

  // Campaign status (Mailchimp's)
  'status.save': 'Draft',
  'status.paused': 'Paused',
  'status.schedule': 'Scheduled',
  'status.sending': 'Sending',
  'status.sent': 'Sent',
  'status.other': 'Other',

  // Draft state per language
  'state.none': 'No draft',
  'state.draft': 'Draft',

  // Progress and results
  'job.heading': 'Translation',
  'job.running': 'Translating “{campaign}”… {completed} of {total}',
  'job.done': 'Done: {created} created, {updated} updated, {kept} kept, {failed} failed.',
  'job.failed': 'The translation stopped: {reason}',
  'job.created': 'New draft',
  'job.updated': 'Draft updated',
  'job.kept': 'Draft exists, kept',
  'job.open': 'Open in Mailchimp',
  'job.segmentNotCombined':
    "Goes to everyone with this language: the original's own segment couldn't be combined with the language.",
  'job.htmlOnly': "Saved as HTML: edit it with Mailchimp's code editor.",
  'job.originalLimited': 'The original now goes only to subscribers without a translated language.',
  'job.originalNotLimited': "The original's audience was kept: its segment couldn't be combined with the languages.",
  'job.trigger.app': 'Started in the app',
  'job.trigger.folder': 'Started from a Supertext folder',
  'history.heading': 'Recent translations',
  'history.empty': 'No translations yet.',

  // Folder names in Mailchimp
  'folder.all': 'All languages',

  // Settings page
  'settings.heading': 'Supertext settings',
  'settings.saved': 'Settings saved.',
  'settings.invalidCodes': "Saved, except these language codes, which aren't valid codes like de-CH: {codes}.",
  'settings.foldersFailed': 'Saved, but the Supertext folders could not be updated in Mailchimp: {reason}',
  'settings.apiKey.heading': 'Supertext API key',
  'settings.apiKey.label': 'API key',
  'settings.apiKey.placeholder': 'Paste your Supertext API key',
  'settings.apiKey.placeholderSaved': 'A key is saved (stored encrypted). Enter a new one to replace it.',
  'settings.apiKey.server': 'No key of your own yet: the app uses the key set on the server.',
  'settings.apiKey.remove': 'Remove the saved key',
  'settings.test': 'Test connection',
  'settings.testing': 'Testing…',
  'settings.testOk': 'Connected. The API key works.',
  'settings.languages.heading': 'Languages',
  'settings.languages.text':
    "Mailchimp knows each subscriber's language (detected from their browser or set in your audience). Each translation goes to the subscribers with that language.",
  'settings.languages.source': 'Language of your campaigns',
  'settings.languages.auto': 'Let Supertext detect it',
  'settings.languages.targets': 'Translate into',
  'settings.languages.code': 'Supertext code',
  'settings.languages.codeHint':
    'Supertext needs a region, for example de-CH for Swiss German or fr-FR for French as spoken in France.',
  'settings.start.heading': 'Start translations from',
  'settings.start.folders': 'Mailchimp folders',
  'settings.start.foldersHint':
    'Move a campaign into a Supertext folder in Mailchimp, for example {folder}. The drafts appear a minute or two later, and the original goes back to its folder.',
  'settings.start.foldersWarning':
    'Moving a campaign into a Supertext folder again replaces its drafts, including changes made by hand.',
  'settings.start.app': 'The Supertext app',
  'settings.start.appHint': "Pick a campaign and the languages on this app's Translate page.",
  'settings.start.none': 'At least one way is needed, so the Supertext app stays on.',
  'settings.audience.heading': 'Audience',
  'settings.audience.limit': 'Send the original only to subscribers without a translated language',
  'settings.audience.limitHint':
    'Off: the original keeps its audience, so subscribers with a translated language get both versions.',
  'settings.style.heading': 'Translation',
  'settings.style.label': 'Form of address',
  'settings.style.default': 'Let Supertext decide',
  'settings.style.more': 'Formal (e.g. German “Sie”)',
  'settings.style.less': 'Informal (e.g. German “du”)',
  'settings.save': 'Save',
  'settings.connection.heading': 'Mailchimp',
  'settings.connection.account': 'Connected to the Mailchimp account {account}.',
  'settings.connection.disconnect': 'Disconnect Mailchimp',
  'settings.connection.disconnectHint':
    'Removes your settings and the empty Supertext folders. Drafts already made stay in Mailchimp.',
  'settings.connection.confirm': 'Disconnect Mailchimp from Supertext? Your settings will be removed.',
  'settings.about.heading': 'About',
  'settings.about.version': 'Supertext Translation for Mailchimp, version {version}',

  // Errors from Supertext and Mailchimp (codes set by LocalizedError)
  'error.noApiKey':
    'No Supertext API key configured. Add it under Settings. No Supertext account yet? Create one at https://www.supertext.com/person/en/account/signin. Generate your API key at https://www.supertext.com/en/integrations/api (requires the Admin role).',
  'error.noFileId': 'Supertext did not return a file id.',
  'error.translationFailed': 'Supertext failed to translate the document.',
  'error.limitExceeded': 'Your Supertext translation limit is exceeded.',
  'error.fileDeleted': 'The Supertext file was deleted before it could be downloaded.',
  'error.timeout': 'Timed out waiting for the Supertext translation.',
  'error.emptyTranslation': 'The translated document was empty.',
  'error.unreachable': 'Could not reach Supertext: {reason}',
  'error.auth':
    'Authentication failed. Please check the Supertext API key. No Supertext account yet? Create one at https://www.supertext.com/person/en/account/signin. Generate your API key at https://www.supertext.com/en/integrations/api (requires the Admin role).',
  'error.notFound': 'The requested Supertext resource was not found.',
  'error.tooLarge': 'The content is too large for Supertext to translate in one go.',
  'error.rateLimited': 'Too many requests to Supertext. Please try again shortly.',
  'error.unavailable': 'The Supertext service is currently unavailable.',
  'error.http': 'Supertext answered with HTTP {status}.',
  'error.languagePair':
    'Supertext doesn\'t translate from "{source}" into "{target}". Set the Supertext code for this language under Settings → Languages, with a region (e.g. de-CH, fr-FR, en-US).',
  'error.languagePairUnknown':
    "Supertext doesn't translate into this language. Set the Supertext code for this language under Settings → Languages, with a region (e.g. de-CH, fr-FR, en-US).",
  'error.incomplete': 'Supertext returned {received} of {sent} texts; nothing was saved for this language.',
  'error.mergeTags': 'Supertext returned {received} of {sent} merge tags; nothing was saved for this language.',
  'error.notConnected': 'Mailchimp is not connected. Connect it again.',
  'error.notConfigured':
    'The app is missing its Mailchimp credentials (MAILCHIMP_CLIENT_ID, MAILCHIMP_CLIENT_SECRET).',
  'error.oauthFailed': 'Mailchimp did not grant access. Connect again.',
  'error.mailchimpAuth': 'Mailchimp refused the connection. Connect Mailchimp again.',
  'error.mailchimpForbidden': 'Mailchimp refused the request.',
  'error.mailchimpNotFound': 'Not found in Mailchimp.',
  'error.mailchimpRateLimited': 'Too many requests to Mailchimp. Please try again shortly.',
  'error.mailchimpUnavailable': 'Mailchimp is currently unavailable. Please try again shortly.',
  'error.mailchimpHttp': 'Mailchimp answered with HTTP {status}.',
  'error.mailchimpUnreachable': 'Could not reach Mailchimp: {reason}',
  'error.campaignMissing': 'The campaign no longer exists in Mailchimp.',
  'error.campaignType': 'Only regular and plain-text campaigns can be translated (this one is “{type}”).',
  'error.noContent':
    "Mailchimp returned no content for this campaign. Campaigns made with Mailchimp's new email builder may not be readable through the API yet.",
  'error.isTranslation': 'This campaign is a translation made by Supertext. Translate its original instead.',
  'error.sameLanguage': 'This is the language of the campaign itself.',
  'error.interrupted': 'The app restarted during the translation. Start it again; finished languages are kept.',
  'error.session': 'Your session has expired. Connect Mailchimp again.',
  'error.select': 'Select a campaign and at least one language.',
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
