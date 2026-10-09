import { describe, expect, it } from 'vitest';
import { Sessions } from '../src/auth/session.js';

describe('Sessions', () => {
  const sessions = new Sessions('secret');

  it('reads back what it signed', () => {
    const cookie = sessions.create('48210377');
    expect(sessions.read(cookie)?.accountId).toBe('48210377');
  });

  it('refuses forged, foreign and expired cookies', () => {
    const cookie = sessions.create('48210377');
    const [data] = cookie.split('.');
    const forged = Buffer.from(JSON.stringify({ accountId: 'other', expires: 9e9 })).toString('base64url');
    expect(sessions.read(`${forged}.${cookie.split('.')[1]}`)).toBeUndefined();
    expect(new Sessions('other secret').read(cookie)).toBeUndefined();
    expect(sessions.read(`${data}.x`)).toBeUndefined();
    expect(sessions.read(sessions.create('1', Date.now() - 40 * 86400_000))).toBeUndefined();
  });

  it('ties CSRF tokens and OAuth states to their cookie', () => {
    const cookie = sessions.create('1');
    expect(sessions.checkCsrf(cookie, sessions.csrf(cookie))).toBe(true);
    expect(sessions.checkCsrf(cookie, sessions.csrf(sessions.create('2')))).toBe(false);
    const { state, cookie: stateCookie } = sessions.state();
    expect(sessions.checkState(stateCookie, state)).toBe(true);
    expect(sessions.checkState(stateCookie, 'other')).toBe(false);
  });
});
