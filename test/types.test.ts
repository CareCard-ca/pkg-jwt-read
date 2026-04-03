import assert from 'assert';
import {describe, it} from 'mocha';
import {
    getNameOfRole,
    getCodeOfRole,
    jwtClientId,
    visitorClientId,
    isJwtExpired,
    jwtAgeInSeconds,
    doesJwtUserHasRole,
    verifyJwt,
    verifyWebToken,
    verifyJwtNoThrow,
    verifyWebTokenNoThrow,
    verifyVisitorNoThrow,
    verifyJwtAndRole,
    throwUsedTokenError,
    AuthenticatedRequest
} from '../index';


describe('TypeScript Type Definitions - JWT Read Utilities', () => {
    it('should verify role mapping functions', () => {
        assert.strictEqual(getNameOfRole('ad'), 'admin');
        assert.strictEqual(getCodeOfRole('admin'), 'ad');
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
                    roles: ['admin']
                },
                jwtClientId: () => '123',
                doesJwtUserHasRole: (role: string) => role === 'admin',
                isJwtExpired: () => false,
                jwtAgeInSeconds: () => 3600
            }
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
                    sub: 'visitor-123'
                },
                visitorClientId: () => 'visitor-123'
            }
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

    it('should verify throwUsedTokenError', () => {
        assert.throws(() => throwUsedTokenError(), /Used_Token/);
    });

    it('should verify doesJwtUserHasRole overloads', () => {
        const dummyReq = {
            jwt: {
                payload: {
                    roles: ['admin']
                }
            }
        };
        // Test with two arguments (req, role)
        assert.strictEqual(doesJwtUserHasRole(dummyReq, 'admin'), true);
        assert.strictEqual(doesJwtUserHasRole(dummyReq, 'user'), false);
    });

    it('should verify isJwtExpired overloads', () => {
        const dummyReq = {
            jwt: {
                payload: {
                    exp: Math.floor(Date.now() / 1000) + 3600
                }
            }
        };
        assert.strictEqual(isJwtExpired(dummyReq), false);
        assert.strictEqual(isJwtExpired(dummyReq, 1800), false);
    });
});
