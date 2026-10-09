/** Settings from environment variables (Railway variables in production). */
export interface Config {
  port: number;
  /** Public HTTPS URL of this app; the OAuth redirect URI is APP_URL/oauth/callback. */
  appUrl: string;
  /** From Mailchimp → Profile → Extras → Registered apps. */
  mailchimpClientId: string;
  mailchimpClientSecret: string;
  /** Mailchimp's OAuth host. Points at a stand-in in tests and for screenshots. */
  mailchimpLoginBase: string;
  /** Overrides the API endpoint Mailchimp's metadata returns (stand-ins only). */
  mailchimpApiBase: string;
  /** Signs session cookies; falls back to a key derived from the client secret. */
  sessionSecret: string;
  /** Default Supertext API key for accounts that haven't entered their own (the demo account). */
  supertextApiKey: string;
  supertextEndpoint: string;
  databaseUrl: string;
  /** Key for encrypting stored tokens and API keys; falls back to a key derived from the client secret. */
  encryptionKey: string;
  /** How often the Supertext folders are checked, in seconds (0 = never: tests). */
  pollSeconds: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const poll = Number(env.FOLDER_POLL_SECONDS);
  return {
    port: Number(env.PORT) || 8080,
    appUrl: (env.APP_URL || `http://127.0.0.1:${Number(env.PORT) || 8080}`).replace(/\/+$/, ''),
    mailchimpClientId: env.MAILCHIMP_CLIENT_ID ?? '',
    mailchimpClientSecret: env.MAILCHIMP_CLIENT_SECRET ?? '',
    mailchimpLoginBase: (env.MAILCHIMP_LOGIN_BASE || 'https://login.mailchimp.com').replace(/\/+$/, ''),
    mailchimpApiBase: (env.MAILCHIMP_API_BASE ?? '').replace(/\/+$/, ''),
    sessionSecret: env.SESSION_SECRET ?? '',
    supertextApiKey: env.SUPERTEXT_API_KEY ?? '',
    supertextEndpoint: env.SUPERTEXT_API_ENDPOINT ?? '',
    databaseUrl: env.DATABASE_URL ?? '',
    encryptionKey: env.APP_ENCRYPTION_KEY ?? '',
    pollSeconds: Number.isFinite(poll) && env.FOLDER_POLL_SECONDS !== undefined && env.FOLDER_POLL_SECONDS !== '' ? Math.max(0, poll) : 60,
  };
}
