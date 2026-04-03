const assert = require( 'assert' ).strict;
const { describe, it } = require( 'mocha' );
const jwtUtilAuthFromFile = require( '../lib/jwtUtilAuth' )


const keys = require( './keys/keys' );
const { generateKeyPair } = require( '../lib/keyGen' );

describe( 'JwtUtilAuth test', function () {
    describe( 'createSignedJwtFromObject', function () {
        it( 'should return a valid signed JWT with exp and correct iat', function () {
            const header = { alg: 'EdDSA' };
            const payload = {
                sub: '1234567890',
                name: 'John Doe',
                iat: 1516239022000, // ms
                exp: 1516242622000, // ms
                nbf: 1516239022000, // ms
                auth_time: 1516239022000 // ms
            };
            const privateKey = keys.privateKey;

            const jwt = jwtUtilAuthFromFile.createSignedJwtFromObject( header, payload, privateKey );
            assert.ok( jwt );

            const { header: decodedHeader, payload: decodedPayload } = jwtUtilAuthFromFile.getHeaderPayloadFromJwt( jwt );
            assert.strictEqual( decodedHeader.alg, 'EdDSA' );
            assert.strictEqual( decodedPayload.sub, '1234567890' );
            assert.strictEqual( decodedPayload.iat, 1516239022 ); // converted to seconds
            assert.strictEqual( decodedPayload.exp, 1516242622 ); // converted to seconds
            assert.strictEqual( decodedPayload.nbf, 1516239022 ); // converted to seconds
            assert.strictEqual( decodedPayload.auth_time, 1516239022 ); // converted to seconds
            assert.ok( decodedPayload.exp > decodedPayload.iat );
        } );

        it( 'should return null when error occurs (circular reference)', function () {
            const circular = {};
            circular.self = circular;
            const result = jwtUtilAuthFromFile.createSignedJwtFromObject( {}, circular, keys.privateKey );
            assert.strictEqual( result, null );
        } );

        it( 'should return null when privateKey is missing', function () {
            const result = jwtUtilAuthFromFile.createSignedJwtFromObject( {}, {}, null );
            assert.strictEqual( result, null );
        } );

        it( 'should return a valid signed JWT with RSA algorithm', function () {
            const { privateKey: rsaPrivateKey, publicKey: rsaPublicKey } = generateKeyPair( 'rsa' );
            const header = { alg: 'sha256' };
            const payload = { sub: '123' };
            const jwt = jwtUtilAuthFromFile.createSignedJwtFromObject( header, payload, rsaPrivateKey );
            assert.ok( jwt );
            assert.ok( jwtUtilAuthFromFile.verifyJwtSignature( jwt, rsaPublicKey ) );
        } );
    } );

    describe( 'verifyJwtSignature', function () {
        it( 'should return true for valid signature', function () {
            const header = { alg: 'EdDSA' };
            const payload = { sub: '1234567890' };
            const jwt = jwtUtilAuthFromFile.createSignedJwtFromObject( header, payload, keys.privateKey );

            const isValid = jwtUtilAuthFromFile.verifyJwtSignature( jwt, keys.publicKey );
            assert.strictEqual( isValid, true );
        } );

        it( 'should return false when error occurs (invalid header format)', function () {
            const result = jwtUtilAuthFromFile.verifyJwtSignature( 'not-base64.payload.sig', keys.publicKey );
            assert.strictEqual( result, false );
        } );

        it( 'should return false if jwt has invalid number of parts', function () {
            const result = jwtUtilAuthFromFile.verifyJwtSignature( 'one.two', keys.publicKey );
            assert.strictEqual( result, false );
        } );
    } );

    describe( 'getHeaderPayloadFromJwt', function () {
        it( 'should return header and payload for valid JWT', function () {
            const header = { alg: 'EdDSA' };
            const payload = { sub: '1234567890' };
            const jwt = jwtUtilAuthFromFile.createSignedJwtFromObject( header, payload, keys.privateKey );
            
            const result = jwtUtilAuthFromFile.getHeaderPayloadFromJwt( jwt );
            assert.strictEqual( result.header.alg, 'EdDSA' );
            assert.strictEqual( result.payload.sub, '1234567890' );
        } );

        it( 'should return null when error occurs (invalid JSON in header)', function () {
            const result = jwtUtilAuthFromFile.getHeaderPayloadFromJwt( 'bm90LWpzb24.payload.sig' ); // 'bm90LWpzb24' is 'not-json'
            assert.strictEqual( result, null );
        } );

        it( 'should return null when input is not a string', function () {
            const result = jwtUtilAuthFromFile.getHeaderPayloadFromJwt( null );
            assert.strictEqual( result, null );
        } );
    } );

    describe( 'Internal functions', function () {
        it( '_normalizePayload should normalize timestamps', function () {
            const payload = {
                iat: 1516239022000,
                exp: 1516242622000,
                nbf: 1516239022000,
                auth_time: 1516239022000
            };
            const normalized = jwtUtilAuthFromFile._normalizePayload( payload );
            assert.strictEqual( normalized.iat, 1516239022 );
            assert.strictEqual( normalized.exp, 1516242622 );
            assert.strictEqual( normalized.nbf, 1516239022 );
            assert.strictEqual( normalized.auth_time, 1516239022 );
        } );

        it( '_normalizePayload should set iat and exp if missing', function () {
            const payload = {};
            const normalized = jwtUtilAuthFromFile._normalizePayload( payload );
            assert.ok( normalized.iat );
            assert.strictEqual( normalized.exp, normalized.iat + 3600 );
        } );

        it( '_encode and _decode should be inverses', function () {
            const obj = { foo: 'bar' };
            const encoded = jwtUtilAuthFromFile._encode( obj );
            const decoded = jwtUtilAuthFromFile._decode( encoded );
            assert.deepStrictEqual( decoded, obj );
        } );

        it( '_sign and _verify should work for EdDSA', function () {
            const token = 'header.payload';
            const sig = jwtUtilAuthFromFile._sign( token, 'EdDSA', keys.privateKey );
            const isValid = jwtUtilAuthFromFile._verify( token, sig, 'EdDSA', keys.publicKey );
            assert.strictEqual( isValid, true );
        } );

        it( '_sign and _verify should work for RSA (sha256)', function () {
            const { privateKey: rsaPrivateKey, publicKey: rsaPublicKey } = generateKeyPair( 'rsa' );
            const token = 'header.payload';
            const sig = jwtUtilAuthFromFile._sign( token, 'sha256', rsaPrivateKey );
            const isValid = jwtUtilAuthFromFile._verify( token, sig, 'sha256', rsaPublicKey );
            assert.strictEqual( isValid, true );
        } );
    } );
} );
