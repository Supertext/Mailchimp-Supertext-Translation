import type { Messages } from './en.js';

// French, with "vous" and the terms of Mailchimp's French interface (campagne,
// audience, brouillon, dossier, balises de fusion, ligne d'objet, texte d'aperçu).
// A narrow no-break space ( ) goes before ? ! : ; and inside « ».
export const fr: Messages = {
  'nav.translate': 'Traduire',
  'nav.settings': 'Paramètres',
  'nav.language': 'Langue',

  'apiKeyHelp.text':
    'Pas encore de compte Supertext ? {signup}. Générez votre clé API sous {apiKey} (rôle Admin requis).',
  'apiKeyHelp.signup': 'Créez-en un sur supertext.com',
  'apiKeyHelp.apiKey': 'supertext.com → Integrations → API',

  'connect.heading': 'Supertext Translation pour Mailchimp',
  'connect.intro':
    'Traduisez vos campagnes Mailchimp avec Supertext AI. Chaque langue reçoit son propre brouillon à côté de l’original, envoyé uniquement aux abonnés qui la parlent.',
  'connect.point1': 'Déplacez une campagne dans un dossier Supertext de Mailchimp, ou choisissez-la ici.',
  'connect.point2':
    'La ligne d’objet, le texte d’aperçu et le contenu sont traduits ; la mise en page, les images, les liens et les balises de fusion sont conservés.',
  'connect.point3': 'Vérifiez les brouillons dans Mailchimp et envoyez-les comme d’habitude.',
  'connect.button': 'Connecter Mailchimp',
  'connect.hint':
    'Vous vous connectez à Mailchimp et autorisez Supertext à lire et à créer des campagnes dans votre compte.',
  'connect.denied': 'L’accès à Mailchimp n’a pas été accordé. Connectez-vous à nouveau pour utiliser l’app.',
  'connect.disconnected': 'Mailchimp est déconnecté. Vos paramètres ont été supprimés.',

  'translate.heading': 'Traduire avec Supertext',
  'translate.intro':
    'Faites d’une campagne un brouillon par langue. Les brouillons apparaissent dans Mailchimp à côté de l’original, chacun envoyé uniquement aux abonnés de cette langue.',
  'translate.noKey.heading': 'Ajoutez votre clé API Supertext',
  'translate.noKey.text': 'L’app a besoin d’une clé API Supertext pour traduire. Saisissez-la sous {settings}.',
  'translate.noKey.settings': 'Paramètres',
  'translate.noLanguages.heading': 'Choisissez vos langues',
  'translate.noLanguages.text': 'Choisissez sous {settings} les langues dans lesquelles traduire.',
  'translate.appOff':
    'La traduction depuis l’app est désactivée dans les paramètres. Déplacez plutôt une campagne dans un dossier Supertext de Mailchimp.',
  'translate.folderTip':
    'Vous pouvez aussi commencer dans Mailchimp : déplacez une campagne dans le dossier {folder}.',
  'translate.step1': '1. Choisissez une campagne',
  'translate.campaign': 'Campagne',
  'translate.audience': 'Audience',
  'translate.empty': 'Aucune campagne pour l’instant. Créez-en une dans Mailchimp, puis revenez ici.',
  'translate.previousPage': 'Page précédente',
  'translate.nextPage': 'Page suivante',
  'translate.step2': '2. Choisissez les langues',
  'translate.from': 'Traduction depuis : {language}.',
  'translate.fromAuto': 'Supertext détecte la langue de la campagne.',
  'translate.overwrite': 'Mettre à jour les brouillons existants',
  'translate.overwriteHint': 'Sans cette option, les langues qui ont déjà un brouillon sont conservées.',
  'translate.overwriteWarning':
    'Les brouillons créés auparavant seront remplacés, y compris les modifications faites à la main dans Mailchimp.',
  'translate.submit': 'Traduire avec Supertext',
  'translate.submitCount.one': 'Traduire dans {count} langue avec Supertext',
  'translate.submitCount.other': 'Traduire dans {count} langues avec Supertext',
  'translate.selectSomething': 'Sélectionnez une campagne et au moins une langue.',
  'translate.starting': 'Démarrage…',

  'status.save': 'Brouillon',
  'status.paused': 'En pause',
  'status.schedule': 'Planifiée',
  'status.sending': 'En cours d’envoi',
  'status.sent': 'Envoyée',
  'status.other': 'Autre',

  'state.none': 'Pas de brouillon',
  'state.draft': 'Brouillon',

  'job.heading': 'Traduction',
  'job.running': 'Traduction de « {campaign} » en cours… {completed} sur {total}',
  'job.done': 'Terminé : {created} créés, {updated} mis à jour, {kept} conservés, {failed} en échec.',
  'job.failed': 'La traduction s’est arrêtée : {reason}',
  'job.created': 'Nouveau brouillon',
  'job.updated': 'Brouillon mis à jour',
  'job.kept': 'Brouillon existant, conservé',
  'job.open': 'Ouvrir dans Mailchimp',
  'job.segmentNotCombined':
    'Envoyé à tous les abonnés de cette langue : le segment de l’original n’a pas pu être combiné avec la langue.',
  'job.htmlOnly': 'Enregistré en HTML : modifiez-le avec l’éditeur de code de Mailchimp.',
  'job.originalLimited': 'L’original n’est plus envoyé qu’aux abonnés sans langue traduite.',
  'job.originalNotLimited':
    'L’audience de l’original a été conservée : son segment n’a pas pu être combiné avec les langues.',
  'job.trigger.app': 'Lancée dans l’app',
  'job.trigger.folder': 'Lancée depuis un dossier Supertext',
  'history.heading': 'Traductions récentes',
  'history.empty': 'Aucune traduction pour l’instant.',

  'folder.all': 'Toutes les langues',

  'settings.heading': 'Paramètres Supertext',
  'settings.saved': 'Paramètres enregistrés.',
  'settings.invalidCodes':
    'Enregistré, sauf ces codes de langue, qui ne sont pas des codes valides comme de-CH : {codes}.',
  'settings.foldersFailed':
    'Enregistré, mais les dossiers Supertext n’ont pas pu être mis à jour dans Mailchimp : {reason}',
  'settings.apiKey.heading': 'Clé API Supertext',
  'settings.apiKey.label': 'Clé API',
  'settings.apiKey.placeholder': 'Collez votre clé API Supertext',
  'settings.apiKey.placeholderSaved':
    'Une clé est enregistrée (chiffrée). Saisissez-en une nouvelle pour la remplacer.',
  'settings.apiKey.server': 'Pas encore de clé propre : l’app utilise la clé définie sur le serveur.',
  'settings.apiKey.remove': 'Supprimer la clé enregistrée',
  'settings.test': 'Tester la connexion',
  'settings.testing': 'Test en cours…',
  'settings.testOk': 'Connecté. La clé API fonctionne.',
  'settings.languages.heading': 'Langues',
  'settings.languages.text':
    'Mailchimp connaît la langue de chaque abonné (détectée depuis son navigateur ou définie dans votre audience). Chaque traduction est envoyée aux abonnés de cette langue.',
  'settings.languages.source': 'Langue de vos campagnes',
  'settings.languages.auto': 'Laisser Supertext la détecter',
  'settings.languages.targets': 'Traduire en',
  'settings.languages.code': 'Code Supertext',
  'settings.languages.codeHint':
    'Supertext a besoin d’une région, par exemple de-CH pour l’allemand de Suisse ou fr-FR pour le français de France.',
  'settings.start.heading': 'Lancer les traductions depuis',
  'settings.start.folders': 'Les dossiers Mailchimp',
  'settings.start.foldersHint':
    'Déplacez une campagne dans un dossier Supertext de Mailchimp, par exemple {folder}. Les brouillons apparaissent une ou deux minutes plus tard, et l’original retourne dans son dossier.',
  'settings.start.foldersWarning':
    'Déplacer à nouveau une campagne dans un dossier Supertext remplace ses brouillons, y compris les modifications faites à la main.',
  'settings.start.app': 'L’app Supertext',
  'settings.start.appHint': 'Choisissez une campagne et les langues sur la page « Traduire » de cette app.',
  'settings.start.none': 'Il faut au moins un moyen, l’app Supertext reste donc activée.',
  'settings.audience.heading': 'Audience',
  'settings.audience.limit': 'N’envoyer l’original qu’aux abonnés sans langue traduite',
  'settings.audience.limitHint':
    'Désactivé : l’original garde son audience, les abonnés d’une langue traduite reçoivent donc les deux versions.',
  'settings.style.heading': 'Traduction',
  'settings.style.label': 'Forme d’adresse',
  'settings.style.default': 'Laisser Supertext décider',
  'settings.style.more': 'Formelle (p. ex. « vous »)',
  'settings.style.less': 'Informelle (p. ex. « tu »)',
  'settings.save': 'Enregistrer',
  'settings.connection.heading': 'Mailchimp',
  'settings.connection.account': 'Connecté au compte Mailchimp {account}.',
  'settings.connection.disconnect': 'Déconnecter Mailchimp',
  'settings.connection.disconnectHint':
    'Supprime vos paramètres et les dossiers Supertext vides. Les brouillons déjà créés restent dans Mailchimp.',
  'settings.connection.confirm': 'Déconnecter Mailchimp de Supertext ? Vos paramètres seront supprimés.',
  'settings.about.heading': 'À propos',
  'settings.about.version': 'Supertext Translation pour Mailchimp, version {version}',

  'error.noApiKey':
    'Aucune clé API Supertext n’est configurée. Ajoutez-la dans les paramètres. Pas encore de compte Supertext ? Créez-en un sur https://www.supertext.com/person/en/account/signin. Générez votre clé API sous https://www.supertext.com/en/integrations/api (rôle Admin requis).',
  'error.noFileId': 'Supertext n’a pas renvoyé d’identifiant de fichier.',
  'error.translationFailed': 'Supertext n’a pas pu traduire le document.',
  'error.limitExceeded': 'Votre limite de traduction Supertext est dépassée.',
  'error.fileDeleted': 'Le fichier Supertext a été supprimé avant d’avoir pu être téléchargé.',
  'error.timeout': 'Délai dépassé en attendant la traduction Supertext.',
  'error.emptyTranslation': 'Le document traduit était vide.',
  'error.unreachable': 'Impossible de joindre Supertext : {reason}',
  'error.auth':
    'L’authentification a échoué. Veuillez vérifier la clé API Supertext. Pas encore de compte Supertext ? Créez-en un sur https://www.supertext.com/person/en/account/signin. Générez votre clé API sous https://www.supertext.com/en/integrations/api (rôle Admin requis).',
  'error.notFound': 'La ressource Supertext demandée est introuvable.',
  'error.tooLarge': 'Le contenu est trop volumineux pour être traduit par Supertext en une seule fois.',
  'error.rateLimited': 'Trop de requêtes vers Supertext. Veuillez réessayer dans un instant.',
  'error.unavailable': 'Le service Supertext est actuellement indisponible.',
  'error.http': 'Supertext a répondu avec le code HTTP {status}.',
  'error.languagePair':
    'Supertext ne traduit pas de « {source} » vers « {target} ». Définissez le code Supertext de cette langue sous Paramètres → Langues, avec une région (p. ex. de-CH, fr-FR, en-US).',
  'error.languagePairUnknown':
    'Supertext ne traduit pas dans cette langue. Définissez le code Supertext de cette langue sous Paramètres → Langues, avec une région (p. ex. de-CH, fr-FR, en-US).',
  'error.incomplete':
    'Supertext a renvoyé {received} textes sur {sent} ; rien n’a été enregistré pour cette langue.',
  'error.mergeTags':
    'Supertext a renvoyé {received} balises de fusion sur {sent} ; rien n’a été enregistré pour cette langue.',
  'error.notConnected': 'Mailchimp n’est pas connecté. Connectez-le à nouveau.',
  'error.notConfigured':
    'Il manque à l’app ses identifiants Mailchimp (MAILCHIMP_CLIENT_ID, MAILCHIMP_CLIENT_SECRET).',
  'error.oauthFailed': 'Mailchimp n’a pas accordé l’accès. Connectez-vous à nouveau.',
  'error.mailchimpAuth': 'Mailchimp a refusé la connexion. Connectez Mailchimp à nouveau.',
  'error.mailchimpForbidden': 'Mailchimp a refusé la requête.',
  'error.mailchimpNotFound': 'Introuvable dans Mailchimp.',
  'error.mailchimpRateLimited': 'Trop de requêtes vers Mailchimp. Veuillez réessayer dans un instant.',
  'error.mailchimpUnavailable': 'Mailchimp est actuellement indisponible. Veuillez réessayer dans un instant.',
  'error.mailchimpHttp': 'Mailchimp a répondu avec le code HTTP {status}.',
  'error.mailchimpUnreachable': 'Impossible de joindre Mailchimp : {reason}',
  'error.campaignMissing': 'La campagne n’existe plus dans Mailchimp.',
  'error.campaignType':
    'Seules les campagnes normales et en texte brut peuvent être traduites (celle-ci est « {type} »).',
  'error.noContent':
    'Mailchimp n’a renvoyé aucun contenu pour cette campagne. Les campagnes créées avec le nouveau générateur d’e-mails de Mailchimp ne sont peut-être pas encore lisibles via l’API.',
  'error.isTranslation': 'Cette campagne est une traduction créée par Supertext. Traduisez plutôt son original.',
  'error.sameLanguage': 'C’est la langue de la campagne elle-même.',
  'error.interrupted':
    'L’app a redémarré pendant la traduction. Relancez-la ; les langues terminées sont conservées.',
  'error.session': 'Votre session a expiré. Connectez Mailchimp à nouveau.',
  'error.select': 'Sélectionnez une campagne et au moins une langue.',
};
