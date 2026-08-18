'use strict';

const assert = require('assert').strict;
const { describe, it } = require('mocha');
const { jwtCreateSignedToken } = require('@carecard/auth-util');
const {
  DEFAULT_USER_AUTHORIZATION_HEADER_NAME,
  DEFAULT_USER_AUTHORIZATION_MAX_TOKEN_LENGTH,
  doesJwtUserHasRole,
  jwtGetAgeInSeconds,
  jwtGetClientId,
  jwtGetVisitorClientId,
  jwtIsExpired,
  jwtValidateAndExtract,
  jwtValidateAndExtractNoThrow,
  jwtValidateAndExtractOrServerAuth,
  jwtValidateAndExtractService,
  jwtValidateAndExtractUserAuthorization,
  jwtValidateAndExtractUserAuthorizationNoThrow,
  jwtValidateAndExtractVisitorNoThrow,
  jwtValidateAndExtractWebToken,
  jwtValidateAndExtractWebTokenNoThrow,
  jwtVerify,
  jwtVerifyAndHasRole,
  jwtVerifyNoThrow,
  jwtVerifyOrServerAuth,
  jwtVerifyOrServerAuthAndHasRole,
  jwtVerifyService,
  jwtVerifyUserAuthorization,
  jwtVerifyUserAuthorizationNoThrow,
  jwtVerifyVisitorNoThrow,
  jwtVerifyWebToken,
  jwtVerifyWebTokenNoThrow,
  throwUsedTokenError,
} = require('../index');
const { privateKey, publicKey } = require('./keys/keys');

const USER_ID = '8b0db877-a6b3-4a23-a493-e687915cdd87';
const AUTHORIZATION_SUBJECT = '6f4cb7f4-2c2a-4a91-9b56-3e5389703d42';

