import type { Messages } from './en.js';

// Italian, with "Lei" and the terms of Mailchimp's Italian interface (campagna,
// pubblico, bozza, cartella, tag di unione, oggetto, testo di anteprima).
export const it: Messages = {
  'nav.translate': 'Traduci',
  'nav.settings': 'Impostazioni',
  'nav.language': 'Lingua',

  'apiKeyHelp.text':
    'Non ha ancora un account Supertext? {signup}. Generi la Sua chiave API in {apiKey} (richiede il ruolo Admin).',
  'apiKeyHelp.signup': 'Ne crei uno su supertext.com',
  'apiKeyHelp.apiKey': 'supertext.com → Integrations → API',

  'connect.heading': 'Supertext Translation per Mailchimp',
  'connect.intro':
    'Traduca le Sue campagne Mailchimp con Supertext AI. Ogni lingua riceve la propria bozza accanto all’originale, inviata solo agli iscritti che la parlano.',
  'connect.point1': 'Sposti una campagna in una cartella Supertext di Mailchimp oppure la scelga qui.',
  'connect.point2':
    'Oggetto, testo di anteprima e contenuto vengono tradotti; layout, immagini, link e tag di unione restano invariati.',
  'connect.point3': 'Controlli le bozze in Mailchimp e le invii come di consueto.',
  'connect.button': 'Collega Mailchimp',
  'connect.hint':
    'Accede con Mailchimp e autorizza Supertext a leggere e creare campagne nel Suo account.',
  'connect.denied': 'L’accesso a Mailchimp non è stato concesso. Si colleghi di nuovo per usare l’app.',
  'connect.disconnected': 'Mailchimp è scollegato. Le Sue impostazioni sono state rimosse.',

  'translate.heading': 'Traduci con Supertext',
  'translate.intro':
    'Trasformi una campagna in una bozza per lingua. Le bozze compaiono in Mailchimp accanto all’originale, ciascuna inviata solo agli iscritti di quella lingua.',
  'translate.noKey.heading': 'Aggiunga la Sua chiave API Supertext',
  'translate.noKey.text': 'L’app ha bisogno di una chiave API Supertext per tradurre. La inserisca in {settings}.',
  'translate.noKey.settings': 'Impostazioni',
  'translate.noLanguages.heading': 'Scelga le Sue lingue',
  'translate.noLanguages.text': 'Scelga in {settings} le lingue in cui tradurre.',
  'translate.appOff':
    'La traduzione dall’app è disattivata nelle impostazioni. Sposti invece una campagna in una cartella Supertext di Mailchimp.',
  'translate.folderTip': 'Può anche iniziare in Mailchimp: sposti una campagna nella cartella {folder}.',
  'translate.step1': '1. Scelga una campagna',
  'translate.campaign': 'Campagna',
  'translate.audience': 'Pubblico',
  'translate.empty': 'Ancora nessuna campagna. Ne crei una in Mailchimp e poi torni qui.',
  'translate.previousPage': 'Pagina precedente',
  'translate.nextPage': 'Pagina successiva',
  'translate.step2': '2. Scelga le lingue',
  'translate.from': 'Traduzione da: {language}.',
  'translate.fromAuto': 'Supertext riconosce la lingua della campagna.',
  'translate.overwrite': 'Aggiorna le bozze esistenti',
  'translate.overwriteHint': 'Senza questa opzione, le lingue che hanno già una bozza restano invariate.',
  'translate.overwriteWarning':
    'Le bozze create in precedenza verranno sostituite, comprese le modifiche fatte a mano in Mailchimp.',
  'translate.submit': 'Traduci con Supertext',
  'translate.submitCount.one': 'Traduci in {count} lingua con Supertext',
  'translate.submitCount.other': 'Traduci in {count} lingue con Supertext',
  'translate.selectSomething': 'Selezioni una campagna e almeno una lingua.',
  'translate.starting': 'Avvio…',

  'status.save': 'Bozza',
  'status.paused': 'In pausa',
  'status.schedule': 'Programmata',
  'status.sending': 'In invio',
  'status.sent': 'Inviata',
  'status.other': 'Altro',

  'state.none': 'Nessuna bozza',
  'state.draft': 'Bozza',

  'job.heading': 'Traduzione',
  'job.running': 'Traduzione di «{campaign}» in corso… {completed} di {total}',
  'job.done': 'Fatto: {created} create, {updated} aggiornate, {kept} mantenute, {failed} non riuscite.',
  'job.failed': 'La traduzione si è interrotta: {reason}',
  'job.created': 'Nuova bozza',
  'job.updated': 'Bozza aggiornata',
  'job.kept': 'Bozza esistente, mantenuta',
  'job.open': 'Apri in Mailchimp',
  'job.segmentNotCombined':
    'Inviata a tutti gli iscritti di questa lingua: non è stato possibile combinare il segmento dell’originale con la lingua.',
  'job.htmlOnly': 'Salvata come HTML: la modifichi con l’editor di codice di Mailchimp.',
  'job.originalLimited': 'L’originale ora viene inviato solo agli iscritti senza una lingua tradotta.',
  'job.originalNotLimited':
    'Il pubblico dell’originale è stato mantenuto: non è stato possibile combinare il suo segmento con le lingue.',
  'job.trigger.app': 'Avviata nell’app',
  'job.trigger.folder': 'Avviata da una cartella Supertext',
  'history.heading': 'Traduzioni recenti',
  'history.empty': 'Ancora nessuna traduzione.',

  'folder.all': 'Tutte le lingue',

  'settings.heading': 'Impostazioni Supertext',
  'settings.saved': 'Impostazioni salvate.',
  'settings.invalidCodes': 'Salvato, tranne questi codici di lingua, che non sono codici validi come de-CH: {codes}.',
  'settings.foldersFailed':
    'Salvato, ma non è stato possibile aggiornare le cartelle Supertext in Mailchimp: {reason}',
  'settings.apiKey.heading': 'Chiave API Supertext',
  'settings.apiKey.label': 'Chiave API',
  'settings.apiKey.placeholder': 'Incolli la Sua chiave API Supertext',
  'settings.apiKey.placeholderSaved': 'È salvata una chiave (cifrata). Ne inserisca una nuova per sostituirla.',
  'settings.apiKey.server': 'Ancora nessuna chiave propria: l’app usa la chiave impostata sul server.',
  'settings.apiKey.remove': 'Rimuovi la chiave salvata',
  'settings.test': 'Verifica connessione',
  'settings.testing': 'Verifica in corso…',
  'settings.testOk': 'Connesso. La chiave API funziona.',
  'settings.languages.heading': 'Lingue',
  'settings.languages.text':
    'Mailchimp conosce la lingua di ogni iscritto (rilevata dal browser o impostata nel Suo pubblico). Ogni traduzione viene inviata agli iscritti di quella lingua.',
  'settings.languages.source': 'Lingua delle Sue campagne',
  'settings.languages.auto': 'Lasciare che Supertext la riconosca',
  'settings.languages.targets': 'Traduci in',
  'settings.languages.code': 'Codice Supertext',
  'settings.languages.codeHint':
    'Supertext ha bisogno di una regione, per esempio de-CH per il tedesco svizzero o fr-FR per il francese di Francia.',
  'settings.start.heading': 'Avvia le traduzioni da',
  'settings.start.folders': 'Le cartelle di Mailchimp',
  'settings.start.foldersHint':
    'Sposti una campagna in una cartella Supertext di Mailchimp, per esempio {folder}. Le bozze compaiono uno o due minuti dopo e l’originale torna nella sua cartella.',
  'settings.start.foldersWarning':
    'Spostare di nuovo una campagna in una cartella Supertext sostituisce le sue bozze, comprese le modifiche fatte a mano.',
  'settings.start.app': 'L’app Supertext',
  'settings.start.appHint': 'Scelga una campagna e le lingue nella pagina «Traduci» di questa app.',
  'settings.start.none': 'Serve almeno un modo, perciò l’app Supertext resta attiva.',
  'settings.audience.heading': 'Pubblico',
  'settings.audience.limit': 'Invia l’originale solo agli iscritti senza una lingua tradotta',
  'settings.audience.limitHint':
    'Disattivato: l’originale mantiene il suo pubblico, quindi gli iscritti di una lingua tradotta ricevono entrambe le versioni.',
  'settings.style.heading': 'Traduzione',
  'settings.style.label': 'Forma di cortesia',
  'settings.style.default': 'Lasciare decidere a Supertext',
  'settings.style.more': 'Formale (p. es. «Lei»)',
  'settings.style.less': 'Informale (p. es. «tu»)',
  'settings.save': 'Salva',
  'settings.connection.heading': 'Mailchimp',
  'settings.connection.account': 'Collegato all’account Mailchimp {account}.',
  'settings.connection.disconnect': 'Scollega Mailchimp',
  'settings.connection.disconnectHint':
    'Rimuove le Sue impostazioni e le cartelle Supertext vuote. Le bozze già create restano in Mailchimp.',
  'settings.connection.confirm': 'Scollegare Mailchimp da Supertext? Le Sue impostazioni verranno rimosse.',
  'settings.about.heading': 'Informazioni',
  'settings.about.version': 'Supertext Translation per Mailchimp, versione {version}',

  'error.noApiKey':
    'Nessuna chiave API Supertext configurata. La aggiunga nelle impostazioni. Non ha ancora un account Supertext? Ne crei uno su https://www.supertext.com/person/en/account/signin. Generi la Sua chiave API in https://www.supertext.com/en/integrations/api (richiede il ruolo Admin).',
  'error.noFileId': 'Supertext non ha restituito un ID file.',
  'error.translationFailed': 'Supertext non è riuscito a tradurre il documento.',
  'error.limitExceeded': 'Il Suo limite di traduzione Supertext è stato superato.',
  'error.fileDeleted': 'Il file Supertext è stato eliminato prima di poter essere scaricato.',
  'error.timeout': 'Tempo scaduto in attesa della traduzione Supertext.',
  'error.emptyTranslation': 'Il documento tradotto era vuoto.',
  'error.unreachable': 'Impossibile raggiungere Supertext: {reason}',
  'error.auth':
    'Autenticazione non riuscita. Verifichi la chiave API Supertext. Non ha ancora un account Supertext? Ne crei uno su https://www.supertext.com/person/en/account/signin. Generi la Sua chiave API in https://www.supertext.com/en/integrations/api (richiede il ruolo Admin).',
  'error.notFound': 'La risorsa Supertext richiesta non è stata trovata.',
  'error.tooLarge': 'Il contenuto è troppo grande per essere tradotto da Supertext in una volta sola.',
  'error.rateLimited': 'Troppe richieste a Supertext. Riprovi tra poco.',
  'error.unavailable': 'Il servizio Supertext al momento non è disponibile.',
  'error.http': 'Supertext ha risposto con HTTP {status}.',
  'error.languagePair':
    'Supertext non traduce da «{source}» a «{target}». Imposti il codice Supertext di questa lingua in Impostazioni → Lingue, con una regione (p. es. de-CH, fr-FR, en-US).',
  'error.languagePairUnknown':
    'Supertext non traduce in questa lingua. Imposti il codice Supertext di questa lingua in Impostazioni → Lingue, con una regione (p. es. de-CH, fr-FR, en-US).',
  'error.incomplete': 'Supertext ha restituito {received} testi su {sent}; per questa lingua non è stato salvato nulla.',
  'error.mergeTags':
    'Supertext ha restituito {received} tag di unione su {sent}; per questa lingua non è stato salvato nulla.',
  'error.notConnected': 'Mailchimp non è collegato. Lo colleghi di nuovo.',
  'error.notConfigured': 'All’app mancano le credenziali Mailchimp (MAILCHIMP_CLIENT_ID, MAILCHIMP_CLIENT_SECRET).',
  'error.oauthFailed': 'Mailchimp non ha concesso l’accesso. Si colleghi di nuovo.',
  'error.mailchimpAuth': 'Mailchimp ha rifiutato la connessione. Colleghi di nuovo Mailchimp.',
  'error.mailchimpForbidden': 'Mailchimp ha rifiutato la richiesta.',
  'error.mailchimpNotFound': 'Non trovato in Mailchimp.',
  'error.mailchimpRateLimited': 'Troppe richieste a Mailchimp. Riprovi tra poco.',
  'error.mailchimpUnavailable': 'Mailchimp al momento non è disponibile. Riprovi tra poco.',
  'error.mailchimpHttp': 'Mailchimp ha risposto con HTTP {status}.',
  'error.mailchimpUnreachable': 'Impossibile raggiungere Mailchimp: {reason}',
  'error.campaignMissing': 'La campagna non esiste più in Mailchimp.',
  'error.campaignType': 'Si possono tradurre solo campagne normali e di solo testo (questa è «{type}»).',
  'error.noContent':
    'Mailchimp non ha restituito alcun contenuto per questa campagna. Le campagne create con il nuovo generatore di email di Mailchimp potrebbero non essere ancora leggibili tramite l’API.',
  'error.isTranslation': 'Questa campagna è una traduzione creata da Supertext. Traduca invece il suo originale.',
  'error.sameLanguage': 'Questa è la lingua della campagna stessa.',
  'error.interrupted':
    'L’app è stata riavviata durante la traduzione. La avvii di nuovo; le lingue completate vengono mantenute.',
  'error.session': 'La Sua sessione è scaduta. Colleghi di nuovo Mailchimp.',
  'error.select': 'Selezioni una campagna e almeno una lingua.',
};
