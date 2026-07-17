const { describe, it } = require('mocha');
const assert = require('assert');
const Module = require('module');
const jwtRead = require('../index');
const jwtLib = require('../lib/jwtLib');
const { publicKey, privateKey } = require('./keys/keys');
const { generateKeyPair, jwtCreateSignedToken, jwtGetHeaderPayload } = require('@carecard/auth-util');

describe('Lib jwtLib.js', function () {
  const jwtString = jwtCreateSignedToken(
    { alg: 'EdDSA' },
    { iat: 1638662314, sub: '8b0db877-a6b3-4a23-a493-e687915cdd87', roles: [] },
    privateKey,
  );

  const jwtStringBad = jwtString.substring(0, jwtString.length - 10) + 'badsignature';

  describe('_extractJwt', function () {
    it('should extract JWT from Bearer token', function () {
      const result = jwtLib._extractJwt('Bearer ' + jwtString);
      assert.strictEqual(result, jwtString);
    });

    it('should fail closed if a non-Bearer token handler returns normally', function () {
      assert.throws(
        () => jwtLib._extractJwt('NotBearer token', () => {}),
        /Custom authentication error function returned without throwing/,
      );
    });

    it('should fail closed if a null-token handler returns normally', function () {
      assert.throws(() => jwtLib._extractJwt(null, () => {}), /Custom authentication error function returned without throwing/);
    });
  });

  describe('_extractWebToken', function () {
    it('should extract web token directly', function () {
      const result = jwtLib._extractWebToken(jwtString);
      assert.strictEqual(result, jwtString);
    });

    it('should fail closed if a null web-token handler returns normally', function () {
      assert.throws(() => jwtLib._extractWebToken(null, () => {}), /Custom authentication error function returned without throwing/);
    });
  });

  describe('_validateJwt', function () {
    it('should extract and return JWT from request Authorization header', async function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtString : null) };
      const result = await jwtLib._validateJwt(req);
      assert.strictEqual(result, jwtString);
    });

    it('should throw error if Authorization header is missing', function () {
      const req = { get: () => null };
      assert.throws(() => jwtLib._validateJwt(req));
    });

    it('should throw error if Authorization header is not Bearer', function () {
      const req = { get: () => 'NotBearer token' };
      assert.throws(() => jwtLib._validateJwt(req));
    });

    it('should fail closed when a custom handler returns for invalid input', function () {
      const req = { get: () => 'not-a-jwt' };
      assert.throws(() => jwtLib._validateJwt(req, () => {}), /Custom authentication error function returned without throwing/);
    });
  });

  describe('_isJwtSignatureValid & _isJwtSignatureValidNoThrow', function () {
    it('should return true for valid EdDSA signature', async function () {
      const isValid = await jwtLib._isJwtSignatureValid(jwtString, publicKey);
      assert.strictEqual(isValid, true);
    });

    it('should return true for valid RSA sha512 signature', async function () {
      const { privateKey: rsaPrivateKey, publicKey: rsaPublicKey } = generateKeyPair('rsa');
      const jwt = jwtCreateSignedToken({ alg: 'sha512' }, { sub: 'test' }, rsaPrivateKey);
      const isValid = await jwtLib._isJwtSignatureValid(jwt, rsaPublicKey);
      assert.strictEqual(isValid, true);
    });

    it('should return false for invalid signature (no-throw)', async function () {
      const isValid = await jwtLib._isJwtSignatureValidNoThrow(jwtStringBad, publicKey);
      assert.strictEqual(isValid, false);
    });

    it('should handle invalid JWT format (no-throw)', async function () {
      const isValid = await jwtLib._isJwtSignatureValidNoThrow('not.a.jwt', publicKey);
      assert.strictEqual(isValid, false);
    });

    it('should handle null JWT (no-throw)', async function () {
      const isValid = await jwtLib._isJwtSignatureValidNoThrow(null, publicKey);
      assert.strictEqual(isValid, false);
    });

    it('should fail closed when a custom handler returns for a null JWT', async function () {
      await assert.rejects(
        () => jwtLib._isJwtSignatureValid(null, publicKey, () => {}),
        /Custom authentication error function returned without throwing/,
      );
    });
  });

  describe('_extractJwtObject & _extractJwtObjectNoThrow', function () {
    it('should extract and attach JWT object to req', async function () {
      const req = {};
      await jwtLib._extractJwtObject(req, jwtString);
      assert.ok(req.jwt);
      assert.strictEqual(req.jwt.payload.sub, '8b0db877-a6b3-4a23-a493-e687915cdd87');
    });

    it('should handle invalid JWT in no-throw version', async function () {
      const req = {};
      await jwtLib._extractJwtObjectNoThrow(req, 'invalid-jwt');
      assert.strictEqual(req.jwt, null);
    });

    it('should handle null JWT in no-throw version', async function () {
      const req = {};
      await jwtLib._extractJwtObjectNoThrow(req, null);
      assert.strictEqual(req.jwt, null);
    });

    it('should clear the JWT and fail closed when a custom handler returns for non-string input', function () {
      const req = {};

      assert.throws(() => jwtLib._extractJwtObject(req, 123, () => {}), /Custom authentication error function returned without throwing/);
      assert.strictEqual(req.jwt, null);
    });
  });

  describe('validateAndExtractJwtObject', function () {
    it('should validate and extract JWT object', async function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtString : null) };
      await jwtLib.validateAndExtractJwtObject(req, publicKey);
      assert.ok(req.jwt);
      assert.strictEqual(req.jwt.payload.sub, '8b0db877-a6b3-4a23-a493-e687915cdd87');
    });

    it('should clear the JWT and fail closed when a custom handler returns for an invalid signature', async function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtStringBad : null) };

      assert.throws(
        () => jwtLib.validateAndExtractJwtObject(req, publicKey, () => {}),
        /Custom authentication error function returned without throwing/,
      );
      assert.strictEqual(req.jwt, null);
    });

    it('optionally validates X-Authorization-Context without replacing req.jwt', function () {
      const userAuthorizationToken = buildSignedUserAuthorizationTokenFixture();
      const req = {
        get: h => {
          if (h === 'Authorization') return 'Bearer ' + jwtString;
          if (h === 'X-Authorization-Context') return userAuthorizationToken;
          return null;
        },
      };

      jwtLib.validateAndExtractJwtObject(req, publicKey, undefined, {
        userAuthorization: {
          publicKey,
          expectedType: 'carecard.authorization-context.scoped.v1',
          expectedIssuer: 'ms-institutions',
          expectedAudience: 'ms-documents',
        },
      });

      assert.strictEqual(req.jwt.payload.sub, '8b0db877-a6b3-4a23-a493-e687915cdd87');
      assert.strictEqual(req.userAuthorization.payload.sub, '6f4cb7f4-2c2a-4a91-9b56-3e5389703d42');
      assert.strictEqual(req.userAuthorization.payload.table, 'documents');
      assert.strictEqual(req.userAuthorization.token, undefined);
    });

    it('does not read X-Authorization-Context when userAuthorization options are not configured', function () {
      const req = {
        get: h => {
          if (h === 'Authorization') return 'Bearer ' + jwtString;
          if (h === 'X-Authorization-Context') return jwtStringBad;
          return null;
        },
      };

      jwtLib.validateAndExtractJwtObject(req, publicKey);

      assert.ok(req.jwt);
      assert.strictEqual(req.userAuthorization, undefined);
    });

    it('leaves req.userAuthorization null when optional X-Authorization-Context is missing', function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtString : null) };

      jwtLib.validateAndExtractJwtObject(req, publicKey, undefined, {
        userAuthorization: { publicKey },
      });

      assert.ok(req.jwt);
      assert.strictEqual(req.userAuthorization, null);
    });

    it('fails closed when optional X-Authorization-Context is present but invalid', function () {
      const req = {
        get: h => {
          if (h === 'Authorization') return 'Bearer ' + jwtString;
          if (h === 'X-Authorization-Context') return jwtStringBad;
          return null;
        },
      };

      assert.throws(() => {
        jwtLib.validateAndExtractJwtObject(req, publicKey, undefined, {
          userAuthorization: { publicKey },
        });
      });
      assert.strictEqual(req.userAuthorization, null);
    });
  });

  describe('validateAndExtractUserAuthorizationObject', function () {
    it('validates and extracts a signed X-Authorization-Context token', function () {
      const token = buildSignedUserAuthorizationTokenFixture();
      const req = { get: h => (h === 'X-Authorization-Context' ? token : null) };

      jwtLib.validateAndExtractUserAuthorizationObject(req, publicKey, undefined, {
        expectedType: 'carecard.authorization-context.scoped.v1',
        expectedIssuer: 'ms-institutions',
        expectedAudience: 'ms-documents',
      });

      assert.strictEqual(req.userAuthorization.payload.typ, 'carecard.authorization-context.scoped.v1');
      assert.strictEqual(req.userAuthorization.payload.iss, 'ms-institutions');
      assert.strictEqual(req.userAuthorization.payload.aud, 'ms-documents');
      assert.strictEqual(req.userAuthorization.payload.schema, 'documents');
    });

    it('rejects missing X-Authorization-Context when called directly', function () {
      const req = { get: () => null };

      assert.throws(() => {
        jwtLib.validateAndExtractUserAuthorizationObject(req, publicKey);
      });
      assert.strictEqual(req.userAuthorization, null);
    });

    it('rejects missing X-Authorization-Context with a null request', function () {
      assert.throws(() => {
        jwtLib.validateAndExtractUserAuthorizationObject(null, publicKey);
      });
    });

    it('rejects oversized X-Authorization-Context tokens', function () {
      const oversizePadding = '.'.repeat(jwtRead.DEFAULT_USER_AUTHORIZATION_MAX_TOKEN_LENGTH + 1);
      const req = { get: h => (h === jwtRead.DEFAULT_USER_AUTHORIZATION_HEADER_NAME ? `${jwtString}${oversizePadding}` : null) };

      assert.throws(() => {
        jwtLib.validateAndExtractUserAuthorizationObject(req, publicKey);
      });
      assert.strictEqual(req.userAuthorization, null);
    });

    it('exports the default X-Authorization-Context header settings', function () {
      assert.strictEqual(jwtRead.DEFAULT_USER_AUTHORIZATION_HEADER_NAME, 'X-Authorization-Context');
      assert.strictEqual(jwtRead.DEFAULT_USER_AUTHORIZATION_MAX_TOKEN_LENGTH, 2048);
      assert.strictEqual(jwtLib.DEFAULT_USER_AUTHORIZATION_HEADER_NAME, jwtRead.DEFAULT_USER_AUTHORIZATION_HEADER_NAME);
      assert.strictEqual(jwtLib.DEFAULT_USER_AUTHORIZATION_MAX_TOKEN_LENGTH, jwtRead.DEFAULT_USER_AUTHORIZATION_MAX_TOKEN_LENGTH);
    });

    it('rejects invalid user authorization claim variants', function () {
      const invalidCases = [
        {
          name: 'expired',
          token: buildSignedUserAuthorizationTokenFixture({
            issuedAt: Math.floor(Date.now() / 1000) - 20,
            expiresInSeconds: 10,
          }),
          options: {},
        },
        {
          name: 'issued in future',
          token: buildSignedUserAuthorizationTokenFixture({
            issuedAt: Math.floor(Date.now() / 1000) + 60,
            expiresInSeconds: 120,
          }),
          options: {},
        },
        {
          name: 'not yet valid',
          token: buildSignedUserAuthorizationTokenFixture({
            notBefore: Math.floor(Date.now() / 1000) + 60,
          }),
          options: {},
        },
        {
          name: 'wrong type',
          token: buildSignedUserAuthorizationTokenFixture({ type: 'other-token' }),
          options: { expectedType: 'carecard.authorization-context.scoped.v1' },
        },
        {
          name: 'wrong issuer',
          token: buildSignedUserAuthorizationTokenFixture({ issuer: 'ms-auth' }),
          options: { expectedIssuer: 'ms-institutions' },
        },
        {
          name: 'wrong audience',
          token: buildSignedUserAuthorizationTokenFixture({ audience: 'ms-search' }),
          options: { expectedAudience: 'ms-documents' },
        },
      ];

      for (const invalidCase of invalidCases) {
        const req = { get: h => (h === 'X-Authorization-Context' ? invalidCase.token : null) };
        assert.throws(
          () => {
            jwtLib.validateAndExtractUserAuthorizationObject(req, publicKey, undefined, invalidCase.options);
          },
          undefined,
          invalidCase.name,
        );
        assert.strictEqual(req.userAuthorization, null, invalidCase.name);
      }
    });

    it('clears req.userAuthorization in no-throw mode for invalid tokens', function () {
      const req = { get: h => (h === 'X-Authorization-Context' ? jwtStringBad : null) };

      jwtLib.validateAndExtractUserAuthorizationObjectNoThrow(req, publicKey);

      assert.strictEqual(req.userAuthorization, null);
    });

    it('leaves a null request unchanged in direct no-throw mode', function () {
      assert.strictEqual(jwtLib.validateAndExtractUserAuthorizationObjectNoThrow(null, publicKey), null);
    });

    it('extracts req.userAuthorization in no-throw mode for valid tokens', function () {
      const token = buildSignedUserAuthorizationTokenFixture();
      const req = { get: h => (h === 'X-Authorization-Context' ? token : null) };

      const result = jwtLib.validateAndExtractUserAuthorizationObjectNoThrow(req, publicKey);

      assert.strictEqual(result, req);
      assert.strictEqual(req.userAuthorization.payload.sub, '6f4cb7f4-2c2a-4a91-9b56-3e5389703d42');
    });

    it('extracts user authorization with direct middleware', function () {
      const token = buildSignedUserAuthorizationTokenFixture();
      const req = { get: h => (h === 'X-Authorization-Context' ? token : null) };
      const middleware = jwtLib.verifyUserAuthorization(publicKey, undefined, {
        expectedAudience: ['ms-search', 'ms-documents'],
      });
      let nextCalled = false;

      middleware(req, {}, err => {
        assert.ifError(err);
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true);
      assert.strictEqual(req.userAuthorization.payload.aud, 'ms-documents');
    });

    it('passes direct middleware errors to next', function () {
      const req = { get: () => null };
      const middleware = jwtLib.verifyUserAuthorization(publicKey);
      let errorPassed = null;

      middleware(req, {}, err => {
        errorPassed = err;
      });

      assert.ok(errorPassed);
      assert.strictEqual(req.userAuthorization, null);
    });

    it('clears user authorization with direct no-throw middleware for invalid tokens', function () {
      const req = { get: h => (h === 'X-Authorization-Context' ? jwtStringBad : null) };
      const middleware = jwtLib.verifyUserAuthorizationNoThrow(publicKey);
      let nextCalled = false;

      middleware(req, {}, err => {
        assert.ifError(err);
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true);
      assert.strictEqual(req.userAuthorization, null);
    });

    it('passes direct no-throw middleware errors to next', function () {
      const token = buildSignedUserAuthorizationTokenFixture();
      const req = { get: h => (h === 'X-Authorization-Context' ? token : null) };
      const middleware = jwtLib.verifyUserAuthorizationNoThrow(publicKey);
      let calledCount = 0;

      middleware(req, {}, err => {
        calledCount++;
        if (calledCount === 1) throw new Error('next_throws');
        assert.ok(err);
      });

      assert.strictEqual(calledCount, 2);
    });

    it('uses lowercase X-Authorization-Context fallback for direct extraction', function () {
      const token = buildSignedUserAuthorizationTokenFixture();
      const req = { get: h => (h === 'x-authorization-context' ? token : null) };

      jwtLib.validateAndExtractUserAuthorizationObject(req, publicKey);

      assert.strictEqual(req.userAuthorization.payload.table, 'documents');
    });

    it('accepts custom user authorization length and lowercase missing-header configuration', function () {
      const token = buildSignedUserAuthorizationTokenFixture();
      const reqWithCustomLength = { get: h => (h === 'X-Authorization-Context' ? token : null) };
      const reqWithMissingLowercaseHeader = { get: () => null };

      jwtLib.validateAndExtractUserAuthorizationObject(reqWithCustomLength, publicKey, undefined, {
        maxTokenLength: 4096,
      });
      jwtLib.validateAndExtractUserAuthorizationObjectNoThrow(reqWithMissingLowercaseHeader, publicKey, {
        headerName: 'x-authorization-context',
      });

      assert.strictEqual(reqWithCustomLength.userAuthorization.payload.aud, 'ms-documents');
      assert.strictEqual(reqWithMissingLowercaseHeader.userAuthorization, null);
    });

    it('propagates unexpected payload decoding failures after signature validation', function () {
      const mockedJwtLib = requireJwtLibWithAuthUtilMock({
        jwtVerifySignedToken: () => true,
        jwtGetHeaderPayload: () => {
          throw new Error('decode failed');
        },
      });
      const req = { get: h => (h === 'X-Authorization-Context' ? buildSignedUserAuthorizationTokenFixture() : null) };

      assert.throws(() => mockedJwtLib.validateAndExtractUserAuthorizationObjectNoThrow(req, publicKey), /decode failed/);
    });

    it('rejects user authorization when decoded JWT has no payload after signature validation', function () {
      const mockedJwtLib = requireJwtLibWithAuthUtilMock({
        jwtVerifySignedToken: () => true,
        jwtGetHeaderPayload: () => ({}),
      });
      const req = { get: h => (h === 'X-Authorization-Context' ? buildSignedUserAuthorizationTokenFixture() : null) };

      mockedJwtLib.validateAndExtractUserAuthorizationObjectNoThrow(req, publicKey);

      assert.strictEqual(req.userAuthorization, null);
    });
  });

  describe('validateAndExtractJwtOrServerAuthObject', function () {
    // Pattern: State Verification - confirms invalid JWT cleanup before server-auth fallback.
    it('clears a JWT with an invalid signature before server-auth fallback', function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtStringBad : null) };

      const wasJwtExtracted = jwtLib.tryValidateAndExtractJwtObject(req, publicKey);

      assert.strictEqual(wasJwtExtracted, false);
      assert.strictEqual(req.jwt, null);
    });

    it('uses a valid JWT without calling the server-auth introspector', async function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtString : null) };
      let introspectorCalled = false;

      await jwtLib.validateAndExtractJwtOrServerAuthObject(req, publicKey, () => {
        introspectorCalled = true;
      });

      assert.strictEqual(introspectorCalled, false);
      assert.strictEqual(req.jwt.payload.sub, '8b0db877-a6b3-4a23-a493-e687915cdd87');
      assert.strictEqual(req.jwt.payload.authMode, undefined);
    });

    it('introspects an opaque server-auth token and attaches it as req.jwt', async function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer opaque-token' : null) };

      await jwtLib.validateAndExtractJwtOrServerAuthObject(req, publicKey, token => {
        assert.strictEqual(token, 'opaque-token');
        return {
          valid: true,
          userId: 'user-123',
          sessionId: 'session-123',
          email: 'user@example.com',
          roles: ['ad'],
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        };
      });

      assert.strictEqual(req.jwt.header.typ, 'ServerAuth');
      assert.strictEqual(req.jwt.payload.sub, 'user-123');
      assert.strictEqual(req.jwt.payload.authMode, 'server-auth');
      assert.strictEqual(req.jwt.payload.sessionId, 'session-123');
      assert.strictEqual(req.jwt.doesJwtUserHasRole('ad'), true);
    });

    it('falls back to server-auth when Authorization contains an invalid JWT signature', async function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtStringBad : null) };

      await jwtLib.validateAndExtractJwtOrServerAuthObject(req, publicKey, token => {
        assert.strictEqual(token, jwtStringBad);
        return {
          valid: true,
          userId: 'user-456',
          roles: [],
        };
      });

      assert.strictEqual(req.jwt.payload.sub, 'user-456');
      assert.strictEqual(req.jwt.payload.authMode, 'server-auth');
    });

    it('fails closed when a custom missing-token handler returns normally', async function () {
      const req = { get: () => null };
      let customErrorCalled = false;

      await assert.rejects(
        () =>
          jwtLib.validateAndExtractJwtOrServerAuthObject(
            req,
            publicKey,
            token => {
              assert.strictEqual(token, null);
              return {
                valid: true,
                userId: 'b7c7d232-d421-4e76-8794-578b868b1f56',
                roles: [],
              };
            },
            () => {
              customErrorCalled = true;
            },
          ),
        /Custom authentication error function returned without throwing/,
      );

      assert.strictEqual(customErrorCalled, true);
      assert.strictEqual(req.jwt, undefined);
    });

    it('rejects server-auth when Authorization is missing', async function () {
      const req = { get: () => null };

      await assert.rejects(() => jwtLib.validateAndExtractJwtOrServerAuthObject(req, publicKey, () => ({ valid: true })));
    });

    it('rejects server-auth when the introspector is not a function', async function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer opaque-token' : null) };

      await assert.rejects(() => jwtLib.validateAndExtractJwtOrServerAuthObject(req, publicKey, null));
    });

    it('rejects valid server-auth claims without a subject', async function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer opaque-token' : null) };

      await assert.rejects(() =>
        jwtLib.validateAndExtractJwtOrServerAuthObject(req, publicKey, () => ({
          valid: true,
          roles: ['ad'],
        })),
      );
      assert.strictEqual(req.jwt, null);
    });

    it('rejects an invalid server-auth introspection result', async function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer opaque-token' : null) };

      await assert.rejects(() => jwtLib.validateAndExtractJwtOrServerAuthObject(req, publicKey, () => ({ valid: false })));
    });
  });

  describe('JWT or server-auth middleware', function () {
    it('passes valid flexible auth through next', async function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtString : null) };
      const middleware = jwtLib.verifyJwtOrServerAuth(publicKey, () => {
        throw new Error('introspector should not be called');
      });
      let nextCalled = false;

      await middleware(req, {}, err => {
        assert.ifError(err);
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true);
      assert.strictEqual(req.jwt.payload.sub, '8b0db877-a6b3-4a23-a493-e687915cdd87');
    });

    it('passes flexible auth errors through next', async function () {
      const req = { get: () => null };
      const middleware = jwtLib.verifyJwtOrServerAuth(publicKey, () => ({ valid: true }));
      let errorPassed = null;

      await middleware(req, {}, err => {
        errorPassed = err;
      });

      assert.ok(errorPassed);
    });

    it('passes flexible auth role checks through next', async function () {
      const payload = jwtGetHeaderPayload(jwtString).payload;
      const jwtWithAdmin = jwtCreateSignedToken(
        { alg: 'EdDSA' },
        {
          ...payload,
          roles: ['admin'],
        },
        privateKey,
      );
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtWithAdmin : null) };
      const middleware = jwtLib.verifyJwtOrServerAuthAndHasRole('admin', publicKey, () => {
        throw new Error('introspector should not be called');
      });
      let nextCalled = false;

      await middleware(req, {}, err => {
        assert.ifError(err);
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true);
      assert.strictEqual(req.jwt.payload.roles[0], 'admin');
    });

    it('passes flexible auth role errors through next', async function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtString : null) };
      const middleware = jwtLib.verifyJwtOrServerAuthAndHasRole('admin', publicKey, () => ({ valid: true }));
      let errorPassed = null;

      await middleware(req, {}, err => {
        errorPassed = err;
      });

      assert.ok(errorPassed);
    });
  });

  describe('service JWT validation helpers', function () {
    it('verifies and extracts a service JWT for the expected sender and receiver', function () {
      const token = buildSignedServiceTokenFixture({
        issuer: 'ms-institutions',
        audience: 'ms-auth',
      });
      const req = { get: h => (h === 'Authorization' ? `Bearer ${token}` : null) };

      jwtLib.validateAndExtractServiceJwtObject(req, publicKey, 'ms-institutions', 'ms-auth');

      assert.strictEqual(req.jwt.payload.iss, 'ms-institutions');
      assert.strictEqual(req.jwt.payload.aud, 'ms-auth');
    });

    it('rejects a service JWT from a different sender', function () {
      const token = buildSignedServiceTokenFixture({
        issuer: 'ms-contact-us',
        audience: 'ms-auth',
      });
      const req = { get: h => (h === 'Authorization' ? `Bearer ${token}` : null) };

      assert.throws(() => {
        jwtLib.validateAndExtractServiceJwtObject(req, publicKey, 'ms-institutions', 'ms-auth');
      });
      assert.strictEqual(req.jwt, null);
    });

    it('rejects an expired service JWT', function () {
      const token = buildSignedServiceTokenFixture({
        issuer: 'ms-institutions',
        audience: 'ms-auth',
        issuedAt: Math.floor(Date.now() / 1000) - 20,
        expiresInSeconds: 10,
      });
      const req = { get: h => (h === 'Authorization' ? `Bearer ${token}` : null) };

      assert.throws(() => {
        jwtLib.validateAndExtractServiceJwtObject(req, publicKey, 'ms-institutions', 'ms-auth');
      });
      assert.strictEqual(req.jwt, null);
    });

    it('rejects a service JWT with an invalid signature', function () {
      const req = { get: h => (h === 'Authorization' ? `Bearer ${jwtStringBad}` : null) };

      assert.throws(() => {
        jwtLib.validateAndExtractServiceJwtObject(req, publicKey, 'ms-institutions', 'ms-auth');
      });
      assert.strictEqual(req.jwt, null);
    });

    it('allows service JWT audiences to be an array', function () {
      assert.strictEqual(
        jwtLib._isServiceJwtFor(
          {
            iss: 'ms-institutions',
            sub: 'ms-institutions',
            aud: ['ms-auth', 'ms-user-profiles'],
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60,
          },
          'ms-institutions',
          'ms-auth',
        ),
        true,
      );
    });

    it('covers service JWT guard variants', function () {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const nowMillis = Date.now();

      assert.strictEqual(jwtLib._isServiceJwtFor(null, 'ms-institutions', 'ms-auth'), false);
      assert.strictEqual(
        jwtLib._isServiceJwtFor(
          {
            iss: 'ms-institutions',
            sub: 'ms-institutions',
            aud: 'ms-search',
            iat: nowSeconds,
            exp: nowSeconds + 60,
          },
          'ms-institutions',
          'ms-auth',
        ),
        false,
      );
      assert.strictEqual(
        jwtLib._isServiceJwtFor(
          {
            iss: 'ms-institutions',
            sub: 'ms-institutions',
            aud: 'ms-auth',
            exp: nowSeconds + 60,
          },
          'ms-institutions',
          'ms-auth',
        ),
        false,
      );
      assert.strictEqual(
        jwtLib._isServiceJwtFor(
          {
            iss: 'ms-institutions',
            sub: 'ms-institutions',
            aud: 'ms-auth',
            iat: nowSeconds,
          },
          'ms-institutions',
          'ms-auth',
        ),
        false,
      );
      assert.strictEqual(
        jwtLib._isServiceJwtFor(
          {
            iss: 'ms-institutions',
            sub: 'ms-institutions',
            aud: 'ms-auth',
            iat: nowSeconds,
            exp: nowSeconds + 60,
            nbf: 'not-a-number',
          },
          'ms-institutions',
          'ms-auth',
        ),
        false,
      );
      assert.strictEqual(
        jwtLib._isServiceJwtFor(
          {
            iss: 'ms-institutions',
            sub: 'ms-institutions',
            aud: 'ms-auth',
            iat: nowSeconds,
            exp: nowSeconds + 60,
            nbf: nowSeconds + 60,
          },
          'ms-institutions',
          'ms-auth',
        ),
        false,
      );
      assert.strictEqual(
        jwtLib._isServiceJwtFor(
          {
            iss: 'ms-institutions',
            sub: 'ms-institutions',
            aud: 'ms-auth',
            iat: nowMillis,
            exp: nowMillis + 60000,
          },
          'ms-institutions',
          'ms-auth',
        ),
        true,
      );
    });

    it('normalizes server-auth payload edge cases', function () {
      const payloadWithNonArrayRoles = jwtLib.createServerAuthPayload({
        user_id: 'b7c7d232-d421-4e76-8794-578b868b1f56',
        roles: 'admin',
        expires_at: 'not-a-date',
      });
      const payloadWithNumericExpiration = jwtLib.createServerAuthPayload({
        userId: '9f8baf8a-c2de-4e88-bf04-46773704ca9f',
        exp: Math.floor(Date.now() / 1000) + 60,
      });

      assert.deepStrictEqual(payloadWithNonArrayRoles.roles, []);
      assert.strictEqual(payloadWithNonArrayRoles.exp, undefined);
      assert.strictEqual(typeof payloadWithNumericExpiration.exp, 'number');
    });

    it('preserves exact server-auth email confirmation claim names and values', function () {
      const emailConfirmationClaims = {
        emailVerified: false,
        email_verified: true,
        emailConfirmed: false,
        email_confirmed: true,
      };
      const emailConfirmationClaimNames = Object.keys(emailConfirmationClaims);

      for (const [claimName, claimValue] of Object.entries(emailConfirmationClaims)) {
        const payload = jwtLib.createServerAuthPayload({
          userId: '9f8baf8a-c2de-4e88-bf04-46773704ca9f',
          [claimName]: claimValue,
        });
        const attachedConfirmationClaimNames = emailConfirmationClaimNames.filter(name =>
          Object.prototype.hasOwnProperty.call(payload, name),
        );

        assert.deepStrictEqual(attachedConfirmationClaimNames, [claimName]);
        assert.strictEqual(payload[claimName], claimValue);
      }
    });

    it('preserves omitted server-auth email confirmation claims without inventing a value', function () {
      const payload = jwtLib.createServerAuthPayload({
        userId: '9f8baf8a-c2de-4e88-bf04-46773704ca9f',
      });

      for (const claimName of ['emailVerified', 'email_verified', 'emailConfirmed', 'email_confirmed']) {
        assert.strictEqual(Object.prototype.hasOwnProperty.call(payload, claimName), false);
      }
    });

    it('rejects server-auth claims without a subject and a null request', function () {
      assert.throws(() => {
        jwtLib.attachServerAuthClaims(null, { valid: true });
      });
    });

    it('rejects a JWT whose subject does not match the issuing service', function () {
      assert.strictEqual(
        jwtLib._isServiceJwtFor(
          {
            iss: 'ms-institutions',
            sub: 'user-123',
            aud: 'ms-auth',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60,
          },
          'ms-institutions',
          'ms-auth',
        ),
        false,
      );
    });

    it('rejects service JWT payloads with invalid NumericDate claims', function () {
      assert.strictEqual(
        jwtLib._isServiceJwtFor(
          {
            iss: 'ms-institutions',
            sub: 'ms-institutions',
            aud: 'ms-auth',
            iat: 'now',
            exp: Math.floor(Date.now() / 1000) + 60,
          },
          'ms-institutions',
          'ms-auth',
        ),
        false,
      );
      assert.strictEqual(
        jwtLib._isServiceJwtFor(
          {
            iss: 'ms-institutions',
            sub: 'ms-institutions',
            aud: 'ms-auth',
            iat: Math.floor(Date.now() / 1000),
            exp: 'later',
          },
          'ms-institutions',
          'ms-auth',
        ),
        false,
      );
    });

    it('service JWT middleware passes errors through next', function () {
      const token = buildSignedServiceTokenFixture({
        issuer: 'ms-institutions',
        audience: 'ms-auth',
      });
      const req = { get: h => (h === 'Authorization' ? `Bearer ${token}` : null) };
      const middleware = jwtLib.verifyServiceJwt(publicKey, 'ms-institutions', 'ms-auth');
      let nextCalled = false;

      middleware(req, {}, err => {
        assert.ifError(err);
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true);
      assert.strictEqual(req.jwt.payload.iss, 'ms-institutions');
    });

    it('service JWT middleware forwards validation errors', function () {
      const token = buildSignedServiceTokenFixture({
        issuer: 'ms-search',
        audience: 'ms-auth',
      });
      const req = { get: h => (h === 'Authorization' ? `Bearer ${token}` : null) };
      const middleware = jwtLib.verifyServiceJwt(publicKey, 'ms-institutions', 'ms-auth');
      let errorPassed = null;

      middleware(req, {}, err => {
        errorPassed = err;
      });

      assert.ok(errorPassed);
      assert.strictEqual(req.jwt, null);
    });
  });

  describe('jwtAgeInSeconds', function () {
    it('should return age in seconds', function () {
      const req = { jwt: { payload: { iat: Math.floor(Date.now() / 1000) - 100 } } };
      const age = jwtLib.jwtAgeInSeconds(req);
      assert.ok(age >= 100);
    });

    it('should handle legacy ms iat', function () {
      const req = { jwt: { payload: { iat: Date.now() - 100000 } } };
      const age = jwtLib.jwtAgeInSeconds(req);
      assert.ok(age >= 100);
    });

    it('should return Infinity if iat is missing', function () {
      const req = { jwt: { payload: {} } };
      const age = jwtLib.jwtAgeInSeconds(req);
      assert.strictEqual(age, Infinity);
    });

    it('should work as an attached method', function () {
      const jwtObj = { payload: { iat: Math.floor(Date.now() / 1000) - 100 } };
      const age = jwtLib.jwtAgeInSeconds.call(jwtObj);
      assert.ok(age >= 100);
    });
  });

  describe('isJwtExpired', function () {
    it('should return true if expired by iat and validity', function () {
      const req = { jwt: { payload: { iat: Math.floor(Date.now() / 1000) - 100 } } };
      assert.strictEqual(jwtLib.isJwtExpired(req, 30), true);
    });

    it('should return false if not expired by iat and validity', function () {
      const req = { jwt: { payload: { iat: Math.floor(Date.now() / 1000) - 10 } } };
      assert.strictEqual(jwtLib.isJwtExpired(req, 30), false);
    });

    it('should return true if expired by exp claim', function () {
      const req = { jwt: { payload: { exp: Math.floor(Date.now() / 1000) - 10 } } };
      assert.strictEqual(jwtLib.isJwtExpired(req), true);
    });

    it('should return false if not expired by exp claim', function () {
      const req = { jwt: { payload: { exp: Math.floor(Date.now() / 1000) + 100 } } };
      assert.strictEqual(jwtLib.isJwtExpired(req), false);
    });
    it('should return true if no exp claim and no validity seconds provided', function () {
      const req = { jwt: { payload: { iat: Math.floor(Date.now() / 1000) - 100 } } };
      assert.strictEqual(jwtLib.isJwtExpired(req), true);
    });

    it('should work as an attached method with arguments', function () {
      const jwtObj = { payload: { iat: Math.floor(Date.now() / 1000) - 100 } };
      jwtLib._attachJwtMethods(jwtObj);
      assert.strictEqual(jwtObj.isJwtExpired(30), true);
    });
  });

  describe('doesJwtUserHasRole', function () {
    it('should return true if user has the role', function () {
      const req = { jwt: { payload: { roles: ['admin', 'user'] } } };
      assert.strictEqual(jwtLib.doesJwtUserHasRole(req, 'admin'), true);
    });

    it('should return false if user does not have the role', function () {
      const req = { jwt: { payload: { roles: ['user'] } } };
      assert.strictEqual(jwtLib.doesJwtUserHasRole(req, 'admin'), false);
    });

    it('should throw error if role is missing or invalid', function () {
      const req = { jwt: { payload: { roles: ['admin'] } } };
      assert.throws(() => jwtLib.doesJwtUserHasRole(req, null));
    });

    it('should throw error if roles is missing in jwt', function () {
      const req = { jwt: { payload: {} } };
      assert.throws(() => jwtLib.doesJwtUserHasRole(req, 'admin'));
    });
  });

  describe('jwtClientId & visitorClientId', function () {
    it('should return sub from jwt object', function () {
      const req = { jwt: { payload: { sub: 'user-123' } } };
      assert.strictEqual(jwtLib.jwtClientId(req), 'user-123');
    });

    it('should return sub from visitor object', function () {
      const req = { visitor: { payload: { sub: 'visitor-123' } } };
      assert.strictEqual(jwtLib.visitorClientId(req), 'visitor-123');
    });
  });

  describe('verifyJwtAndRole', function () {
    it('should allow access if user has the role', async function () {
      const payload = jwtGetHeaderPayload(jwtString).payload;
      payload.roles = ['admin'];
      const jwtWithAdmin = jwtCreateSignedToken({ alg: 'EdDSA' }, payload, privateKey);
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtWithAdmin : null) };
      let nextCalled = false;
      const middleware = jwtLib.verifyJwtAndRole('admin', publicKey, () => {
        throw new Error('Should not throw');
      });
      await middleware(req, {}, () => {
        nextCalled = true;
      });
      assert.ok(nextCalled);
      assert.strictEqual(req.jwt.payload.roles[0], 'admin');
    });

    it('should pass an error to next if user does not have the role', async function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtString : null) };
      const middleware = jwtLib.verifyJwtAndRole('admin', publicKey);
      let errorPassed = null;

      await middleware(req, {}, error => {
        errorPassed = error;
      });

      assert.ok(errorPassed instanceof Error);
    });

    it('should call next with error if req.get throws', async function () {
      const req = {
        get: () => {
          throw new Error('forced');
        },
      };
      const middleware = jwtLib.verifyJwtAndRole('admin', publicKey);
      let errorPassed = null;
      await middleware(req, {}, err => {
        errorPassed = err;
      });
      assert.ok(errorPassed);
    });

    it('should hit catch block if next throws', async function () {
      const payload = jwtGetHeaderPayload(jwtString).payload;
      payload.roles = ['admin'];
      const jwtWithAdmin = jwtCreateSignedToken({ alg: 'EdDSA' }, payload, privateKey);
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtWithAdmin : null) };
      const middleware = jwtLib.verifyJwtAndRole('admin', publicKey, () => {});

      let calledCount = 0;
      const next = err => {
        calledCount++;
        if (calledCount === 1) throw new Error('next_throws');
        assert.ok(err);
      };
      await middleware(req, {}, next);
      assert.strictEqual(calledCount, 2);
    });
  });

  describe('verifyJwt', function () {
    it('should extract and validate JWT', async function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtString : null) };
      const middleware = jwtLib.verifyJwt(publicKey);
      let nextCalled = false;
      await middleware(req, {}, () => {
        nextCalled = true;
      });
      assert.ok(nextCalled);
      assert.strictEqual(req.jwt.payload.sub, '8b0db877-a6b3-4a23-a493-e687915cdd87');
    });

    it('should call next with error if req.get throws', async function () {
      const req = {
        get: () => {
          throw new Error('forced');
        },
      };
      const middleware = jwtLib.verifyJwt(publicKey);
      let errorPassed = null;
      await middleware(req, {}, err => {
        errorPassed = err;
      });
      assert.ok(errorPassed);
    });

    it('should hit catch block if next throws', async function () {
      const req = { get: () => 'Bearer ' + jwtString };
      const middleware = jwtLib.verifyJwt(publicKey);
      let calledCount = 0;
      const next = err => {
        calledCount++;
        if (calledCount === 1) throw new Error('next_throws');
        assert.ok(err);
      };
      middleware(req, {}, next);
      assert.strictEqual(calledCount, 2);
    });
  });

  describe('verifyWebToken', function () {
    it('should extract and validate web token from custom header', async function () {
      const req = { get: h => (h === 'X-Web-Token' ? jwtString : null) };
      const middleware = jwtLib.verifyWebToken(publicKey, 'X-Web-Token');
      let nextCalled = false;
      await middleware(req, {}, () => {
        nextCalled = true;
      });
      assert.ok(nextCalled);
      assert.strictEqual(req.jwt.payload.sub, '8b0db877-a6b3-4a23-a493-e687915cdd87');
    });

    it('should handle null header via custom error', function (done) {
      const middleware = jwtLib.verifyWebToken(publicKey, 'X-Web-Token', () => {
        // custom error function that doesn't throw
      });
      const req = { get: () => null };
      middleware(req, {}, () => {
        done();
      });
    });

    it('should call next with error if req.get throws', async function () {
      const req = {
        get: () => {
          throw new Error('forced');
        },
      };
      const middleware = jwtLib.verifyWebToken(publicKey, 'X-Web-Token');
      let errorPassed = null;
      await middleware(req, {}, err => {
        errorPassed = err;
      });
      assert.ok(errorPassed);
    });

    it('should hit catch block if next throws', async function () {
      const req = { get: () => jwtString };
      const middleware = jwtLib.verifyWebToken(publicKey, 'X-Web-Token');
      let calledCount = 0;
      const next = err => {
        calledCount++;
        if (calledCount === 1) throw new Error('next_throws');
        assert.ok(err);
      };
      middleware(req, {}, next);
      assert.strictEqual(calledCount, 2);
    });
  });

  describe('verifyJwtNoThrow & verifyWebTokenNoThrow', function () {
    it('should set req.jwt on success (verifyJwtNoThrow)', async function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtString : null) };
      const middleware = jwtLib.verifyJwtNoThrow(publicKey);
      await middleware(req, {}, () => {});
      assert.ok(req.jwt);
      assert.strictEqual(req.jwt.payload.sub, '8b0db877-a6b3-4a23-a493-e687915cdd87');
    });

    it('should not throw and set req.jwt to null on failure (verifyJwtNoThrow)', async function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtStringBad : null) };
      const middleware = jwtLib.verifyJwtNoThrow(publicKey);
      await middleware(req, {}, () => {});
      assert.strictEqual(req.jwt, null);
    });

    it('should handle no token (verifyJwtNoThrow)', async function () {
      const req = { get: () => null };
      const middleware = jwtLib.verifyJwtNoThrow(publicKey);
      await middleware(req, {}, () => {});
      assert.strictEqual(req.jwt, null);
    });

    it('should clear missing optional user authorization in no-throw mode', async function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtString : null) };
      const result = jwtLib.validateAndExtractJwtObjectNoThrow(req, publicKey, {
        userAuthorization: { publicKey },
      });

      assert.strictEqual(result, req);
      assert.strictEqual(req.userAuthorization, null);
    });

    it('should treat null optional user authorization options as configured but missing', async function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtString : null) };
      const result = jwtLib.validateAndExtractJwtObject(req, publicKey, undefined, {
        userAuthorization: null,
      });

      assert.strictEqual(result, req);
      assert.strictEqual(req.userAuthorization, null);
    });

    it('should extract optional user authorization in no-throw mode', async function () {
      const userAuthorizationToken = buildSignedUserAuthorizationTokenFixture();
      const req = {
        get: h => {
          if (h === 'Authorization') return 'Bearer ' + jwtString;
          if (h === 'X-Authorization-Context') return userAuthorizationToken;
          return null;
        },
      };
      const result = jwtLib.validateAndExtractJwtObjectNoThrow(req, publicKey, {
        userAuthorization: { publicKey },
      });

      assert.strictEqual(result, req);
      assert.strictEqual(req.jwt.payload.sub, '8b0db877-a6b3-4a23-a493-e687915cdd87');
      assert.strictEqual(req.userAuthorization.payload.sub, '6f4cb7f4-2c2a-4a91-9b56-3e5389703d42');
    });

    it('should not throw and set req.jwt to null on failure (verifyWebTokenNoThrow)', async function () {
      const req = { get: h => (h === 'X-Web-Token' ? jwtStringBad : null) };
      const middleware = jwtLib.verifyWebTokenNoThrow(publicKey, 'X-Web-Token');
      await middleware(req, {}, () => {});
      assert.strictEqual(req.jwt, null);
    });

    it('should handle non-string in _extractWebTokenNoThrow via _validateWebTokenNoThrow', async function () {
      const req = { get: () => 123 };
      const middleware = jwtLib.verifyWebTokenNoThrow(publicKey, 'X-Web-Token');
      middleware(req, {}, () => {
        assert.strictEqual(req.jwt, null);
      });
    });

    it('should call next with error if req.get throws', async function () {
      const req = {
        get: () => {
          throw new Error('forced');
        },
      };
      const middleware = jwtLib.verifyJwtNoThrow(publicKey);
      let errorPassed = null;
      middleware(req, {}, err => {
        errorPassed = err;
      });
      assert.ok(errorPassed);
    });

    it('should hit catch block if next throws', async function () {
      const req = { get: () => 'Bearer ' + jwtString };
      const middleware = jwtLib.verifyJwtNoThrow(publicKey);
      let calledCount = 0;
      const next = err => {
        calledCount++;
        if (calledCount === 1) throw new Error('next_throws');
        assert.ok(err);
      };
      middleware(req, {}, next);
      assert.strictEqual(calledCount, 2);
    });

    it('should hit catch block if next throws (verifyWebTokenNoThrow)', async function () {
      const req = { get: () => jwtString };
      const middleware = jwtLib.verifyWebTokenNoThrow(publicKey, 'X-Web-Token');
      let calledCount = 0;
      const next = err => {
        calledCount++;
        if (calledCount === 1) throw new Error('next_throws');
        assert.ok(err);
      };
      middleware(req, {}, next);
      assert.strictEqual(calledCount, 2);
    });
  });

  describe('verifyVisitorNoThrow', function () {
    it('should extract and validate visitor token', async function () {
      const visitorId = 'b63887af-4fd5-47ad-9aed-687866809554';
      const visitorToken = 'Bearer ' + jwtCreateSignedToken({ alg: 'EdDSA' }, { sub: visitorId }, privateKey);
      const req = { get: h => (h === 'Visitor' ? visitorToken : null) };
      const middleware = jwtLib.verifyVisitorNoThrow(publicKey);
      middleware(req, {}, () => {});
      assert.strictEqual(req.visitor.payload.sub, visitorId);
    });

    it('should handle invalid visitor token', async function () {
      const req = { get: h => (h === 'Visitor' ? 'Bearer ' + jwtStringBad : null) };
      const middleware = jwtLib.verifyVisitorNoThrow(publicKey);
      await middleware(req, {}, () => {});
      assert.strictEqual(req.visitor, null);
    });

    it('should handle null visitor header', async function () {
      const req = { get: () => null };
      const middleware = jwtLib.verifyVisitorNoThrow(publicKey);
      await middleware(req, {}, () => {});
      assert.strictEqual(req.visitor, null);
    });

    it('should call next with error if req.get throws', async function () {
      const req = {
        get: () => {
          throw new Error('forced');
        },
      };
      const middleware = jwtLib.verifyVisitorNoThrow(publicKey);
      let errorPassed = null;
      await middleware(req, {}, err => {
        errorPassed = err;
      });
      assert.ok(errorPassed);
    });

    it('should hit catch block if next throws', async function () {
      const req = { get: () => 'Bearer valid' };
      const middleware = jwtLib.verifyVisitorNoThrow(publicKey);
      let calledCount = 0;
      const next = err => {
        calledCount++;
        if (calledCount === 1) throw new Error('next_throws');
        assert.ok(err);
      };
      middleware(req, {}, next);
      assert.strictEqual(calledCount, 2);
    });

    it('should hit catch block in validateAndExtractVisitorObjectNoThrow', function () {
      // Force error by passing invalid req
      assert.throws(() => jwtLib.validateAndExtractVisitorObjectNoThrow(null, publicKey));
    });
  });

  describe('throwError', function () {
    it('should throw error', function () {
      assert.throws(() => jwtLib.throwError(), Error);
    });

    it('should fail closed if a custom error function returns normally', function () {
      let called = false;
      assert.throws(
        () =>
          jwtLib.throwError(() => {
            called = true;
          }),
        /Custom authentication error function returned without throwing/,
      );
      assert.ok(called);
    });

    it('should throw an Error returned by a custom error function', function () {
      const returnedError = new Error('custom authorization failure');

      assert.throws(
        () => jwtLib.throwError(() => returnedError),
        error => error === returnedError,
      );
    });

    it('should cover throwError without function', function () {
      assert.throws(() => jwtLib.throwError(), Error);
    });
  });

  describe('throwUsedTokenError', function () {
    it('should throw Used_Token error', function () {
      assert.throws(() => jwtLib.throwUsedTokenError(), /Used_Token/);
    });
  });

  describe('_attachJwtMethods & _attachVisitorMethods', function () {
    it('should attach methods to req.jwt', async function () {
      const req = {};
      await jwtLib._extractJwtObject(req, jwtString);
      assert.strictEqual(typeof req.jwt.jwtClientId, 'function');
      assert.strictEqual(req.jwt.jwtClientId(), '8b0db877-a6b3-4a23-a493-e687915cdd87');
      assert.strictEqual(req.jwt.doesJwtUserHasRole('admin'), false);
    });

    it('should attach methods to req.visitor', async function () {
      const visitorId = 'b63887af-4fd5-47ad-9aed-687866809554';
      const visitorToken = jwtCreateSignedToken({ alg: 'EdDSA' }, { sub: visitorId }, privateKey);
      const req = {};
      jwtLib._extractVisitorObjectNoThrow(req, visitorToken);
      assert.strictEqual(typeof req.visitor.visitorClientId, 'function');
      assert.strictEqual(req.visitor.visitorClientId(), visitorId);
    });

    it('methods should be non-enumerable', async function () {
      const req = {};
      await jwtLib._extractJwtObject(req, jwtString);
      const keys = Object.keys(req.jwt);
      assert.ok(!keys.includes('jwtClientId'));
      assert.ok(!keys.includes('doesJwtUserHasRole'));
    });

    it('should handle null input gracefully', function () {
      jwtLib._attachJwtMethods(null);
      jwtLib._attachVisitorMethods(null);
    });
  });

  describe('Internal helpers and edge cases', function () {
    it('should handle null in _extractJwtNoThrow', function () {
      assert.strictEqual(jwtLib._extractJwtNoThrow(null), null);
    });

    it('should fail closed for a non-Bearer token when a custom handler returns', function () {
      assert.throws(
        () => jwtLib._extractJwt('NotBearer token', () => {}),
        /Custom authentication error function returned without throwing/,
      );
    });

    it('should handle null in _extractWebTokenNoThrow', function () {
      assert.strictEqual(jwtLib._extractWebTokenNoThrow(null), null);
    });

    it('should handle null in _validateWebTokenNoThrow', function () {
      const req = { get: () => null };
      assert.strictEqual(jwtLib._validateWebTokenNoThrow(req, 'X'), null);
    });

    it('should handle null in _validateVisitorNoThrow', function () {
      const req = { get: () => null };
      assert.strictEqual(jwtLib._validateVisitorNoThrow(req), null);
    });

    it('should handle non-jwt string in _validateWebTokenNoThrow', function () {
      const req = { get: () => 'not-a-jwt' };
      assert.strictEqual(jwtLib._validateWebTokenNoThrow(req, 'X'), null);
    });

    it('should handle non-jwt string in _validateVisitorNoThrow', function () {
      const req = { get: () => 'not-a-jwt' };
      assert.strictEqual(jwtLib._validateVisitorNoThrow(req), null);
    });

    it('should handle non-jwt string in _validateJwtNoThrow', function () {
      const req = { get: () => 'Bearer not-a-jwt' };
      const result = jwtLib._validateJwtNoThrow(req);
      assert.strictEqual(result, null);
    });

    it('should fail closed for a non-JWT web token when a custom handler returns', function () {
      const req = { get: () => 'not-a-jwt' };
      assert.throws(() => jwtLib._validateWebToken(req, 'X', () => {}), /Custom authentication error function returned without throwing/);
    });

    it('should fail closed for an invalid raw JWT when a custom handler returns', function () {
      assert.throws(() => jwtLib._extractJwt(123, () => {}), /Custom authentication error function returned without throwing/);
    });

    it('should fail closed for a Basic token when a custom handler returns', function () {
      assert.throws(() => jwtLib._extractJwt('Basic token', () => {}), /Custom authentication error function returned without throwing/);
    });

    it('_isLoginRequired should handle missing role', function () {
      assert.throws(() => jwtLib._isLoginRequired(false));
    });

    it('should handle errors in middlewares (no-throw versions)', async function () {
      const req = {
        get: () => {
          throw new Error('forced');
        },
      };
      let err1, err2;
      jwtLib.verifyJwtNoThrow(publicKey)(req, {}, e => {
        err1 = e;
      });
      jwtLib.verifyWebTokenNoThrow(publicKey, 'X')(req, {}, e => {
        err2 = e;
      });
      assert.ok(err1);
      assert.ok(err2);
    });

    it('should hit catch block in validateAndExtractJwtObjectNoThrow', function () {
      assert.throws(() => jwtLib.validateAndExtractJwtObjectNoThrow(null, publicKey));
    });

    it('should hit catch block in validateAndExtractWebTokenObjectNoThrow', function () {
      assert.throws(() => jwtLib.validateAndExtractWebTokenObjectNoThrow(null, publicKey, 'X'));
    });

    it('should clear the JWT and fail closed for non-string input when a custom handler returns', function () {
      const req = {};

      assert.throws(() => jwtLib._extractJwtObject(req, 123, () => {}), /Custom authentication error function returned without throwing/);
      assert.strictEqual(req.jwt, null);
    });

    it('should handle null in _extractJwtObjectNoThrow and _extractVisitorObjectNoThrow', function () {
      const req = {};
      jwtLib._extractJwtObjectNoThrow(req, null);
      assert.strictEqual(req.jwt, null);
      jwtLib._extractVisitorObjectNoThrow(req, null);
      assert.strictEqual(req.visitor, null);

      // Coverage boost: req is null
      jwtLib._extractJwtObjectNoThrow(null, null);
      jwtLib._extractVisitorObjectNoThrow(null, null);
    });
  });
});

