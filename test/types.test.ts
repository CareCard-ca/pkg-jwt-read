import assert from 'assert';
import {describe, it} from 'mocha';
import {getNameOfRole, getCodeOfRole, jwtClientId, isJwtExpired} from '../index';

describe('pkg-jwt-read TypeScript Type Definitions', () => {
    it('should verify role mapping functions', () => {
        assert.strictEqual(getNameOfRole('ad'), 'admin');
        assert.strictEqual(getCodeOfRole('admin'), 'ad');
    });

    it('should verify jwt utility types', () => {
        assert.strictEqual(typeof jwtClientId, 'function');
        assert.strictEqual(typeof isJwtExpired, 'function');
    });

    it('should verify that functions return expected types', () => {
        const dummyReq = {
            jwt: {
                payload: {
                    client_id: '123',
                    exp: Math.floor(Date.now() / 1000) + 3600
                }
            }
        };
        assert.strictEqual(jwtClientId(dummyReq), '123');
        assert.strictEqual(isJwtExpired(dummyReq), false);
    });
});
