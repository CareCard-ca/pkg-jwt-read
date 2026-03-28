const { describe, it } = require( "mocha" );
const assert = require( "assert" );
const jwtLib = require( '../lib/jwtLib' );
const { jwtUtilAuth } = require( '@carecard/auth-util' );
const { publicKey, privateKey } = require( "./keys" );

describe( "Attached JWT methods", function () {

    const jwtString = jwtUtilAuth.createSignedJwtFromObject(
        { alg: 'EdDSA' },
        { iat: Math.floor(Date.now() / 1000) - 100, sub: 'test-client', roles: ['admin'] },
        privateKey
    );

    it( "should call attached methods on req.jwt", async function () {
        const req = {};
        await jwtLib._extractJwtObject( req, jwtString );

        assert.strictEqual( typeof req.jwt.jwtClientId, 'function' );
        assert.strictEqual( req.jwt.jwtClientId(), 'test-client' );
        assert.strictEqual( req.jwt.doesJwtUserHasRole('admin'), true );
        assert.strictEqual( req.jwt.doesJwtUserHasRole('user'), false );
        assert.strictEqual( req.jwt.isJwtExpired(3600), false );
        assert.ok( req.jwt.jwtAgeInSeconds() >= 100 );
    } );

    it( "should call attached methods on req.visitor", async function () {
        const req = {
            get(header) {
                if (header === 'Visitor') return 'Bearer ' + jwtString;
            }
        };
        const middleware = jwtLib.verifyVisitorNoThrow( publicKey );
        await middleware( req, {}, () => {} );

        assert.strictEqual( typeof req.visitor.visitorClientId, 'function' );
        assert.strictEqual( req.visitor.visitorClientId(), 'test-client' );
    } );

    it( "attached methods should be non-enumerable", async function () {
        const req = {};
        await jwtLib._extractJwtObject( req, jwtString );

        const keys = Object.keys(req.jwt);
        assert.ok(!keys.includes('jwtClientId'));
        assert.ok(!keys.includes('doesJwtUserHasRole'));
        assert.ok(!keys.includes('isJwtExpired'));
        assert.ok(!keys.includes('jwtAgeInSeconds'));
    } );
} );