function buildSignedServiceTokenFixture({ issuer, audience, issuedAt = Math.floor(Date.now() / 1000), expiresInSeconds = 60 }) {
  return jwtCreateSignedToken(
    { alg: 'EdDSA', typ: 'JWT' },
    {
      iss: issuer,
      sub: issuer,
      aud: audience,
      iat: issuedAt,
      exp: issuedAt + expiresInSeconds,
    },
    privateKey,
  );
}

function buildSignedUserAuthorizationTokenFixture({
  type = 'carecard.authorization-context.scoped.v1',
  issuer = 'ms-institutions',
  audience = 'ms-documents',
  subject = '6f4cb7f4-2c2a-4a91-9b56-3e5389703d42',
  issuedAt = Math.floor(Date.now() / 1000),
  expiresInSeconds = 60,
  notBefore,
} = {}) {
  const payload = {
    typ: type,
    iss: issuer,
    aud: audience,
    sub: subject,
    schema: 'documents',
    table: 'documents',
    actions: ['read'],
    scopeType: 'self',
    scopeId: subject,
    authzVersion: '1',
    iat: issuedAt,
    exp: issuedAt + expiresInSeconds,
    jti: '9c84c2e2-5b27-4c0d-bd1a-0fb56304a2b8',
  };
  if (notBefore !== undefined) payload.nbf = notBefore;

  return jwtCreateSignedToken({ alg: 'EdDSA', typ: 'JWT' }, payload, privateKey);
}

function requireJwtLibWithAuthUtilMock(authUtilOverrides) {
  const originalLoad = Module._load;
  const jwtLibPath = require.resolve('../lib/jwtLib');

  delete require.cache[jwtLibPath];
  Module._load = function loadWithAuthUtilMock(request, parent, isMain) {
    const loadedModule = originalLoad.call(this, request, parent, isMain);
    if (request === '@carecard/auth-util') {
      return {
        ...loadedModule,
        ...authUtilOverrides,
      };
    }
    return loadedModule;
  };

  try {
    return require('../lib/jwtLib');
  } finally {
    Module._load = originalLoad;
    delete require.cache[jwtLibPath];
    require('../lib/jwtLib');
  }
}
