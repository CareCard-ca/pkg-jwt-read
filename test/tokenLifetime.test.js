'use strict';

const assert = require('assert').strict;
const { describe, it } = require('mocha');
const { jwtCreateSignedToken } = require('@carecard/auth-util');

const {
  jwtValidateAndExtract,
  jwtValidateAndExtractNoThrow,
  jwtValidateAndExtractVisitorNoThrow,
  jwtValidateAndExtractWebToken,
  jwtVerify,
} = require('../index');
const { privateKey, publicKey } = require('./keys/keys');

describe('JWT lifetime enforcement', function () {
  it('rejects an expired signed token through required and optional bearer boundaries', async function () {
    const token = createToken({ iat: nowSeconds() - 120, exp: nowSeconds() - 60 });
    const requiredRequest = createRequest({ Authorization: `Bearer ${token}` });

    assert.throws(() => jwtValidateAndExtract(requiredRequest, publicKey));
    assert.strictEqual(requiredRequest.jwt, null);

    const optionalRequest = createRequest({ Authorization: `Bearer ${token}` });
    jwtValidateAndExtractNoThrow(optionalRequest, publicKey);
    assert.strictEqual(optionalRequest.jwt, null);

    const middlewareError = await runMiddleware(jwtVerify(publicKey), requiredRequest);
    assert.ok(middlewareError instanceof Error);
  });

  it('rejects signed tokens issued in the future or not yet valid', function () {
    const futureIssuedToken = createToken({
      iat: nowSeconds() + 60,
      exp: nowSeconds() + 120,
    });
    const futureValidityToken = createToken({
      iat: nowSeconds(),
      nbf: nowSeconds() + 60,
      exp: nowSeconds() + 120,
    });

    assert.throws(() =>
      jwtValidateAndExtract(
        createRequest({ Authorization: `Bearer ${futureIssuedToken}` }),
        publicKey,
      ),
    );
    assert.throws(() =>
      jwtValidateAndExtract(
        createRequest({ Authorization: `Bearer ${futureValidityToken}` }),
        publicKey,
      ),
    );
  });

  it('applies the same lifetime rules to custom-header and visitor tokens', function () {
    const expiredToken = createToken({ iat: nowSeconds() - 120, exp: nowSeconds() - 60 });

    assert.throws(() =>
      jwtValidateAndExtractWebToken(
        createRequest({ 'X-Token': expiredToken }),
        publicKey,
        'X-Token',
      ),
    );

    const visitorRequest = createRequest({ Visitor: `Bearer ${expiredToken}` });
    jwtValidateAndExtractVisitorNoThrow(visitorRequest, publicKey);
    assert.strictEqual(visitorRequest.visitor, null);
  });
});

// Pattern: Test Clock Adapter - supplies epoch seconds at the public token boundary.
function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

// Pattern: Test Data Builder - creates signed tokens with caller-controlled lifetime claims.
function createToken(payload) {
  return jwtCreateSignedToken({ alg: 'EdDSA', typ: 'JWT' }, payload, privateKey);
}

// Pattern: Test Double - exposes the Express request header contract used by the package.
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

// Pattern: Async Adapter - observes middleware completion through its public callback.
function runMiddleware(middleware, request) {
  return new Promise(resolve => middleware(request, {}, error => resolve(error)));
}
