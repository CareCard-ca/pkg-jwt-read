'use strict';

const assert = require('assert');
const { describe, it } = require('mocha');
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
  jwtVerifyOrServerAuthAndHasRole,
  jwtVerifyService,
  jwtVerifyUserAuthorization,
  jwtVerifyUserAuthorizationNoThrow,
  jwtVerifyVisitorNoThrow,
  jwtVerifyWebToken,
  jwtVerifyWebTokenNoThrow,
  throwUsedTokenError,
} = require('../index');
const { jwtCreateSignedToken } = require('@carecard/auth-util');
const { privateKey, publicKey } = require('./keys/keys');

const USER_ID = '8b0db877-a6b3-4a23-a493-e687915cdd87';
const AUTHORIZATION_SUBJECT = '6f4cb7f4-2c2a-4a91-9b56-3e5389703d42';

describe('@carecard/jwt-read public behavior', function () {
  it('extracts a signed bearer token and exposes its authenticated request context', function () {
    const request = createRequest({ Authorization: `Bearer ${createUserToken()}` });

    jwtValidateAndExtract(request, publicKey);

    assert.strictEqual(request.jwt.payload.sub, USER_ID);
    assert.strictEqual(jwtGetClientId(request), USER_ID);
    assert.strictEqual(doesJwtUserHasRole(request, 'admin'), true);
    assert.strictEqual(jwtIsExpired(request), false);
    assert.ok(jwtGetAgeInSeconds(request) >= 0);
  });

  it('fails closed for an invalid bearer signature and clears stale authentication state', function () {
    const request = createRequest({ Authorization: `Bearer ${corruptToken(createUserToken())}` });
    request.jwt = { payload: { sub: 'stale-user' } };

    assert.throws(() => jwtValidateAndExtract(request, publicKey));
    assert.strictEqual(request.jwt, null);

    request.jwt = { payload: { sub: 'stale-user' } };
    jwtValidateAndExtractNoThrow(request, publicKey);
    assert.strictEqual(request.jwt, null);
  });

  it('supports signed custom-header tokens without accepting invalid optional tokens', function () {
    const validRequest = createRequest({ 'X-Token': createUserToken() });
    jwtValidateAndExtractWebToken(validRequest, publicKey, 'X-Token');
    assert.strictEqual(validRequest.jwt.payload.sub, USER_ID);

    const invalidRequest = createRequest({ 'X-Token': corruptToken(createUserToken()) });
    jwtValidateAndExtractWebTokenNoThrow(invalidRequest, publicKey, 'X-Token');
    assert.strictEqual(invalidRequest.jwt, null);
  });

  it('extracts valid visitor identity and clears invalid visitor identity', function () {
    const visitorId = 'b63887af-4fd5-47ad-9aed-687866809554';
    const visitorToken = createSignedToken({ sub: visitorId });
    const validRequest = createRequest({ Visitor: `Bearer ${visitorToken}` });

    jwtValidateAndExtractVisitorNoThrow(validRequest, publicKey);
    assert.strictEqual(jwtGetVisitorClientId(validRequest), visitorId);

    const invalidRequest = createRequest({ Visitor: `Bearer ${corruptToken(visitorToken)}` });
    jwtValidateAndExtractVisitorNoThrow(invalidRequest, publicKey);
    assert.strictEqual(invalidRequest.visitor, null);
  });

  it('runs bearer, custom-header, and visitor middleware through Express next outcomes', async function () {
    const bearerRequest = createRequest({ Authorization: `Bearer ${createUserToken()}` });
    await expectMiddlewareSuccess(jwtVerify(publicKey), bearerRequest);
    assert.strictEqual(bearerRequest.jwt.payload.sub, USER_ID);

    const webTokenRequest = createRequest({ 'X-Token': createUserToken() });
    await expectMiddlewareSuccess(jwtVerifyWebToken(publicKey, 'X-Token'), webTokenRequest);
    assert.strictEqual(webTokenRequest.jwt.payload.sub, USER_ID);

    const visitorRequest = createRequest({
      Visitor: `Bearer ${createSignedToken({ sub: USER_ID })}`,
    });
    await expectMiddlewareSuccess(jwtVerifyVisitorNoThrow(publicKey), visitorRequest);
    assert.strictEqual(visitorRequest.visitor.payload.sub, USER_ID);
  });

  it('reports invalid required authentication while no-throw middleware continues unauthenticated', async function () {
    const invalidToken = corruptToken(createUserToken());
    const requiredRequest = createRequest({ Authorization: `Bearer ${invalidToken}` });
    const requiredError = await captureMiddlewareError(jwtVerify(publicKey), requiredRequest);
    assert.ok(requiredError instanceof Error);
    assert.strictEqual(requiredRequest.jwt, null);

    const optionalRequest = createRequest({ Authorization: `Bearer ${invalidToken}` });
    await expectMiddlewareSuccess(jwtVerifyNoThrow(publicKey), optionalRequest);
    assert.strictEqual(optionalRequest.jwt, null);

    const optionalWebRequest = createRequest({ 'X-Token': invalidToken });
    await expectMiddlewareSuccess(jwtVerifyWebTokenNoThrow(publicKey, 'X-Token'), optionalWebRequest);
    assert.strictEqual(optionalWebRequest.jwt, null);
  });

  it('enforces the requested role after successful bearer verification', async function () {
    const allowedRequest = createRequest({ Authorization: `Bearer ${createUserToken()}` });
    await expectMiddlewareSuccess(jwtVerifyAndHasRole('admin', publicKey), allowedRequest);

    const deniedRequest = createRequest({ Authorization: `Bearer ${createUserToken()}` });
    const deniedError = await captureMiddlewareError(jwtVerifyAndHasRole('reviewer', publicKey), deniedRequest);
    assert.ok(deniedError instanceof Error);
  });

  it('validates scoped user authorization claims through direct and middleware interfaces', async function () {
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
    assert.strictEqual(directRequest.userAuthorization.token, undefined);

    const middlewareRequest = createRequest({ [DEFAULT_USER_AUTHORIZATION_HEADER_NAME]: token });
    await expectMiddlewareSuccess(jwtVerifyUserAuthorization(publicKey, undefined, options), middlewareRequest);
    assert.strictEqual(middlewareRequest.userAuthorization.payload.aud, 'ms-documents');
  });

  it('fails closed for malformed scoped authorization in required and no-throw modes', async function () {
    const invalidToken = corruptToken(createUserAuthorizationToken());
    const directRequest = createRequest({ [DEFAULT_USER_AUTHORIZATION_HEADER_NAME]: invalidToken });
    assert.throws(() => jwtValidateAndExtractUserAuthorization(directRequest, publicKey));
    assert.strictEqual(directRequest.userAuthorization, null);

    const optionalRequest = createRequest({ [DEFAULT_USER_AUTHORIZATION_HEADER_NAME]: invalidToken });
    jwtValidateAndExtractUserAuthorizationNoThrow(optionalRequest, publicKey);
    assert.strictEqual(optionalRequest.userAuthorization, null);

    const middlewareRequest = createRequest({
      [DEFAULT_USER_AUTHORIZATION_HEADER_NAME]: invalidToken,
    });
    await expectMiddlewareSuccess(jwtVerifyUserAuthorizationNoThrow(publicKey), middlewareRequest);
    assert.strictEqual(middlewareRequest.userAuthorization, null);
  });

  it('accepts only service tokens from the expected issuer and audience', async function () {
    const token = createServiceToken('ms-institutions', 'ms-auth');
    const directRequest = createRequest({ Authorization: `Bearer ${token}` });

    jwtValidateAndExtractService(directRequest, publicKey, 'ms-institutions', 'ms-auth');
    assert.strictEqual(directRequest.jwt.payload.iss, 'ms-institutions');
    assert.strictEqual(directRequest.jwt.payload.aud, 'ms-auth');

    const middlewareRequest = createRequest({ Authorization: `Bearer ${token}` });
    await expectMiddlewareSuccess(jwtVerifyService(publicKey, 'ms-institutions', 'ms-auth'), middlewareRequest);

    const wrongIssuerRequest = createRequest({
      Authorization: `Bearer ${createServiceToken('ms-search', 'ms-auth')}`,
    });
    assert.throws(() => jwtValidateAndExtractService(wrongIssuerRequest, publicKey, 'ms-institutions', 'ms-auth'));
    assert.strictEqual(wrongIssuerRequest.jwt, null);
  });

  it('authenticates an opaque server token and preserves its externally supplied claims', async function () {
    const request = createRequest({ Authorization: 'Bearer opaque-server-token' });
    const introspector = async token => {
      assert.strictEqual(token, 'opaque-server-token');
      return {
        email_verified: true,
        roles: ['admin'],
        userId: USER_ID,
        valid: true,
      };
    };

    await jwtValidateAndExtractOrServerAuth(request, publicKey, introspector);

    assert.strictEqual(request.jwt.payload.sub, USER_ID);
    assert.deepStrictEqual(request.jwt.payload.roles, ['admin']);
    assert.strictEqual(request.jwt.payload.email_verified, true);

    const middlewareRequest = createRequest({ Authorization: 'Bearer opaque-server-token' });
    await expectMiddlewareSuccess(jwtVerifyOrServerAuthAndHasRole('admin', publicKey, introspector), middlewareRequest);
    assert.strictEqual(middlewareRequest.jwt.payload.sub, USER_ID);
  });

  it('publishes bounded scoped-authorization defaults and the used-token error outcome', function () {
    assert.strictEqual(DEFAULT_USER_AUTHORIZATION_HEADER_NAME, 'X-Authorization-Context');
    assert.strictEqual(DEFAULT_USER_AUTHORIZATION_MAX_TOKEN_LENGTH, 2048);
    assert.throws(() => throwUsedTokenError(), /Used_Token/);
  });
});

function createRequest(headers) {
  const normalizedHeaders = Object.fromEntries(Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]));

  return {
    get(name) {
      return normalizedHeaders[name.toLowerCase()] ?? null;
    },
  };
}

function createSignedToken(payload) {
  return jwtCreateSignedToken(
    { alg: 'EdDSA', typ: 'JWT' },
    {
      iat: Math.floor(Date.now() / 1000),
      ...payload,
    },
    privateKey,
  );
}

function createUserToken() {
  const issuedAt = Math.floor(Date.now() / 1000);
  return createSignedToken({
    exp: issuedAt + 60,
    roles: ['admin'],
    sub: USER_ID,
  });
}

function createServiceToken(issuer, audience) {
  const issuedAt = Math.floor(Date.now() / 1000);
  return createSignedToken({
    aud: audience,
    exp: issuedAt + 60,
    iss: issuer,
    sub: issuer,
  });
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
  return new Promise(resolve => {
    middleware(request, {}, error => resolve(error));
  });
}

async function expectMiddlewareSuccess(middleware, request) {
  const error = await captureMiddlewareError(middleware, request);
  assert.ifError(error);
}
