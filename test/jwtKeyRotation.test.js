'use strict';

const assert = require('node:assert').strict;
const {
  jwtCreateSignedToken,
  parseJwtSigningJwk,
  parseJwtVerificationJwks,
} = require('@carecard/auth-util');
const { jwtValidateAndExtract, jwtValidateAndExtractNoThrow } = require('..');
const { createJwkIdentity } = require('./keys/keys');

function createBearerRequest(token) {
  return {
    get(headerName) {
      return headerName.toLowerCase() === 'authorization' ? `Bearer ${token}` : undefined;
    },
  };
}

describe('JWT verification key rotation', function () {
  it('accepts active and retiring kids and rejects a removed kid', function () {
    const active = createJwkIdentity();
    const retiring = createJwkIdentity();
    const signingJwk = parseJwtSigningJwk(JSON.stringify(retiring.signing));
    const token = jwtCreateSignedToken({ sub: 'retiring-user' }, signingJwk);
    const rotatingJwks = parseJwtVerificationJwks(
      JSON.stringify({ keys: [active.verification, retiring.verification] }),
    );
    const retiredJwks = parseJwtVerificationJwks(JSON.stringify({ keys: [active.verification] }));
    const acceptedRequest = createBearerRequest(token);
    const rejectedRequest = createBearerRequest(token);

    jwtValidateAndExtract(acceptedRequest, rotatingJwks);
    jwtValidateAndExtractNoThrow(rejectedRequest, retiredJwks);

    assert.strictEqual(acceptedRequest.jwt.payload.sub, 'retiring-user');
    assert.strictEqual(rejectedRequest.jwt, null);
  });
});
