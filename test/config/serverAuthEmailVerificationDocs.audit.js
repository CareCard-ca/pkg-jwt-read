'use strict';

const assert = require('assert');
const { readFileSync } = require('fs');
const { describe, it } = require('mocha');

const EMAIL_VERIFICATION_CONTRACT =
  'Server-auth email verification claims are copied only when present. The emailVerified and email_verified names retain their exact values, and omission remains omission.';
const CONTRACT_DOCUMENTATION_PATHS = [
  'readme.md',
  '.agents/skills/pkg-jwt-read-jwt-middleware-library/SKILL.md',
];

describe('Server-auth email verification documentation', function () {
  it('documents exact verification claim preservation in the README and package skill', function () {
    for (const documentationPath of CONTRACT_DOCUMENTATION_PATHS) {
      const documentation = readFileSync(documentationPath, 'utf8')
        .replace(/`/g, '')
        .replace(/\s+/g, ' ');

      assert.ok(
        documentation.includes(EMAIL_VERIFICATION_CONTRACT),
        `${documentationPath} must document the verification contract`,
      );
    }
  });
});
