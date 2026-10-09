import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Sessions are signed cookies (HMAC-SHA256): the Mailchimp account a browser
 * connected, and when the session ends. Nothing secret is in the cookie;
 * the token stays in the database. Forms and API calls also carry a CSRF
 * token derived from the session.
 */

export const SESSION_COOKIE = 'st_session';
export const STATE_COOKIE = 'st_oauth_state';
const SESSION_DAYS = 30;

export interface Session {
  accountId: string;
  /** Unix seconds. */
  expires: number;
}

export class Sessions {
  private readonly key: Buffer;

  constructor(secret: string) {
    if (!secret) throw new Error('SESSION_SECRET or MAILCHIMP_CLIENT_SECRET is required.');
    this.key = createHash('sha256').update(`supertext-mailchimp-session:${secret}`).digest();
  }

  private sign(data: string): string {
    return createHmac('sha256', this.key).update(data).digest('base64url');
  }

  private verify(value: string | undefined): string | undefined {
    if (!value) return undefined;
    const dot = value.lastIndexOf('.');
    if (dot < 1) return undefined;
    const data = value.slice(0, dot);
    const given = Buffer.from(value.slice(dot + 1));
    const expected = Buffer.from(this.sign(data));
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return undefined;
    return data;
  }

  create(accountId: string, now = Date.now()): string {
    const session: Session = { accountId, expires: Math.floor(now / 1000) + SESSION_DAYS * 86400 };
    const data = Buffer.from(JSON.stringify(session)).toString('base64url');
    return `${data}.${this.sign(data)}`;
  }

  read(cookie: string | undefined, now = Date.now()): Session | undefined {
    const data = this.verify(cookie);
    if (!data) return undefined;
    try {
      const session = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as Session;
      if (!session.accountId || session.expires * 1000 < now) return undefined;
      return session;
    } catch {
      return undefined;
    }
  }

  /** The CSRF token for a session cookie. */
  csrf(cookie: string): string {
    return this.sign(`csrf:${cookie}`).slice(0, 32);
  }

  checkCsrf(cookie: string | undefined, token: string | undefined): boolean {
    if (!cookie || !token) return false;
    const expected = Buffer.from(this.csrf(cookie));
    const given = Buffer.from(token);
    return expected.length === given.length && timingSafeEqual(expected, given);
  }

  /** A random OAuth state and its signed cookie value. */
  state(): { state: string; cookie: string } {
    const state = randomBytes(18).toString('base64url');
    return { state, cookie: `${state}.${this.sign(`state:${state}`)}` };
  }

  checkState(cookie: string | undefined, state: string | undefined): boolean {
    if (!cookie || !state) return false;
    const [value, signature] = cookie.split('.');
    if (value !== state || !signature) return false;
    const expected = Buffer.from(this.sign(`state:${state}`));
    const given = Buffer.from(signature);
    return expected.length === given.length && timingSafeEqual(expected, given);
  }
}