describe('@carecard/jwt-read public behavior', function () {
  it('extracts authenticated bearer context through canonical utilities', function () {
    const request = createRequest({ Authorization: `Bearer ${createUserToken()}` });

    jwtValidateAndExtract(request, publicKey);

    assert.strictEqual(jwtGetClientId(request), USER_ID);
    assert.strictEqual(doesJwtUserHasRole(request, 'admin'), true);
    assert.strictEqual(jwtIsExpired(request), false);
    assert.ok(jwtGetAgeInSeconds(request) >= 0);
  });

  it('fails closed for invalid required and optional bearer authentication', function () {
    const invalidToken = corruptToken(createUserToken());
    const requiredRequest = createRequest({ Authorization: `Bearer ${invalidToken}` });
    requiredRequest.jwt = { payload: { sub: 'stale-user' } };

    assert.throws(() => jwtValidateAndExtract(requiredRequest, publicKey));
    assert.strictEqual(requiredRequest.jwt, null);

    const optionalRequest = createRequest({ Authorization: `Bearer ${invalidToken}` });
    jwtValidateAndExtractNoThrow(optionalRequest, publicKey);
    assert.strictEqual(optionalRequest.jwt, null);
  });

  it('handles custom-header and visitor tokens through canonical utilities', function () {
    const webRequest = createRequest({ 'X-Token': createUserToken() });
    jwtValidateAndExtractWebToken(webRequest, publicKey, 'X-Token');
    assert.strictEqual(jwtGetClientId(webRequest), USER_ID);

    const invalidWebRequest = createRequest({ 'X-Token': corruptToken(createUserToken()) });
    jwtValidateAndExtractWebTokenNoThrow(invalidWebRequest, publicKey, 'X-Token');
    assert.strictEqual(invalidWebRequest.jwt, null);

    const visitorRequest = createRequest({
      Visitor: `Bearer ${createSignedToken({ sub: USER_ID })}`,
    });
    jwtValidateAndExtractVisitorNoThrow(visitorRequest, publicKey);
    assert.strictEqual(jwtGetVisitorClientId(visitorRequest), USER_ID);
  });

  it('reports required middleware errors while optional middleware continues', async function () {
    const bearerRequest = createRequest({ Authorization: `Bearer ${createUserToken()}` });
    await expectMiddlewareSuccess(jwtVerify(publicKey), bearerRequest);

    const webRequest = createRequest({ 'X-Token': createUserToken() });
    await expectMiddlewareSuccess(jwtVerifyWebToken(publicKey, 'X-Token'), webRequest);

    const visitorRequest = createRequest({
      Visitor: `Bearer ${createSignedToken({ sub: USER_ID })}`,
    });
    await expectMiddlewareSuccess(jwtVerifyVisitorNoThrow(publicKey), visitorRequest);

    const invalidToken = corruptToken(createUserToken());
    const requiredError = await captureMiddlewareError(
      jwtVerify(publicKey),
      createRequest({ Authorization: `Bearer ${invalidToken}` }),
    );
    assert.ok(requiredError instanceof Error);

    await expectMiddlewareSuccess(
      jwtVerifyNoThrow(publicKey),
      createRequest({ Authorization: `Bearer ${invalidToken}` }),
    );
    await expectMiddlewareSuccess(
      jwtVerifyWebTokenNoThrow(publicKey, 'X-Token'),
      createRequest({ 'X-Token': invalidToken }),
    );
  });

  it('enforces requested roles through bearer middleware', async function () {
    await expectMiddlewareSuccess(
      jwtVerifyAndHasRole('admin', publicKey),
      createRequest({ Authorization: `Bearer ${createUserToken()}` }),
    );

    const deniedError = await captureMiddlewareError(
      jwtVerifyAndHasRole('reviewer', publicKey),
      createRequest({ Authorization: `Bearer ${createUserToken()}` }),
    );
    assert.ok(deniedError instanceof Error);
  });

  it('validates scoped authorization through direct and middleware boundaries', async function () {
    const token = createUserAuthorizationToken();
    const options = {
      expectedAudience: 'ms-documents',
      expectedIssuer: 'ms-institutions',
      expectedType: 'carecard.authorization-context.scoped.v1',
    };
    const directRequest = createRequest({ [DEFAULT_USER_AUTHORIZATION_HEADER_NAME]: token });

    jwtValidateAndExtractUserAuthorization(directRequest, publicKey, undefined, options);

    assert.strictEqual(directRequest.userAuthorization.payload.sub, AUTHORIZATION_SUBJECT);
    assert.strictEqual(directRequest.userAuthorization.payload.table, 'documents');

    const middlewareRequest = createRequest({ [DEFAULT_USER_AUTHORIZATION_HEADER_NAME]: token });
    await expectMiddlewareSuccess(
      jwtVerifyUserAuthorization(publicKey, undefined, options),
      middlewareRequest,
    );

    const invalidToken = corruptToken(token);
    const optionalRequest = createRequest({
      [DEFAULT_USER_AUTHORIZATION_HEADER_NAME]: invalidToken,
    });
    jwtValidateAndExtractUserAuthorizationNoThrow(optionalRequest, publicKey);
    assert.strictEqual(optionalRequest.userAuthorization, null);
    await expectMiddlewareSuccess(jwtVerifyUserAuthorizationNoThrow(publicKey), optionalRequest);
  });

  it('accepts only service tokens matching the expected issuer and audience', async function () {
    const token = createServiceToken('ms-institutions', 'ms-auth');
    const directRequest = createRequest({ Authorization: `Bearer ${token}` });

    jwtValidateAndExtractService(directRequest, publicKey, 'ms-institutions', 'ms-auth');
    assert.strictEqual(directRequest.jwt.payload.iss, 'ms-institutions');
    assert.strictEqual(directRequest.jwt.payload.aud, 'ms-auth');

    await expectMiddlewareSuccess(
      jwtVerifyService(publicKey, 'ms-institutions', 'ms-auth'),
      createRequest({ Authorization: `Bearer ${token}` }),
    );

    const wrongIssuerRequest = createRequest({
      Authorization: `Bearer ${createServiceToken('ms-search', 'ms-auth')}`,
    });
    assert.throws(() =>
      jwtValidateAndExtractService(wrongIssuerRequest, publicKey, 'ms-institutions', 'ms-auth'),
    );
    assert.strictEqual(wrongIssuerRequest.jwt, null);
  });

  it('normalizes opaque server authentication through direct and middleware boundaries', async function () {
    const introspector = async token => {
      assert.strictEqual(token, 'opaque-server-token');
      return { email_verified: true, roles: ['admin'], userId: USER_ID, valid: true };
    };
    const directRequest = createRequest({ Authorization: 'Bearer opaque-server-token' });

    await jwtValidateAndExtractOrServerAuth(directRequest, publicKey, introspector);

    assert.strictEqual(directRequest.jwt.payload.sub, USER_ID);
    assert.strictEqual(directRequest.jwt.payload.email_verified, true);

    await expectMiddlewareSuccess(
      jwtVerifyOrServerAuth(publicKey, introspector),
      createRequest({ Authorization: 'Bearer opaque-server-token' }),
    );
    await expectMiddlewareSuccess(
      jwtVerifyOrServerAuthAndHasRole('admin', publicKey, introspector),
      createRequest({ Authorization: 'Bearer opaque-server-token' }),
    );
  });

  it('publishes bounded authorization defaults and the used-token error outcome', function () {
    assert.strictEqual(DEFAULT_USER_AUTHORIZATION_HEADER_NAME, 'X-Authorization-Context');
    assert.strictEqual(DEFAULT_USER_AUTHORIZATION_MAX_TOKEN_LENGTH, 2048);
    assert.throws(() => throwUsedTokenError(), /Used_Token/);
  });
});

