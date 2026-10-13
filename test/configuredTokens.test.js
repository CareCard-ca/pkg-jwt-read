'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('mocha');
const { jwtCreateSignedToken } = require('@carecard/auth-util');
const {
  jwtReadVerifiedToken,
  jwtReadIntrospectedToken,
  jwtGetTokenDeadline,
  jwtReadBearerToken,
  jwtGetClientId,
  jwtGetAgeInSeconds,
  jwtIsExpired,
} = require('..');
const { signingJwk, verificationJwks } = require('./keys/keys');

function token(claims) {
  const now = Math.floor(Date.now() / 1000);
  return jwtCreateSignedToken({ sub: 'subject', iat: now, exp: now + 1200, ...claims }, signingJwk);
}

describe('configured token verification', () => {
  it('rejects malformed requirements before reading a credential', async () => {
    const invalid = [
      null,
      [],
      false,
      { maximumAgeSeconds: 0 },
      { maximumAgeSeconds: -1 },
      { maximumAgeSeconds: 1.5 },
      { maximumAgeSeconds: '60' },
      { issuer: '' },
      { issuer: 42 },
      { subject: ' ' },
      { subject: false },
      { audience: [] },
      { audience: ['ok', 42] },
      { audience: '' },
      { validateClaims: true },
    ];
    for (const requirements of invalid) {
      assert.throws(
        () => jwtReadVerifiedToken('invalid', verificationJwks, requirements),
        TypeError,
      );
    }
    await assert.rejects(() => jwtReadIntrospectedToken('opaque', null), TypeError);
  });
  it('checks canonical timing including missing and malformed claims', async () => {
    for (const payload of [
      undefined,
      {},
      { exp: -1 },
      { exp: 1.5 },
      { exp: 200, iat: -1 },
      { exp: 200, iat: 1.5 },
      { exp: 200, iat: 200 },
      { exp: 200, iat: 201 },
    ]) {
      assert.equal(jwtGetTokenDeadline(payload), null);
    }
    assert.equal(jwtGetTokenDeadline({ exp: 200 }, 10), null);
    assert.equal(jwtGetTokenDeadline({ iat: 0, exp: 200 }, 10), 10);
    for (const claims of [
      null,
      [],
      42,
      {},
      { exp: '9999999999' },
      { exp: 9999999999, nbf: -1 },
      { exp: 9999999999, nbf: 1.5 },
    ]) {
      assert.equal(
        await jwtReadIntrospectedToken('opaque', () => ({ active: true, claims })),
        null,
      );
    }
  });
  it('compares configured identities and audience sets exactly', () => {
    const jwt = token({ iss: 'issuer', aud: ['one', 'two'] });
    assert.equal(
      jwtReadVerifiedToken(jwt, verificationJwks, { audience: ['two', 'three'] }).payload.iss,
      'issuer',
    );
    assert.equal(jwtReadVerifiedToken(jwt, verificationJwks, { issuer: 'other' }), null);
    assert.equal(jwtReadVerifiedToken(jwt, verificationJwks, { subject: 'other' }), null);
    assert.equal(
      jwtReadVerifiedToken(token({ aud: 42 }), verificationJwks, { audience: 'one' }),
      null,
    );
    assert.equal(jwtReadVerifiedToken(token({ nbf: 0 }), verificationJwks).payload.nbf, 0);
  });
  it('propagates introspection failures without trusting unavailable authority', async () => {
    await assert.rejects(
      () =>
        jwtReadIntrospectedToken('opaque', () => {
          throw new Error('unavailable');
        }),
      /unavailable/,
    );
  });
  it('retains generic timing helpers for explicit and bound token objects', () => {
    const now = Math.floor(Date.now() / 1000),
      object = { payload: { sub: 'subject', iat: (now - 10) * 1000 } };
    assert.equal(jwtGetClientId.call(object), 'subject');
    assert.equal(jwtGetAgeInSeconds.call(object), 10);
    assert.equal(object.age, 10);
    assert.equal(jwtIsExpired.call(object, 9), true);
    assert.equal(jwtIsExpired.call(object, 11), false);
    assert.equal(jwtGetAgeInSeconds({ jwt: { payload: {} } }), Infinity);
    assert.equal(jwtIsExpired({ jwt: { payload: {} } }, 0), true);
    assert.equal(jwtIsExpired({ jwt: { payload: {} } }, '9'), true);
  });
  it('exposes standard subject and timing without interpreting custom claims', () => {
    const now = Math.floor(Date.now() / 1000);
    const request = { jwt: { payload: { sub: 'subject', iat: now - 10, exp: now + 30 } } };
    assert.equal(jwtGetClientId(request), 'subject');
    assert.equal(jwtGetAgeInSeconds(request), 10);
    assert.equal(jwtIsExpired(request), false);
    assert.equal(jwtGetClientId({}), undefined);
    assert.equal(jwtIsExpired({}), true);
  });
  it('reads complete bearer credentials without accepting extra words or internal whitespace', () => {
    assert.equal(jwtReadBearerToken('  Bearer opaque-value  '), 'opaque-value');
    assert.equal(jwtReadBearerToken('Bearer\topaque-value'), 'opaque-value');
    for (const header of [
      undefined,
      42,
      'opaque-value',
      'Bearer',
      'Bearer one two',
      'Bearer one\ttwo',
    ]) {
      assert.equal(jwtReadBearerToken(header), null);
    }
  });
  it('preserves custom claims without interpreting names or assigning authority', () => {
    const claims = { roles: { arbitrary: true }, schema: 'opaque', custom: ['value'] };
    const result = jwtReadVerifiedToken(token(claims), verificationJwks);
    assert.deepEqual(result.payload.roles, claims.roles);
    assert.equal(result.payload.schema, 'opaque');
    assert.deepEqual(result.payload.custom, ['value']);
  });

  it('uses the supplied lifetime instead of an application-specific limit', () => {
    const now = Math.floor(Date.now() / 1000);
    const jwt = token({ iat: now - 700 });
    assert.equal(
      jwtReadVerifiedToken(jwt, verificationJwks, { maximumAgeSeconds: 900 }).payload.sub,
      'subject',
    );
    assert.equal(jwtReadVerifiedToken(jwt, verificationJwks, { maximumAgeSeconds: 600 }), null);
    assert.equal(jwtGetTokenDeadline({ iat: 100, exp: 1100 }, 900), 1000);
  });

  it('enforces caller-selected audience, issuer, subject, and custom claim validation', () => {
    const jwt = token({ iss: 'issuer', aud: 'audience', custom: 'allowed' });
    const requirements = {
      issuer: 'issuer',
      audience: 'audience',
      subject: 'subject',
      validateClaims: claims => claims.custom === 'allowed',
    };
    assert.equal(
      jwtReadVerifiedToken(jwt, verificationJwks, requirements).payload.custom,
      'allowed',
    );
    assert.equal(
      jwtReadVerifiedToken(jwt, verificationJwks, { ...requirements, audience: 'other' }),
      null,
    );
    assert.equal(
      jwtReadVerifiedToken(jwt, verificationJwks, { ...requirements, validateClaims: () => false }),
      null,
    );
  });

  it('rejects expired, future-issued, not-yet-valid, and invalidly signed tokens', () => {
    const now = Math.floor(Date.now() / 1000);
    for (const claims of [{ exp: now }, { iat: now + 10 }, { nbf: now + 10 }]) {
      assert.equal(jwtReadVerifiedToken(token(claims), verificationJwks), null);
    }
    assert.equal(jwtReadVerifiedToken(`${token({})}invalid`, verificationJwks), null);
  });

  it('accepts only canonical active introspection results supplied by the caller', async () => {
    const now = Math.floor(Date.now() / 1000);
    const claims = { sub: 'opaque-subject', iat: now, exp: now + 60, custom: { value: true } };
    const result = await jwtReadIntrospectedToken('opaque', async () => ({ active: true, claims }));
    assert.deepEqual(result.payload, claims);
    assert.equal(
      await jwtReadIntrospectedToken('opaque', async () => ({ active: false, claims })),
      null,
    );
    assert.equal(
      await jwtReadIntrospectedToken('opaque', async () => ({ valid: true, userId: 'alias' })),
      null,
    );
  });
});
