'use strict';

const assert = require('node:assert').strict;
const { describe, it } = require('mocha');
const {
  jwtCreateSignedToken,
  parseJwtSigningJwk,
  parseJwtVerificationJwks,
} = require('@carecard/auth-util');
const {
  jwtHasApplicationAudience,
  jwtReadApplicationToken,
  jwtValidateAndExtractApplication,
  jwtValidateAndExtractApplicationOrServerAuth,
  jwtVerifyApplication,
  jwtVerifyApplicationOrServerAuth,
  jwtVerifyApplicationOrServerAuthAndHasRole,
  jwtGetApplicationContext,
} = require('..');
const { signingJwk, verificationJwks, createJwkIdentity } = require('./keys/keys');

function createToken(claims = {}, key = signingJwk) {
  const now = Math.floor(Date.now() / 1000);
  return jwtCreateSignedToken(
    { sub: 'account-one', aud: 'product-one', iat: now, exp: now + 60, ...claims },
    key,
  );
}

function createRequest(token) {
  return {
    get(name) {
      return name.toLowerCase() === 'authorization' ? `Bearer ${token}` : undefined;
    },
  };
}

function createSessionClaims(claims = {}) {
  return {
    valid: true,
    userId: 'account-one',
    aud: 'product-one',
    roles: ['ad'],
    email_verified: false,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    ...claims,
  };
}

function runMiddleware(middleware, request) {
  return new Promise(resolve => middleware(request, {}, resolve));
}

