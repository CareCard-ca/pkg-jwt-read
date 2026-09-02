'use strict';

const { createHash, generateKeyPairSync } = require('node:crypto');
const { parseJwtSigningJwk, parseJwtVerificationJwks } = require('@carecard/auth-util');

function createJwkIdentity() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const privateJwk = privateKey.export({ format: 'jwk' });
  const publicJwk = publicKey.export({ format: 'jwk' });
  const canonical = JSON.stringify({ crv: 'Ed25519', kty: 'OKP', x: publicJwk.x });
  const kid = createHash('sha256').update(canonical).digest('base64url');
  return {
    signing: { ...privateJwk, alg: 'EdDSA', use: 'sig', key_ops: ['sign'], kid },
    verification: { ...publicJwk, alg: 'EdDSA', use: 'sig', key_ops: ['verify'], kid },
  };
}

const identity = createJwkIdentity();
const signingJwk = parseJwtSigningJwk(JSON.stringify(identity.signing));
const verificationJwks = parseJwtVerificationJwks(
  JSON.stringify({ keys: [identity.verification] }),
);

module.exports = {
  createJwkIdentity,
  signingJwk,
  verificationJwks,
};
