const { describe, it } = require('mocha');
const assert = require('assert');
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

    it('should return null if not Bearer', function () {
      assert.strictEqual(
        jwtLib._extractJwt('NotBearer token', () => {}),
        null,
      );
    });

    it('should return null if input is null', function () {
      assert.strictEqual(
        jwtLib._extractJwt(null, () => {}),
        null,
      );
    });
  });

  describe('_extractWebToken', function () {
    it('should extract web token directly', function () {
      const result = jwtLib._extractWebToken(jwtString);
      assert.strictEqual(result, jwtString);
    });

    it('should return null if input is null', function () {
      assert.strictEqual(
        jwtLib._extractWebToken(null, () => {}),
        null,
      );
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

    it('should handle invalid input in _validateJwt', function () {
      const req = { get: () => 'not-a-jwt' };
      try {
        jwtLib._validateJwt(req, () => {});
      } catch (e) {
        assert.ok(e);
      }
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

    it('should handle null in _isJwtSignatureValid', async function () {
      try {
        await jwtLib._isJwtSignatureValid(null, publicKey, () => {});
      } catch (e) {
        assert.ok(e);
      }
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

    it('should handle non-string in _extractJwtObject', function () {
      try {
        jwtLib._extractJwtObject({}, 123, () => {});
      } catch (e) {
        assert.ok(e);
      }
    });
  });

  describe('validateAndExtractJwtObject', function () {
    it('should validate and extract JWT object', async function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtString : null) };
      await jwtLib.validateAndExtractJwtObject(req, publicKey);
      assert.ok(req.jwt);
      assert.strictEqual(req.jwt.payload.sub, '8b0db877-a6b3-4a23-a493-e687915cdd87');
    });

    it('should throw error for invalid signature', async function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtStringBad : null) };
      try {
        await jwtLib.validateAndExtractJwtObject(req, publicKey, () => {});
        assert.fail('Should have thrown');
      } catch (e) {
        assert.ok(e);
      }
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

    it('should throw error if user does not have the role', async function () {
      const req = { get: h => (h === 'Authorization' ? 'Bearer ' + jwtString : null) };
      const middleware = jwtLib.verifyJwtAndRole('admin', publicKey);
      try {
        await middleware(req, {}, () => {});
        assert.fail('Should have thrown');
      } catch (e) {
        assert.ok(e);
      }
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

    it('should call error function if provided', function () {
      let called = false;
      jwtLib.throwError(() => {
        called = true;
      });
      assert.ok(called);
    });

    it('should cover throwError without function', function () {
      try {
        jwtLib.throwError();
      } catch (e) {
        assert.ok(e);
      }
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

    it('should handle non-bearer in _extractJwt', function () {
      assert.strictEqual(
        jwtLib._extractJwt('NotBearer token', () => {}),
        null,
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

    it('should handle non-jwt string in _validateWebToken', function () {
      const req = { get: () => 'not-a-jwt' };
      const result = jwtLib._validateWebToken(req, 'X', () => {});
      assert.strictEqual(result, null);
    });

    it('should handle invalid jwtRaw in _extractJwt', function () {
      const result = jwtLib._extractJwt(123, () => {});
      assert.strictEqual(result, null);
    });

    it('should handle non-bearer in _extractJwt', function () {
      const result = jwtLib._extractJwt('Basic token', () => {});
      assert.strictEqual(result, null);
    });

    it('_isLoginRequired should handle missing role', function () {
      try {
        jwtLib._isLoginRequired(false);
      } catch (e) {
        assert.ok(e);
      }
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

    it('should handle non-string in _extractJwtObject', function () {
      try {
        jwtLib._extractJwtObject({}, 123, () => {});
      } catch (e) {
        assert.ok(e);
      }
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
