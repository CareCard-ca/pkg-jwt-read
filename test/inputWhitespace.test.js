'use strict';

const assert = require('node:assert/strict');
const { jwtCreateSignedToken } = require('@carecard/auth-util');
const {
  jwtReadApplicationToken,
  jwtValidateAndExtract,
  jwtValidateAndExtractWebToken,
  jwtGetClientId,
} = require('..');
const { signingJwk, verificationJwks } = require('./keys/keys');

function createToken() {
  const now = Math.floor(Date.now() / 1000);
  return jwtCreateSignedToken(
    { sub: 'account-one', aud: 'product-one', roles: [], iat: now, exp: now + 60 },
    signingJwk,
  );
}

describe('Canonical whitespace at public token boundaries', () => {
  it('accepts outer whitespace around a signed application proof', () => {
    const result = jwtReadApplicationToken(
      `\t ${createToken()} \r\n`,
      verificationJwks,
      'product-one',
    );
    assert.equal(result?.payload.sub, 'account-one');
  });

  it('normalizes bearer and custom-header token padding without changing the authenticated subject', () => {
    const token = createToken();
    const bearer = { get: () => `\t Bearer \t ${token} \r\n` };
    jwtValidateAndExtract(bearer, verificationJwks);
    assert.equal(jwtGetClientId(bearer), 'account-one');
    const custom = { get: () => `\t ${token} \r\n` };
    jwtValidateAndExtractWebToken(custom, verificationJwks, 'X-Token');
    assert.equal(jwtGetClientId(custom), 'account-one');
  });

  it('rejects extra words and internal token whitespace instead of discarding them', () => {
    const token = createToken();
    for (const authorization of [`Bearer ${token} extra`, `Bearer ${token.replace('.', '. ')}`]) {
      assert.throws(() => jwtValidateAndExtract({ get: () => authorization }, verificationJwks));
    }
  });
});