describe('application audience isolation', function () {
  it('checks audience independently for callers that already enforce signature and lifetime', function () {
    assert.equal(
      jwtHasApplicationAudience({ aud: 'configured-application' }, 'configured-application'),
      true,
    );
    for (const payload of [
      null,
      {},
      { aud: ['configured-application'] },
      { aud: 'another-application' },
    ]) {
      assert.equal(jwtHasApplicationAudience(payload, 'configured-application'), false);
    }
    assert.throws(() => jwtHasApplicationAudience({ aud: '' }, ''), TypeError);
  });
  it('accepts any configured single audience through the raw-token boundary', function () {
    for (const audience of ['product-one', 'product-two', 'another-application']) {
      const token = createToken({ aud: audience });
      const credential = jwtReadApplicationToken(token, verificationJwks, audience);
      assert.equal(credential.payload.aud, audience);
      assert.equal(credential.jwtClientId(), 'account-one');
    }
  });

  it('rejects missing, foreign, multiple, empty, and non-string audiences', function () {
    for (const aud of [undefined, 'product-two', ['product-one'], '', 42, null]) {
      assert.equal(
        jwtReadApplicationToken(createToken({ aud }), verificationJwks, 'product-one'),
        null,
      );
    }
  });

  it('requires a configured expected audience without a default', function () {
    for (const audience of [undefined, null, '', ' ', ['product-one']]) {
      assert.throws(
        () => jwtReadApplicationToken(createToken(), verificationJwks, audience),
        TypeError,
      );
    }
  });

  it('retains signature, subject, expiration, and not-before checks', function () {
    const now = Math.floor(Date.now() / 1000);
    const foreignKey = parseJwtSigningJwk(JSON.stringify(createJwkIdentity().signing));
    const tokens = [
      'invalid.token.value',
      createToken({}, foreignKey),
      createToken({ sub: '' }),
      createToken({ exp: now - 1 }),
      createToken({ nbf: now + 60 }),
      createToken({ iat: now + 60, exp: now + 120 }),
    ];
    for (const token of tokens) {
      assert.equal(jwtReadApplicationToken(token, verificationJwks, 'product-one'), null);
    }
  });

  it('accepts retained signing keys without accepting another audience', function () {
    const active = createJwkIdentity();
    const retained = createJwkIdentity();
    const retainedSigner = parseJwtSigningJwk(JSON.stringify(retained.signing));
    const keys = parseJwtVerificationJwks(
      JSON.stringify({ keys: [active.verification, retained.verification] }),
    );
    const token = createToken({}, retainedSigner);
    assert.equal(jwtReadApplicationToken(token, keys, 'product-one').payload.sub, 'account-one');
    assert.equal(jwtReadApplicationToken(token, keys, 'product-two'), null);
    const retired = parseJwtVerificationJwks(JSON.stringify({ keys: [active.verification] }));
    assert.equal(jwtReadApplicationToken(token, retired, 'product-one'), null);
  });

  it('attaches audience and preserves account authorization context', function () {
    const req = createRequest(createToken({ roles: ['ad'], email_verified: false }));
    jwtValidateAndExtractApplication(req, verificationJwks, 'product-one');
    assert.equal(req.jwt.payload.email_verified, false);
    assert.deepEqual(jwtGetApplicationContext(req), {
      user_id: 'account-one',
      role: 'super_admin',
      application_namespace: 'product-one',
    });
  });

  it('clears stale authentication when the audience is rejected', function () {
    const req = createRequest(createToken({ aud: 'product-two' }));
    req.jwt = { payload: { sub: 'previous-account', aud: 'product-one' } };
    assert.throws(() => jwtValidateAndExtractApplication(req, verificationJwks, 'product-one'));
    assert.equal(req.jwt, null);
    assert.throws(() => jwtGetApplicationContext(req));
  });

  it('preserves the audience and verification claims of an opaque session', async function () {
    const req = createRequest('opaque-session');
    await jwtValidateAndExtractApplicationOrServerAuth(req, verificationJwks, 'product-one', () =>
      createSessionClaims(),
    );
    assert.equal(req.jwt.payload.aud, 'product-one');
    assert.equal(req.jwt.payload.authMode, 'server-auth');
    assert.equal(req.jwt.payload.email_verified, false);
    assert.equal(jwtGetApplicationContext(req).application_namespace, 'product-one');
  });

  it('rejects opaque sessions with foreign or missing audiences and expired sessions', async function () {
    const invalidClaims = [
      { aud: 'product-two' },
      { aud: undefined },
      { aud: ['product-one'] },
      { expiresAt: new Date(Date.now() - 60_000).toISOString() },
      { valid: false },
    ];
    for (const claims of invalidClaims) {
      const req = createRequest('opaque-session');
      await assert.rejects(() =>
        jwtValidateAndExtractApplicationOrServerAuth(req, verificationJwks, 'product-one', () =>
          createSessionClaims(claims),
        ),
      );
      assert.equal(req.jwt, null);
    }
  });

  it('cannot turn a rejected JWT into an accepted opaque session', async function () {
    for (const token of [createToken({ aud: 'product-two' }), 'invalid.token.value']) {
      const req = createRequest(token);
      await assert.rejects(() =>
        jwtValidateAndExtractApplicationOrServerAuth(req, verificationJwks, 'product-one', () =>
          createSessionClaims(),
        ),
      );
      assert.equal(req.jwt, null);
    }
  });

  it('applies audience checks through JWT and opaque middleware', async function () {
    const middleware = jwtVerifyApplication(verificationJwks, 'product-one');
    assert.equal(await runMiddleware(middleware, createRequest(createToken())), undefined);
    assert.ok(
      (await runMiddleware(
        middleware,
        createRequest(createToken({ aud: 'product-two' })),
      )) instanceof Error,
    );
    const opaque = jwtVerifyApplicationOrServerAuth(verificationJwks, 'product-one', () =>
      createSessionClaims(),
    );
    assert.equal(await runMiddleware(opaque, createRequest('opaque-session')), undefined);
  });

  it('requires both the application audience and the requested role', async function () {
    const middleware = jwtVerifyApplicationOrServerAuthAndHasRole(
      'ad',
      verificationJwks,
      'product-one',
      () => createSessionClaims(),
    );
    assert.equal(
      await runMiddleware(middleware, createRequest(createToken({ roles: ['ad'] }))),
      undefined,
    );
    assert.ok(
      (await runMiddleware(middleware, createRequest(createToken({ roles: ['user'] })))) instanceof
        Error,
    );
    assert.ok(
      (await runMiddleware(
        middleware,
        createRequest(createToken({ roles: ['ad'], aud: 'product-two' })),
      )) instanceof Error,
    );
  });
});
