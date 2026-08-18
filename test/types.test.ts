import assert from 'assert';
import { describe, it } from 'mocha';
import {
  AuthenticatedRequest,
  DEFAULT_USER_AUTHORIZATION_HEADER_NAME,
  DEFAULT_USER_AUTHORIZATION_MAX_TOKEN_LENGTH,
  doesJwtUserHasRole,
  getCodeOfRole,
  getNameOfRole,
  isJwtExpired,
  jwtAgeInSeconds,
  jwtClientId,
  JwtContext,
  JwtRequestContext,
  jwtGetAgeInSeconds,
  jwtGetClientId,
  jwtGetContext,
  jwtGetRoleCode,
  jwtGetRoleName,
  jwtGetVisitorClientId,
  jwtIsExpired,
  jwtValidateAndExtract,
  jwtValidateAndExtractNoThrow,
  jwtValidateAndExtractOrServerAuth,
  jwtValidateAndExtractService,
  jwtValidateAndExtractUserAuthorization,
  jwtValidateAndExtractUserAuthorizationNoThrow,
  jwtValidateAndExtractVisitorNoThrow,
  jwtValidateAndExtractWebToken,
  jwtValidateAndExtractWebTokenNoThrow,
  jwtVerify,
  jwtVerifyAndHasRole,
  jwtVerifyNoThrow,
  jwtVerifyOrServerAuth,
  jwtVerifyOrServerAuthAndHasRole,
  jwtVerifyService,
  jwtVerifyUserAuthorization,
  jwtVerifyUserAuthorizationNoThrow,
  jwtVerifyVisitorNoThrow,
  jwtVerifyWebToken,
  jwtVerifyWebTokenNoThrow,
  throwUsedTokenError,
  UserAuthorizationPayload,
  UserAuthorizationReadOptions,
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

  it('should verify exported user authorization header defaults', () => {
    const headerName: 'X-Authorization-Context' = DEFAULT_USER_AUTHORIZATION_HEADER_NAME;
    const maxTokenLength: 2048 = DEFAULT_USER_AUTHORIZATION_MAX_TOKEN_LENGTH;

    assert.strictEqual(headerName, 'X-Authorization-Context');
    assert.strictEqual(maxTokenLength, 2048);
  });

  it('should verify new jwt utility names', () => {
    const issuedAt = Math.floor(Date.now() / 1000) - 10;
    const request: JwtRequestContext = {
      jwt: { payload: { exp: issuedAt + 60, iat: issuedAt, sub: 'typed-user' } },
      visitor: { payload: { sub: 'typed-visitor' } },
    };

    assert.strictEqual(jwtClientId(request), 'typed-user');
    assert.strictEqual(jwtGetClientId(request), 'typed-user');
    assert.strictEqual(jwtGetVisitorClientId(request), 'typed-visitor');
    assert.strictEqual(jwtIsExpired(request), false);
    assert.ok(jwtGetAgeInSeconds(request) >= 10);
    assert.strictEqual(jwtGetRoleName('ad'), 'admin');
    assert.strictEqual(jwtGetRoleCode('admin'), 'ad');
  });

  it('should verify new middleware creator names', () => {
    const publicKey = 'dummy-key';
    assert.strictEqual(typeof jwtVerify(publicKey), 'function');
    assert.strictEqual(typeof jwtVerifyWebToken(publicKey, 'X-Token'), 'function');
    assert.strictEqual(typeof jwtVerifyNoThrow(publicKey), 'function');
    assert.strictEqual(typeof jwtVerifyWebTokenNoThrow(publicKey, 'X-Token'), 'function');
    assert.strictEqual(typeof jwtVerifyVisitorNoThrow(publicKey), 'function');
    assert.strictEqual(typeof jwtVerifyAndHasRole('admin', publicKey), 'function');
    assert.strictEqual(
      typeof jwtVerifyOrServerAuth(publicKey, () => ({ userId: '123' })),
      'function',
    );
    assert.strictEqual(
      typeof jwtVerifyOrServerAuthAndHasRole('admin', publicKey, () => ({ userId: '123' })),
      'function',
    );
    assert.strictEqual(
      typeof jwtVerifyService(publicKey, 'ms-auth', 'ms-institutions'),
      'function',
    );
    assert.strictEqual(typeof jwtVerifyUserAuthorization(publicKey), 'function');
    assert.strictEqual(typeof jwtVerifyUserAuthorizationNoThrow(publicKey), 'function');
  });

  it('should execute validateAndExtract contracts', async () => {
    const optionalRequest = createAuthenticatedRequest();
    jwtValidateAndExtractNoThrow(optionalRequest, 'invalid-public-key');
    jwtValidateAndExtractWebTokenNoThrow(optionalRequest, 'invalid-public-key', 'X-Token');
    jwtValidateAndExtractVisitorNoThrow(optionalRequest, 'invalid-public-key');
    jwtValidateAndExtractUserAuthorizationNoThrow(optionalRequest, 'invalid-public-key');
    assert.strictEqual(optionalRequest.jwt, null);
    assert.strictEqual(optionalRequest.visitor, null);
    assert.strictEqual(optionalRequest.userAuthorization, null);

    assert.throws(() => jwtValidateAndExtract(createAuthenticatedRequest(), 'invalid-public-key'));
    assert.throws(() =>
      jwtValidateAndExtractWebToken(createAuthenticatedRequest(), 'invalid-public-key', 'X-Token'),
    );
    assert.throws(() =>
      jwtValidateAndExtractService(
        createAuthenticatedRequest(),
        'invalid-public-key',
        'ms-auth',
        'ms-search',
      ),
    );
    assert.throws(() =>
      jwtValidateAndExtractUserAuthorization(createAuthenticatedRequest(), 'invalid-public-key'),
    );

    const serverAuthRequest = createAuthenticatedRequest({ Authorization: 'Bearer opaque-token' });
    await jwtValidateAndExtractOrServerAuth(serverAuthRequest, 'invalid-public-key', () => ({
      userId: 'typed-user',
      valid: true,
    }));
    assert.strictEqual(serverAuthRequest.jwt?.payload.sub, 'typed-user');
  });

  it('should verify jwt utility types', () => {
    const request: JwtRequestContext = {
      jwt: {
        payload: {
          exp: Math.floor(Date.now() / 1000) + 60,
          iat: Math.floor(Date.now() / 1000),
          sub: 'legacy-user',
        },
      },
      visitor: { payload: { sub: 'legacy-visitor' } },
    };
    assert.strictEqual(jwtClientId(request), 'legacy-user');
    assert.strictEqual(visitorClientId(request), 'legacy-visitor');
    assert.strictEqual(isJwtExpired(request), false);
    assert.ok(jwtAgeInSeconds(request) >= 0);
  });

  it('should verify that functions return expected types', () => {
    const dummyReq: JwtRequestContext = {
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
    };

    assert.strictEqual(jwtClientId(dummyReq), '123');
    assert.strictEqual(isJwtExpired(dummyReq), false);
    assert.strictEqual(jwtAgeInSeconds(dummyReq), 3600);
    assert.strictEqual(doesJwtUserHasRole(dummyReq, 'admin'), true);
    assert.strictEqual(doesJwtUserHasRole(dummyReq, 'user'), false);
  });

  it('should verify visitor functions', () => {
    const dummyReq: JwtRequestContext = {
      visitor: {
        header: {},
        payload: {
          sub: 'visitor-123',
        },
        visitorClientId: () => 'visitor-123',
      },
    };

    assert.strictEqual(visitorClientId(dummyReq), 'visitor-123');
  });

  it('should verify user authorization request types', () => {
    const userAuthorizationPayload: UserAuthorizationPayload = {
      typ: 'carecard.authorization-context.scoped.v1',
      iss: 'ms-institutions',
      aud: 'ms-documents',
      sub: '6f4cb7f4-2c2a-4a91-9b56-3e5389703d42',
      schema: 'documents',
      table: 'documents',
      actions: ['read'],
      scopeType: 'self',
      scopeId: '6f4cb7f4-2c2a-4a91-9b56-3e5389703d42',
      authzVersion: '1',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300,
      jti: '9c84c2e2-5b27-4c0d-bd1a-0fb56304a2b8',
    };
    const options: UserAuthorizationReadOptions = {
      userAuthorization: {
        publicKey: 'public-key',
        expectedType: 'carecard.authorization-context.scoped.v1',
        expectedIssuer: 'ms-institutions',
        expectedAudience: 'ms-documents',
      },
    };
    const dummyReq: JwtRequestContext = {
      userAuthorization: {
        header: {},
        payload: userAuthorizationPayload,
      },
    };

    assert.strictEqual(dummyReq.userAuthorization?.payload.table, 'documents');
    assert.strictEqual(options.userAuthorization?.headerName, undefined);
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
    const adminUserId = '85b3560f-2f26-4371-9f13-e4d8ba1ea581';
    const regularUserId = '6f4cb7f4-2c2a-4a91-9b56-3e5389703d42';
    const scopedUserId = '7a97e8e1-f2f3-4074-a182-12a64c5d4f79';

    const adminReq: JwtRequestContext = {
      jwt: { payload: { sub: adminUserId, roles: ['ad'] } },
    };
    const adminContext: JwtContext = jwtGetContext(adminReq);
    assert.strictEqual(adminContext.user_id, adminUserId);
    assert.strictEqual(adminContext.role, 'super_admin');

    const userReq: JwtRequestContext = {
      jwt: { payload: { sub: regularUserId, roles: ['provider'] } },
    };
    const userContext: JwtContext = jwtGetContext(userReq);
    assert.strictEqual(userContext.user_id, regularUserId);
    assert.strictEqual(userContext.role, undefined);

    const scopedReq: JwtRequestContext = {
      jwt: { payload: { sub: scopedUserId, roles: ['provider'] } },
      userAuthorization: {
        header: {},
        payload: {
          typ: 'carecard.authorization-context.scoped.v1',
          sub: '6f4cb7f4-2c2a-4a91-9b56-3e5389703d42',
          schema: 'documents',
          table: 'documents',
          actions: ['read'],
          scopeType: 'self',
          scopeId: '6f4cb7f4-2c2a-4a91-9b56-3e5389703d42',
        },
      },
    };
    const scopedContext: JwtContext = jwtGetContext(scopedReq);
    assert.strictEqual(scopedContext.user_id, scopedUserId);
    assert.strictEqual(scopedContext.authorizationContext?.table, 'documents');
    assert.strictEqual(scopedContext.userAuthorization?.payload.scopeType, 'self');
  });

  it('should verify throwUsedTokenError', () => {
    assert.throws(() => throwUsedTokenError(), /Used_Token/);
  });

  it('should preserve legacy role mapping behavior', () => {
    assert.strictEqual(getNameOfRole('su'), 'super_admin');
    assert.strictEqual(getCodeOfRole('super_admin'), 'su');
  });

  it('should leave optional missing authentication unauthenticated', () => {
    const request = createAuthenticatedRequest();
    jwtValidateAndExtractNoThrow(request, 'invalid-public-key');
    assert.strictEqual(request.jwt, null);
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

function createAuthenticatedRequest(headers: Record<string, string> = {}): AuthenticatedRequest {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]),
  );
  return {
    get(name: string) {
      return normalizedHeaders[name.toLowerCase()] ?? undefined;
    },
  } as unknown as AuthenticatedRequest;
}
