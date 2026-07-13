'use strict';

const assert = require('assert');
const { readFileSync } = require('fs');
const { describe, it } = require('mocha');

const EMAIL_CONFIRMATION_CONTRACT =
  'Server-auth email confirmation claims are copied only when present. The emailVerified, email_verified, emailConfirmed, and email_confirmed aliases retain their exact names and values, and omission remains omission.';
const CONTRACT_DOCUMENTATION_PATHS = ['readme.md', '.agents/skills/pkg-jwt-read-jwt-middleware-library/SKILL.md'];

describe('Server-auth email confirmation documentation', function () {
  it('documents exact confirmation claim preservation in the README and package skill', function () {
    for (const documentationPath of CONTRACT_DOCUMENTATION_PATHS) {
      const documentation = readFileSync(documentationPath, 'utf8').replace(/`/g, '').replace(/\s+/g, ' ');

      assert.ok(documentation.includes(EMAIL_CONFIRMATION_CONTRACT), `${documentationPath} must document the confirmation contract`);
    }
  });
});