function createRequest(headers) {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]),
  );
  return {
    get(name) {
      return normalizedHeaders[name.toLowerCase()] ?? null;
    },
  };
}

function createSignedToken(payload) {
  return jwtCreateSignedToken(
    { alg: 'EdDSA', typ: 'JWT' },
    { iat: Math.floor(Date.now() / 1000), ...payload },
    privateKey,
  );
}

function createUserToken() {
  const issuedAt = Math.floor(Date.now() / 1000);
  return createSignedToken({ exp: issuedAt + 60, roles: ['admin'], sub: USER_ID });
}

function createServiceToken(issuer, audience) {
  const issuedAt = Math.floor(Date.now() / 1000);
  return createSignedToken({ aud: audience, exp: issuedAt + 60, iss: issuer, sub: issuer });
}

function createUserAuthorizationToken() {
  const issuedAt = Math.floor(Date.now() / 1000);
  return createSignedToken({
    actions: ['read'],
    aud: 'ms-documents',
    authzVersion: '1',
    exp: issuedAt + 60,
    iss: 'ms-institutions',
    jti: '9c84c2e2-5b27-4c0d-bd1a-0fb56304a2b8',
    schema: 'documents',
    scopeId: AUTHORIZATION_SUBJECT,
    scopeType: 'self',
    sub: AUTHORIZATION_SUBJECT,
    table: 'documents',
    typ: 'carecard.authorization-context.scoped.v1',
  });
}

function corruptToken(token) {
  const [header, payload, signature] = token.split('.');
  const corruptedFirstCharacter = signature.startsWith('a') ? 'b' : 'a';
  return `${header}.${payload}.${corruptedFirstCharacter}${signature.slice(1)}`;
}

function captureMiddlewareError(middleware, request) {
  return new Promise(resolve => middleware(request, {}, error => resolve(error)));
}

async function expectMiddlewareSuccess(middleware, request) {
  const error = await captureMiddlewareError(middleware, request);
  assert.ifError(error);
}
