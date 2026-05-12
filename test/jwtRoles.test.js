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

  describe('getContext', function () {
    it('should return super_admin role with user_id when roles array contains ad', function () {
      const req = { jwt: { payload: { sub: 'user-1', roles: ['ad'] } } };
      assert.deepStrictEqual(jwtRoles.getContext(req), { user_id: 'user-1', role: 'super_admin' });
    });

    it('should return super_admin when roles array contains ad among other roles', function () {
      const req = { jwt: { payload: { sub: 'user-1', roles: ['ag', 'ad'] } } };
      assert.deepStrictEqual(jwtRoles.getContext(req), { user_id: 'user-1', role: 'super_admin' });
    });

    it('should return only user_id when roles array does not contain ad', function () {
      const req = { jwt: { payload: { sub: 'user-2', roles: ['ag'] } } };
      assert.deepStrictEqual(jwtRoles.getContext(req), { user_id: 'user-2' });
    });

    it('should return only user_id when roles array is empty', function () {
      const req = { jwt: { payload: { sub: 'user-3', roles: [] } } };
      assert.deepStrictEqual(jwtRoles.getContext(req), { user_id: 'user-3' });
    });

    it('should return only user_id when roles is undefined', function () {
      const req = { jwt: { payload: { sub: 'user-4' } } };
      assert.deepStrictEqual(jwtRoles.getContext(req), { user_id: 'user-4' });
    });

    it('should not treat su as super_admin', function () {
      const req = { jwt: { payload: { sub: 'user-5', roles: ['su'] } } };
      assert.deepStrictEqual(jwtRoles.getContext(req), { user_id: 'user-5' });
    });

    it('should handle missing jwt object', function () {
      const req = {};
      assert.deepStrictEqual(jwtRoles.getContext(req), { user_id: undefined });
    });
  });
});
