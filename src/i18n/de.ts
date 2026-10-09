import type { Messages } from './en.js';

// German, formal address, with the terms of Mailchimp's German interface
// (Kampagne, Zielgruppe, Entwurf, Ordner, Merge-Tags, Betreffzeile, Vorschautext).
export const de: Messages = {
  'nav.translate': 'Übersetzen',
  'nav.settings': 'Einstellungen',
  'nav.language': 'Sprache',

  'apiKeyHelp.text':
    'Noch kein Supertext-Konto? {signup}. Generieren Sie Ihren API-Schlüssel unter {apiKey} (erfordert die Admin-Rolle).',
  'apiKeyHelp.signup': 'Erstellen Sie eines auf supertext.com',
  'apiKeyHelp.apiKey': 'supertext.com → Integrations → API',

  'connect.heading': 'Supertext Translation für Mailchimp',
  'connect.intro':
    'Übersetzen Sie Ihre Mailchimp-Kampagnen mit Supertext AI. Jede Sprache erhält einen eigenen Entwurf neben dem Original, der nur an die Abonnenten mit dieser Sprache geht.',
  'connect.point1': 'Verschieben Sie eine Kampagne in Mailchimp in einen Supertext-Ordner oder wählen Sie sie hier aus.',
  'connect.point2':
    'Betreffzeile, Vorschautext und Inhalt werden übersetzt; Layout, Bilder, Links und Merge-Tags bleiben erhalten.',
  'connect.point3': 'Prüfen Sie die Entwürfe in Mailchimp und versenden Sie sie wie gewohnt.',
  'connect.button': 'Mailchimp verbinden',
  'connect.hint':
    'Sie melden sich bei Mailchimp an und erlauben Supertext, Kampagnen in Ihrem Konto zu lesen und zu erstellen.',
  'connect.denied': 'Der Zugriff auf Mailchimp wurde nicht gewährt. Verbinden Sie Mailchimp erneut, um die App zu nutzen.',
  'connect.disconnected': 'Mailchimp ist getrennt. Ihre Einstellungen wurden entfernt.',

  'translate.heading': 'Mit Supertext übersetzen',
  'translate.intro':
    'Machen Sie aus einer Kampagne einen Entwurf pro Sprache. Die Entwürfe erscheinen in Mailchimp neben dem Original und gehen jeweils nur an die Abonnenten mit dieser Sprache.',
  'translate.noKey.heading': 'Supertext-API-Schlüssel hinzufügen',
  'translate.noKey.text':
    'Die App benötigt einen Supertext-API-Schlüssel, bevor sie übersetzen kann. Geben Sie ihn unter {settings} ein.',
  'translate.noKey.settings': 'Einstellungen',
  'translate.noLanguages.heading': 'Sprachen auswählen',
  'translate.noLanguages.text': 'Wählen Sie unter {settings} die Sprachen aus, in die übersetzt werden soll.',
  'translate.appOff':
    'Das Übersetzen in der App ist in den Einstellungen ausgeschaltet. Verschieben Sie stattdessen eine Kampagne in Mailchimp in einen Supertext-Ordner.',
  'translate.folderTip': 'Sie können auch in Mailchimp starten: Verschieben Sie eine Kampagne in den Ordner {folder}.',
  'translate.step1': '1. Kampagne auswählen',
  'translate.campaign': 'Kampagne',
  'translate.audience': 'Zielgruppe',
  'translate.empty': 'Noch keine Kampagnen. Erstellen Sie eine in Mailchimp und kehren Sie dann hierher zurück.',
  'translate.previousPage': 'Vorherige Seite',
  'translate.nextPage': 'Nächste Seite',
  'translate.step2': '2. Sprachen auswählen',
  'translate.from': 'Übersetzt wird aus {language}.',
  'translate.fromAuto': 'Supertext erkennt die Sprache der Kampagne.',
  'translate.overwrite': 'Vorhandene Entwürfe aktualisieren',
  'translate.overwriteHint': 'Ohne diese Option bleiben Sprachen, für die es bereits einen Entwurf gibt, unverändert.',
  'translate.overwriteWarning':
    'Die früher erstellten Entwürfe werden ersetzt, auch Änderungen, die in Mailchimp von Hand gemacht wurden.',
  'translate.submit': 'Mit Supertext übersetzen',
  'translate.submitCount.one': 'In {count} Sprache mit Supertext übersetzen',
  'translate.submitCount.other': 'In {count} Sprachen mit Supertext übersetzen',
  'translate.selectSomething': 'Wählen Sie eine Kampagne und mindestens eine Sprache aus.',
  'translate.starting': 'Wird gestartet…',

  'status.save': 'Entwurf',
  'status.paused': 'Pausiert',
  'status.schedule': 'Geplant',
  'status.sending': 'Wird gesendet',
  'status.sent': 'Gesendet',
  'status.other': 'Andere',

  'state.none': 'Kein Entwurf',
  'state.draft': 'Entwurf',

  'job.heading': 'Übersetzung',
  'job.running': '„{campaign}“ wird übersetzt… {completed} von {total}',
  'job.done': 'Fertig: {created} erstellt, {updated} aktualisiert, {kept} beibehalten, {failed} fehlgeschlagen.',
  'job.failed': 'Die Übersetzung wurde abgebrochen: {reason}',
  'job.created': 'Neuer Entwurf',
  'job.updated': 'Entwurf aktualisiert',
  'job.kept': 'Entwurf vorhanden, beibehalten',
  'job.open': 'In Mailchimp öffnen',
  'job.segmentNotCombined':
    'Geht an alle mit dieser Sprache: Das Segment des Originals liess sich nicht mit der Sprache kombinieren.',
  'job.htmlOnly': 'Als HTML gespeichert: Bearbeiten Sie den Entwurf mit dem Code-Editor von Mailchimp.',
  'job.originalLimited': 'Das Original geht jetzt nur noch an Abonnenten ohne übersetzte Sprache.',
  'job.originalNotLimited':
    'Die Zielgruppe des Originals wurde beibehalten: Sein Segment liess sich nicht mit den Sprachen kombinieren.',
  'job.trigger.app': 'In der App gestartet',
  'job.trigger.folder': 'Aus einem Supertext-Ordner gestartet',
  'history.heading': 'Letzte Übersetzungen',
  'history.empty': 'Noch keine Übersetzungen.',

  'folder.all': 'Alle Sprachen',

  'settings.heading': 'Supertext-Einstellungen',
  'settings.saved': 'Einstellungen gespeichert.',
  'settings.invalidCodes': 'Gespeichert, ausser diesen Sprachcodes, die keine gültigen Codes wie de-CH sind: {codes}.',
  'settings.foldersFailed':
    'Gespeichert, aber die Supertext-Ordner konnten in Mailchimp nicht aktualisiert werden: {reason}',
  'settings.apiKey.heading': 'Supertext-API-Schlüssel',
  'settings.apiKey.label': 'API-Schlüssel',
  'settings.apiKey.placeholder': 'Fügen Sie Ihren Supertext-API-Schlüssel ein',
  'settings.apiKey.placeholderSaved':
    'Ein Schlüssel ist gespeichert (verschlüsselt). Geben Sie einen neuen ein, um ihn zu ersetzen.',
  'settings.apiKey.server': 'Noch kein eigener Schlüssel: Die App verwendet den auf dem Server hinterlegten Schlüssel.',
  'settings.apiKey.remove': 'Gespeicherten Schlüssel entfernen',
  'settings.test': 'Verbindung testen',
  'settings.testing': 'Wird getestet…',
  'settings.testOk': 'Verbunden. Der API-Schlüssel funktioniert.',
  'settings.languages.heading': 'Sprachen',
  'settings.languages.text':
    'Mailchimp kennt die Sprache jedes Abonnenten (aus dem Browser erkannt oder in Ihrer Zielgruppe festgelegt). Jede Übersetzung geht an die Abonnenten mit dieser Sprache.',
  'settings.languages.source': 'Sprache Ihrer Kampagnen',
  'settings.languages.auto': 'Von Supertext erkennen lassen',
  'settings.languages.targets': 'Übersetzen in',
  'settings.languages.code': 'Supertext-Code',
  'settings.languages.codeHint':
    'Supertext benötigt eine Region, zum Beispiel de-CH für Schweizerdeutsch oder fr-FR für Französisch, wie es in Frankreich gesprochen wird.',
  'settings.start.heading': 'Übersetzungen starten über',
  'settings.start.folders': 'Mailchimp-Ordner',
  'settings.start.foldersHint':
    'Verschieben Sie eine Kampagne in Mailchimp in einen Supertext-Ordner, zum Beispiel {folder}. Die Entwürfe erscheinen ein, zwei Minuten später, und das Original kehrt in seinen Ordner zurück.',
  'settings.start.foldersWarning':
    'Wird eine Kampagne erneut in einen Supertext-Ordner verschoben, werden ihre Entwürfe ersetzt, auch Änderungen von Hand.',
  'settings.start.app': 'Die Supertext-App',
  'settings.start.appHint': 'Wählen Sie Kampagne und Sprachen auf der Seite «Übersetzen» dieser App.',
  'settings.start.none': 'Mindestens ein Weg ist nötig, deshalb bleibt die Supertext-App eingeschaltet.',
  'settings.audience.heading': 'Zielgruppe',
  'settings.audience.limit': 'Das Original nur an Abonnenten ohne übersetzte Sprache senden',
  'settings.audience.limitHint':
    'Aus: Das Original behält seine Zielgruppe, Abonnenten mit einer übersetzten Sprache erhalten also beide Versionen.',
  'settings.style.heading': 'Übersetzung',
  'settings.style.label': 'Anrede',
  'settings.style.default': 'Supertext entscheiden lassen',
  'settings.style.more': 'Formell (z. B. «Sie»)',
  'settings.style.less': 'Informell (z. B. «du»)',
  'settings.save': 'Speichern',
  'settings.connection.heading': 'Mailchimp',
  'settings.connection.account': 'Verbunden mit dem Mailchimp-Konto {account}.',
  'settings.connection.disconnect': 'Mailchimp trennen',
  'settings.connection.disconnectHint':
    'Entfernt Ihre Einstellungen und die leeren Supertext-Ordner. Bereits erstellte Entwürfe bleiben in Mailchimp.',
  'settings.connection.confirm': 'Mailchimp von Supertext trennen? Ihre Einstellungen werden entfernt.',
  'settings.about.heading': 'Über',
  'settings.about.version': 'Supertext Translation für Mailchimp, Version {version}',

  'error.noApiKey':
    'Kein Supertext-API-Schlüssel eingerichtet. Fügen Sie ihn unter Einstellungen hinzu. Noch kein Supertext-Konto? Erstellen Sie eines auf https://www.supertext.com/person/en/account/signin. Generieren Sie Ihren API-Schlüssel unter https://www.supertext.com/en/integrations/api (erfordert die Admin-Rolle).',
  'error.noFileId': 'Supertext hat keine Datei-ID zurückgegeben.',
  'error.translationFailed': 'Supertext konnte das Dokument nicht übersetzen.',
  'error.limitExceeded': 'Ihr Supertext-Übersetzungslimit ist überschritten.',
  'error.fileDeleted': 'Die Supertext-Datei wurde gelöscht, bevor sie heruntergeladen werden konnte.',
  'error.timeout': 'Zeitüberschreitung beim Warten auf die Supertext-Übersetzung.',
  'error.emptyTranslation': 'Das übersetzte Dokument war leer.',
  'error.unreachable': 'Supertext ist nicht erreichbar: {reason}',
  'error.auth':
    'Authentifizierung fehlgeschlagen. Bitte prüfen Sie den Supertext-API-Schlüssel. Noch kein Supertext-Konto? Erstellen Sie eines auf https://www.supertext.com/person/en/account/signin. Generieren Sie Ihren API-Schlüssel unter https://www.supertext.com/en/integrations/api (erfordert die Admin-Rolle).',
  'error.notFound': 'Die angeforderte Supertext-Ressource wurde nicht gefunden.',
  'error.tooLarge': 'Der Inhalt ist zu gross, um ihn bei Supertext in einem Durchgang zu übersetzen.',
  'error.rateLimited': 'Zu viele Anfragen an Supertext. Bitte versuchen Sie es in Kürze erneut.',
  'error.unavailable': 'Der Supertext-Dienst ist derzeit nicht verfügbar.',
  'error.http': 'Supertext hat mit HTTP {status} geantwortet.',
  'error.languagePair':
    'Supertext übersetzt nicht aus «{source}» in «{target}». Legen Sie den Supertext-Code für diese Sprache unter Einstellungen → Sprachen fest, mit einer Region (z. B. de-CH, fr-FR, en-US).',
  'error.languagePairUnknown':
    'Supertext übersetzt nicht in diese Sprache. Legen Sie den Supertext-Code für diese Sprache unter Einstellungen → Sprachen fest, mit einer Region (z. B. de-CH, fr-FR, en-US).',
  'error.incomplete': 'Supertext hat {received} von {sent} Texten zurückgegeben; für diese Sprache wurde nichts gespeichert.',
  'error.mergeTags':
    'Supertext hat {received} von {sent} Merge-Tags zurückgegeben; für diese Sprache wurde nichts gespeichert.',
  'error.notConnected': 'Mailchimp ist nicht verbunden. Verbinden Sie es erneut.',
  'error.notConfigured':
    'Der App fehlen ihre Mailchimp-Zugangsdaten (MAILCHIMP_CLIENT_ID, MAILCHIMP_CLIENT_SECRET).',
  'error.oauthFailed': 'Mailchimp hat den Zugriff nicht gewährt. Verbinden Sie erneut.',
  'error.mailchimpAuth': 'Mailchimp hat die Verbindung abgelehnt. Verbinden Sie Mailchimp erneut.',
  'error.mailchimpForbidden': 'Mailchimp hat die Anfrage abgelehnt.',
  'error.mailchimpNotFound': 'In Mailchimp nicht gefunden.',
  'error.mailchimpRateLimited': 'Zu viele Anfragen an Mailchimp. Bitte versuchen Sie es in Kürze erneut.',
  'error.mailchimpUnavailable': 'Mailchimp ist derzeit nicht verfügbar. Bitte versuchen Sie es in Kürze erneut.',
  'error.mailchimpHttp': 'Mailchimp hat mit HTTP {status} geantwortet.',
  'error.mailchimpUnreachable': 'Mailchimp ist nicht erreichbar: {reason}',
  'error.campaignMissing': 'Die Kampagne gibt es in Mailchimp nicht mehr.',
  'error.campaignType': 'Nur normale Kampagnen und Nur-Text-Kampagnen können übersetzt werden (diese ist «{type}»).',
  'error.noContent':
    'Mailchimp hat für diese Kampagne keinen Inhalt zurückgegeben. Kampagnen aus dem neuen E-Mail-Builder von Mailchimp lassen sich über die API möglicherweise noch nicht lesen.',
  'error.isTranslation': 'Diese Kampagne ist eine Übersetzung von Supertext. Übersetzen Sie stattdessen ihr Original.',
  'error.sameLanguage': 'Das ist die Sprache der Kampagne selbst.',
  'error.interrupted':
    'Die App wurde während der Übersetzung neu gestartet. Starten Sie sie erneut; fertige Sprachen bleiben erhalten.',
  'error.session': 'Ihre Sitzung ist abgelaufen. Verbinden Sie Mailchimp erneut.',
  'error.select': 'Wählen Sie eine Kampagne und mindestens eine Sprache aus.',
};
