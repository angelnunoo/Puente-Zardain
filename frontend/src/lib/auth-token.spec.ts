import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeJwtPayload,
  isJwtExpired,
  nextSessionTokens,
  refreshTokenRequestBody,
} from './auth-token.ts';

function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

describe('auth-token', () => {
  it('decodes base64url JWT payloads that would throw in atob()', () => {
    const token = makeJwt({
      sub: 'user_??',
      email: 'plus+slash/@example.com',
      role: 'ADMIN',
      exp: 1_900_000_000,
    });
    const payloadSegment = token.split('.')[1];
    assert.match(payloadSegment, /[-_]/);
    assert.throws(() => atob(payloadSegment));
    assert.equal(decodeJwtPayload(token).email, 'plus+slash/@example.com');
    assert.equal(isJwtExpired(token, 1_800_000_000), false);
  });

  it('treats missing, malformed, or expired tokens as expired', () => {
    assert.equal(isJwtExpired('not-a-jwt'), true);
    assert.equal(isJwtExpired(makeJwt({ sub: 'x' })), true);
    assert.equal(isJwtExpired(makeJwt({ exp: 100 }), 101), true);
    assert.equal(isJwtExpired(makeJwt({ exp: 200 }), 199), false);
  });

  it('sends the DTO field name expected by POST /auth/refresh', () => {
    assert.deepEqual(refreshTokenRequestBody('abc'), { refreshToken: 'abc' });
  });

  it('keeps the current refresh token when the server only returns an access token', () => {
    assert.deepEqual(nextSessionTokens({ access_token: 'new-access' }, 'existing-refresh'), {
      accessToken: 'new-access',
      refreshToken: 'existing-refresh',
    });
    assert.equal(nextSessionTokens({}, 'existing-refresh'), null);
  });
});

describe('legacy AuthContext expiry helper', () => {
  it('throws when a local isTokenExpired const shadows the helper (the production crash)', () => {
    const helper = (token: string) => token === 'expired';

    const brokenFactory = (token: string | null) => {
      const isTokenExpired = (() => {
        if (!token) return true;
        return isTokenExpired(token);
      })();
      return isTokenExpired;
    };

    assert.equal(brokenFactory(null), true);
    assert.throws(() => brokenFactory('valid-token'), /before initialization|is not a function|isTokenExpired/);
    assert.equal(helper('expired'), true);
  });
});
