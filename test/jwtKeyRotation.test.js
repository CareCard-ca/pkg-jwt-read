'use strict';
const assert = require('node:assert/strict');
const { describe, it } = require('mocha');
const {
  jwtCreateSignedToken,
  parseJwtSigningJwk,
  parseJwtVerificationJwks,
} = require('@carecard/auth-util');
const { jwtReadVerifiedToken } = require('..');
const { createJwkIdentity } = require('./keys/keys');
describe('verification key rotation', () => {
  it('accepts retained keys and rejects removed keys', () => {
    const active = createJwkIdentity(),
      retiring = createJwkIdentity();
    const token = jwtCreateSignedToken(
      { sub: 'subject' },
      parseJwtSigningJwk(JSON.stringify(retiring.signing)),
    );
    const keys = parseJwtVerificationJwks(
      JSON.stringify({ keys: [active.verification, retiring.verification] }),
    );
    assert.equal(jwtReadVerifiedToken(token, keys).payload.sub, 'subject');
    assert.equal(
      jwtReadVerifiedToken(
        token,
        parseJwtVerificationJwks(JSON.stringify({ keys: [active.verification] })),
      ),
      null,
    );
  });
});
