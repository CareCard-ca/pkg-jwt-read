const { describe, it } = require('mocha');
const assert = require('assert');
const jwtRoles = require('../lib/jwtRoles');

describe('Lib jwt Roles', function () {
  const adminUserId = '85b3560f-2f26-4371-9f13-e4d8ba1ea581';
  const regularUserId = '6f4cb7f4-2c2a-4a91-9b56-3e5389703d42';
  const alternateUserId = '7a97e8e1-f2f3-4074-a182-12a64c5d4f79';
  const emptyRolesUserId = '2fb4f3e8-d0c4-4ef1-8fdf-606178c57956';
  const noRolesUserId = 'ac84e165-d429-47b0-8938-2307f3bc0e35';
  const serviceUserId = '9d35b053-bc61-4df6-970b-578df3bf45f7';

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
      const req = { jwt: { payload: { sub: adminUserId, roles: ['ad'] } } };
      assert.deepStrictEqual(jwtRoles.getContext(req), { user_id: adminUserId, role: 'super_admin' });
    });

    it('should include verified user authorization context when present', function () {
      const userAuthorization = {
        header: { alg: 'EdDSA', typ: 'JWT' },
        payload: {
          typ: 'carecard.authorization-context.scoped.v1',
          iss: 'ms-institutions',
          aud: 'ms-documents',
          sub: '6f4cb7f4-2c2a-4a91-9b56-3e5389703d42',
          schema: 'carecard',
          table: 'documents',
          actions: ['read'],
          scopeType: 'self',
          scopeId: '6f4cb7f4-2c2a-4a91-9b56-3e5389703d42',
          authzVersion: '1',
          iat: 1791388800,
          exp: 1791389100,
          jti: '53f627e3-1725-4c58-8bc3-8087e229fb97',
        },
      };
      const req = { jwt: { payload: { sub: regularUserId, roles: ['ag'] } }, userAuthorization };

      assert.deepStrictEqual(jwtRoles.getContext(req), {
        user_id: regularUserId,
        authorizationContext: userAuthorization.payload,
        userAuthorization,
      });
    });

    it('should preserve super_admin role when user authorization context is present', function () {
      const userAuthorization = {
        header: { alg: 'EdDSA', typ: 'JWT' },
        payload: {
          typ: 'carecard.authorization-context.scoped.v1',
          sub: '6f4cb7f4-2c2a-4a91-9b56-3e5389703d42',
          schema: 'carecard',
          table: 'documents',
          actions: ['read'],
          scopeType: 'self',
          scopeId: '6f4cb7f4-2c2a-4a91-9b56-3e5389703d42',
        },
      };
      const req = { jwt: { payload: { sub: adminUserId, roles: ['ad'] } }, userAuthorization };

      assert.deepStrictEqual(jwtRoles.getContext(req), {
        user_id: adminUserId,
        role: 'super_admin',
        authorizationContext: userAuthorization.payload,
        userAuthorization,
      });
    });

    it('should not include user authorization context when payload is missing', function () {
      const req = { jwt: { payload: { sub: regularUserId, roles: ['ag'] } }, userAuthorization: { header: {} } };
      assert.deepStrictEqual(jwtRoles.getContext(req), { user_id: regularUserId });
    });

    it('should return super_admin when roles array contains ad among other roles', function () {
      const req = { jwt: { payload: { sub: adminUserId, roles: ['ag', 'ad'] } } };
      assert.deepStrictEqual(jwtRoles.getContext(req), { user_id: adminUserId, role: 'super_admin' });
    });

    it('should return only user_id when roles array does not contain ad', function () {
      const req = { jwt: { payload: { sub: alternateUserId, roles: ['ag'] } } };
      assert.deepStrictEqual(jwtRoles.getContext(req), { user_id: alternateUserId });
    });

    it('should return only user_id when roles array is empty', function () {
      const req = { jwt: { payload: { sub: emptyRolesUserId, roles: [] } } };
      assert.deepStrictEqual(jwtRoles.getContext(req), { user_id: emptyRolesUserId });
    });

    it('should return only user_id when roles is undefined', function () {
      const req = { jwt: { payload: { sub: noRolesUserId } } };
      assert.deepStrictEqual(jwtRoles.getContext(req), { user_id: noRolesUserId });
    });

    it('should not treat su as super_admin', function () {
      const req = { jwt: { payload: { sub: serviceUserId, roles: ['su'] } } };
      assert.deepStrictEqual(jwtRoles.getContext(req), { user_id: serviceUserId });
    });

    it('should handle missing jwt object', function () {
      const req = {};
      assert.deepStrictEqual(jwtRoles.getContext(req), { user_id: undefined });
    });
  });
});
