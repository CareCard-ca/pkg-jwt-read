const { describe, it } = require('mocha');
const assert = require('assert');
const jwtRoles = require('../lib/jwtRoles');

describe('Lib jwt Roles', function () {
  describe('getNameOfRoleFromCode', function () {
    it('should return admin for ad', function () {
      assert.strictEqual(jwtRoles.getNameOfRoleFromCode('ad'), 'admin');
    });

    it('should return super_admin for su', function () {
      assert.strictEqual(jwtRoles.getNameOfRoleFromCode('su'), 'super_admin');
    });

    it('should return empty string for unknown code', function () {
      assert.strictEqual(jwtRoles.getNameOfRoleFromCode(), '');
      assert.strictEqual(jwtRoles.getNameOfRoleFromCode('unknown'), '');
    });
  });

  describe('getCodeFromNameOfRole', function () {
    it('should return ad for admin', function () {
      assert.strictEqual(jwtRoles.getCodeFromNameOfRole('admin'), 'ad');
    });

    it('should return su for super_admin', function () {
      assert.strictEqual(jwtRoles.getCodeFromNameOfRole('super_admin'), 'su');
    });

    it('should return empty string for unknown name', function () {
      assert.strictEqual(jwtRoles.getCodeFromNameOfRole(), '');
      assert.strictEqual(jwtRoles.getCodeFromNameOfRole('unknown'), '');
    });
  });
});
