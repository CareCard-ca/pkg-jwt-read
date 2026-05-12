import assert from 'assert';
import { describe, it } from 'mocha';
import {
  AuthenticatedRequest,
  doesJwtUserHasRole,
  getCodeOfRole,
  getNameOfRole,
  isJwtExpired,
  jwtAgeInSeconds,
  jwtClientId,
  JwtContext,
  jwtGetAgeInSeconds,
  jwtGetClientId,
  jwtGetContext,
  jwtGetRoleCode,
  jwtGetRoleName,
  jwtGetVisitorClientId,
  jwtIsExpired,
  jwtValidateAndExtract,
  jwtValidateAndExtractNoThrow,
  jwtValidateAndExtractVisitorNoThrow,
  jwtValidateAndExtractWebToken,
  jwtValidateAndExtractWebTokenNoThrow,
  jwtVerify,
  jwtVerifyAndHasRole,
  jwtVerifyNoThrow,
  jwtVerifyVisitorNoThrow,
  jwtVerifyWebToken,
  jwtVerifyWebTokenNoThrow,
  throwUsedTokenError,
  verifyJwt,
  verifyJwtAndRole,
  verifyJwtNoThrow,
  verifyVisitorNoThrow,
  verifyWebToken,
  verifyWebTokenNoThrow,
  visitorClientId,
} from '../index';

describe('TypeScript Type Definitions - JWT Read Utilities', () => {
  it('should verify role mapping functions', () => {
    assert.strictEqual(getNameOfRole('ad'), 'admin');
    assert.strictEqual(getCodeOfRole('admin'), 'ad');
  });

  it('should verify new jwt utility names', () => {
    assert.strictEqual(typeof jwtClientId, 'function');
    assert.strictEqual(typeof jwtGetClientId, 'function');
    assert.strictEqual(typeof jwtGetVisitorClientId, 'function');
    assert.strictEqual(typeof jwtIsExpired, 'function');
    assert.strictEqual(typeof jwtGetAgeInSeconds, 'function');
    assert.strictEqual(typeof jwtGetRoleName, 'function');
    assert.strictEqual(typeof jwtGetRoleCode, 'function');
  });

  it('should verify new middleware creator names', () => {
    const publicKey = 'dummy-key';
    assert.strictEqual(typeof jwtVerify(publicKey), 'function');
    assert.strictEqual(typeof jwtVerifyWebToken(publicKey, 'X-Token'), 'function');
    assert.strictEqual(typeof jwtVerifyNoThrow(publicKey), 'function');
    assert.strictEqual(typeof jwtVerifyWebTokenNoThrow(publicKey, 'X-Token'), 'function');
    assert.strictEqual(typeof jwtVerifyVisitorNoThrow(publicKey), 'function');
    assert.strictEqual(typeof jwtVerifyAndHasRole('admin', publicKey), 'function');
  });

  it('should verify new validateAndExtract names', () => {
    assert.strictEqual(typeof jwtValidateAndExtract, 'function');
    assert.strictEqual(typeof jwtValidateAndExtractWebToken, 'function');
    assert.strictEqual(typeof jwtValidateAndExtractNoThrow, 'function');
    assert.strictEqual(typeof jwtValidateAndExtractWebTokenNoThrow, 'function');
    assert.strictEqual(typeof jwtValidateAndExtractVisitorNoThrow, 'function');
  });

  it('should verify jwt utility types', () => {
    assert.strictEqual(typeof jwtClientId, 'function');
    assert.strictEqual(typeof visitorClientId, 'function');
    assert.strictEqual(typeof isJwtExpired, 'function');
    assert.strictEqual(typeof jwtAgeInSeconds, 'function');
  });

  it('should verify that functions return expected types', () => {
    const dummyReq: AuthenticatedRequest = {
      jwt: {
        header: {},
        payload: {
          sub: '123',
          exp: Math.floor(Date.now() / 1000) + 3600,
          iat: Math.floor(Date.now() / 1000) - 3600,
          roles: ['admin'],
        },
        jwtClientId: () => '123',
        doesJwtUserHasRole: (role: string) => role === 'admin',
        isJwtExpired: () => false,
        jwtAgeInSeconds: () => 3600,
      },
    } as any;

    assert.strictEqual(jwtClientId(dummyReq), '123');
    assert.strictEqual(isJwtExpired(dummyReq), false);
    assert.strictEqual(jwtAgeInSeconds(dummyReq), 3600);
    assert.strictEqual(doesJwtUserHasRole(dummyReq, 'admin'), true);
    assert.strictEqual(doesJwtUserHasRole(dummyReq, 'user'), false);
  });

  it('should verify visitor functions', () => {
    const dummyReq: AuthenticatedRequest = {
      visitor: {
        header: {},
        payload: {
          sub: 'visitor-123',
        },
        visitorClientId: () => 'visitor-123',
      },
    } as any;

    assert.strictEqual(visitorClientId(dummyReq), 'visitor-123');
  });

  it('should verify middleware creator types', () => {
    const publicKey = 'dummy-key';
    assert.strictEqual(typeof verifyJwt(publicKey), 'function');
    assert.strictEqual(typeof verifyWebToken(publicKey, 'X-Token'), 'function');
    assert.strictEqual(typeof verifyJwtNoThrow(publicKey), 'function');
    assert.strictEqual(typeof verifyWebTokenNoThrow(publicKey, 'X-Token'), 'function');
    assert.strictEqual(typeof verifyVisitorNoThrow(publicKey), 'function');
    assert.strictEqual(typeof verifyJwtAndRole('admin', publicKey), 'function');
  });

  it('should verify jwtGetContext types and behavior', () => {
    assert.strictEqual(typeof jwtGetContext, 'function');

    const adminReq: AuthenticatedRequest = {
      jwt: { payload: { sub: 'user-1', roles: ['ad'] } },
    } as any;
    const adminContext: JwtContext = jwtGetContext(adminReq);
    assert.strictEqual(adminContext.user_id, 'user-1');
    assert.strictEqual(adminContext.role, 'super_admin');

    const userReq: AuthenticatedRequest = {
      jwt: { payload: { sub: 'user-2', roles: ['provider'] } },
    } as any;
    const userContext: JwtContext = jwtGetContext(userReq);
    assert.strictEqual(userContext.user_id, 'user-2');
    assert.strictEqual(userContext.role, undefined);
  });

  it('should verify throwUsedTokenError', () => {
    assert.throws(() => throwUsedTokenError(), /Used_Token/);
  });

  it('should verify throwError', () => {
    // throwError removed
  });

  it('should verify validateAndExtract functions', () => {
    // validateAndExtractJwtObject removed
  });

  it('should verify doesJwtUserHasRole overloads', () => {
    const dummyReq = {
      jwt: {
        payload: {
          roles: ['admin'],
        },
      },
    };
    // Test with two arguments (req, role)
    assert.strictEqual(doesJwtUserHasRole(dummyReq, 'admin'), true);
    assert.strictEqual(doesJwtUserHasRole(dummyReq, 'user'), false);
  });

  it('should verify isJwtExpired overloads', () => {
    const dummyReq = {
      jwt: {
        payload: {
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      },
    };
    assert.strictEqual(isJwtExpired(dummyReq), false);
    assert.strictEqual(isJwtExpired(dummyReq, 1800), false);

    // Test with bound context
    const boundIsJwtExpired = isJwtExpired.bind(dummyReq.jwt);
    assert.strictEqual(boundIsJwtExpired(1800), false);
    assert.strictEqual(boundIsJwtExpired(), false);
  });
});
