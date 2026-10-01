'use strict';

const assert = require('node:assert/strict');
const { beforeEach, afterEach, describe, it } = require('mocha');
const { jwtCreateSignedToken } = require('@carecard/auth-util');
const {
  jwtIsAccessTokenExpired,
  jwtGetAccessTokenDeadline,
  jwtReadApplicationToken,
  jwtValidateAndExtractApplicationOrServerAuth,
} = require('..');
const { signingJwk, verificationJwks } = require('./keys/keys');

describe('application access credential lifetime', function () {
  const issuedAt = 1800000000;
  let originalNow;

  beforeEach(function () {
    originalNow = Date.now;
    Date.now = () => issuedAt * 1000;
  });

  afterEach(function () {
    Date.now = originalNow;
  });

  // Pattern: Test Builder - supplies an independently signed application credential.
  function createToken(claims = {}) {
    return jwtCreateSignedToken(
      {
        sub: 'account-one',
        aud: 'carecard',
        sid: 'session-one',
        iat: issuedAt,
        exp: issuedAt + 60000,
        ...claims,
      },
      signingJwk,
    );
  }

  it('caps an older long-expiration JWT at 600 seconds including the exact boundary', function () {
    const token = createToken();
    Date.now = () => (issuedAt + 600) * 1000 - 1;
    assert.ok(jwtReadApplicationToken(token, verificationJwks, 'carecard'));
    Date.now = () => (issuedAt + 600) * 1000;
    assert.equal(jwtReadApplicationToken(token, verificationJwks, 'carecard'), null);
    Date.now = () => (issuedAt + 601) * 1000;
    assert.equal(jwtReadApplicationToken(token, verificationJwks, 'carecard'), null);
  });

  it('uses an earlier exp without adding clock-skew grace', function () {
    const request = { jwt: { payload: { iat: issuedAt, exp: issuedAt + 60 } } };
    Date.now = () => (issuedAt + 60) * 1000 - 1;
    assert.equal(jwtIsAccessTokenExpired(request), false);
    Date.now = () => (issuedAt + 60) * 1000;
    assert.equal(jwtIsAccessTokenExpired(request), true);
    assert.equal(jwtGetAccessTokenDeadline(request.jwt.payload), issuedAt + 60);
  });

  it('rechecks time when a previously validated request object is reused', function () {
    const credential = jwtReadApplicationToken(createToken(), verificationJwks, 'carecard');
    const request = { jwt: credential };
    assert.equal(jwtIsAccessTokenExpired(request), false);
    Date.now = () => (issuedAt + 600) * 1000;
    assert.equal(jwtIsAccessTokenExpired(request), true);
  });

  it('preserves source session identity and original access age for opaque credentials', async function () {
    const request = { get: () => 'Bearer opaque-access-credential' };
    await jwtValidateAndExtractApplicationOrServerAuth(
      request,
      verificationJwks,
      'carecard',
      () => ({
        valid: true,
        sub: 'account-one',
        aud: 'carecard',
        sid: 'session-one',
        sessionId: 'session-one',
        iat: issuedAt,
        exp: issuedAt + 600,
      }),
    );
    assert.equal(request.jwt.payload.sid, 'session-one');
    assert.equal(request.jwt.payload.iat, issuedAt);
    Date.now = () => (issuedAt + 600) * 1000;
    assert.equal(jwtIsAccessTokenExpired(request), true);
  });

  it('rejects missing, malformed, millisecond, and future timing claims', function () {
    for (const payload of [
      {},
      { iat: issuedAt },
      { exp: issuedAt + 600 },
      { iat: String(issuedAt), exp: issuedAt + 600 },
      { iat: issuedAt, exp: String(issuedAt + 600) },
      { iat: issuedAt * 1000, exp: (issuedAt + 600) * 1000 },
      { iat: issuedAt + 1, exp: issuedAt + 600 },
      { iat: issuedAt, exp: issuedAt },
    ]) {
      assert.equal(jwtIsAccessTokenExpired({ jwt: { payload } }), true);
    }
  });

  it('denies an opaque access credential that reaches its 600-second age during introspection', async function () {
    const request = { get: () => 'Bearer opaque-access-credential' };
    await assert.rejects(
      jwtValidateAndExtractApplicationOrServerAuth(
        request,
        verificationJwks,
        'carecard',
        async () => {
          Date.now = () => (issuedAt + 600) * 1000;
          return {
            valid: true,
            sub: 'account-one',
            aud: 'carecard',
            iat: issuedAt,
            expiresAt: new Date((issuedAt + 60000) * 1000).toISOString(),
          };
        },
      ),
    );
    assert.equal(request.jwt, null);
  });
});
