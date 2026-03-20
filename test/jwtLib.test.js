const { describe, it } = require( "mocha" );
const assert = require( "assert" );
const jwt = require( '../lib/jwtLib' );
const { publicKey, oldPublicKey, privateKey } = require( "./keys" );
const { throwError } = require( "../lib/jwtLib" );
const { jwtUtilAuth } = require( '@carecard/auth-util' );

describe( "Lib controller jwt", function () {

    const jwtStringOld = "eyJhbGciOiJzaGE1MTIiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE2Mzg2NjIzMTQ5OTMsImNsaWVudF9pZCI6IjhiMGRiO" +
        "Dc3LWE2YjMtNGEyMy1hNDkzLWU2ODc5MTVjZGQ4NyIsInJvbGVzIjpbXX0.JmXjeU-D1-V0Wd5upURf1K72iXGuVuq5tUkHp0TqRiN1xwg6" +
        "RUhzB9HqBnsSgOyDt1BFhr-GPZdomPG0YHW8x8eza-46efledv2gl24ZT2uP-X9V70G-UVGcj8qDQZzP7u_ZkCY3SxA3Tzv7s_V6mAzVuBQ" +
        "vm5ga93fh2HwHEoE";

    const jwtString = jwtUtilAuth.createSignedJwtFromObject(
        { alg: 'EdDSA' },
        { iat: 1638662314, client_id: '8b0db877-a6b3-4a23-a493-e687915cdd87', roles: [] },
        privateKey
    );

    const jwtStringBad = "eyJhbGciOiJzaGE1MTIiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE2Mzg2NjIzMTQ5OTMsImNsaWVudF9pZCI6IjhiMGRiO" +
        "Dc3LWE2YjMtNGEyMy1hNDkzLWU2ODVjZGQ4NyIsInJvbGVzIjpbXX0.JmXjeU-D1-V0Wd5upURf1K72iXGuVuq5tUkHp0TqRiN1xwg6" +
        "RUhzB9HqBnsSgOyDt1BFhW8x8eza-46efledv2gl24ZT2uP-X9V70G-UVGcj8qDQZzP7u_ZkCY3SxA3Tzv7s_V6mAzVuBQ" +
        "vm5ga93fh2HwHEoE";

    it( "validateJwt", async function () {

        // Arrange
        const req = {
            get( header ) {
                if ( header === "Authorization" ) {
                    return "Bearer " + jwtString
                }
            }
        };

        // Act
        const receivedJwt = await jwt._validateJwt( req );

        // Assert
        assert.deepStrictEqual( receivedJwt, jwtString );
    } );

    it( "verifyJwtSignature", async function () {

        // Act
        const isSignatureValid = await jwt._isJwtSignatureValid( jwtString, publicKey );

        // Assert
        assert.deepStrictEqual( isSignatureValid, true );
    } );

    it( "verifyJwtSignature (old sha512)", async function () {

        // Act
        const isSignatureValid = await jwt._isJwtSignatureValid( jwtStringOld, oldPublicKey );

        // Assert
        assert.deepStrictEqual( isSignatureValid, true );
    } );

    it( "extractJwtObject", async function () {
        // Arrange
        const req = {
            get( header ) {
                if ( header === "Authorization" ) {
                    return "Bearer " + jwtString
                }
            }
        };

        const expectedJwt = {
            header: { alg: 'EdDSA', typ: 'JWT' },
            payload: {
                iat: 1638662314,
                client_id: '8b0db877-a6b3-4a23-a493-e687915cdd87',
                roles: [],
                exp: 1638662314 + 3600
            }
        }

        // Act
        await jwt._extractJwtObject( req, jwtString );

        // Assert
        assert.deepStrictEqual( req.jwt, expectedJwt );
    } );

    it( "validateAndExtractJwtObject", async function () {

        // Arrange
        const req = {
            get( header ) {
                if ( header === "Authorization" ) {
                    return "Bearer " + jwtString
                }
            }
        };

        const expectedJwt = {
            header: { alg: 'EdDSA', typ: 'JWT' },
            payload: {
                iat: 1638662314,
                client_id: '8b0db877-a6b3-4a23-a493-e687915cdd87',
                roles: [],
                exp: 1638662314 + 3600
            }
        }

        // Act
        await jwt.validateAndExtractJwtObject( req, publicKey );

        // Assert
        assert.deepStrictEqual( req.jwt, expectedJwt );
    } );

    it( "jwtAgeInSeconds", async function () {

        // Arrange
        const req = { jwt: { payload: { iat: 1638662314 } } };

        // Act
        let age = jwt.jwtAgeInSeconds( req );

        // Assert
        assert( age > 1000000 );
    } );

    it( "jwtAgeInSeconds (legacy ms)", async function () {

        // Arrange
        const req = { jwt: { payload: { iat: 1638662314000 } } };

        // Act
        let age = jwt.jwtAgeInSeconds( req );

        // Assert
        assert( age > 1000000 );
    } );

    it( "isJwtExpired", async function () {

        // Arrange
        const req = { jwt: { payload: { iat: Math.floor( Date.now() / 1000 ) - 100 } } };
        const validityInSeconds = 30;

        // Act
        let isExpired = jwt.isJwtExpired( req, validityInSeconds );

        // Assert
        assert( isExpired );
    } );

    it( "isJwtUserHasRole", async function () {

        // Arrange
        const req = { jwt: { payload: { roles: [ "admin" ] } } };
        const role = "admin";
        const roleTwo = "none";

        // Act
        let hasRole = jwt.doesJwtUserHasRole( req, role );
        let hasRoleTwo = jwt.doesJwtUserHasRole( req, roleTwo );

        // Assert
        assert( hasRole );
        assert( !hasRoleTwo );
    } );

    it( "jwtClientId", async function () {

        // Arrange
        const req = { jwt: { payload: { client_id: '8b0db877-a6b3-4a23-a493-e687915cdd87' } } };

        // Act
        let clientId = jwt.jwtClientId( req );

        // Assert
        assert.deepStrictEqual( clientId, '8b0db877-a6b3-4a23-a493-e687915cdd87' );
    } );

    it( "visitorClientId", async function () {

        // Arrange
        const req = { visitor: { payload: { client_id: '8b0db877-a6b3-4a23-a493-e687915cdd87' } } };

        // Act
        let clientId = jwt.visitorClientId( req );

        // Assert
        assert.deepStrictEqual( clientId, '8b0db877-a6b3-4a23-a493-e687915cdd87' );
    } );

    it( "verifyJwtAndRole", async function () {

        const validJwt = "Bearer " + jwtString;

        // Arrange
        const req = {
            get( header ) {
                if ( header === "Authorization" ) {
                    return validJwt;
                }
            }
        };

        const res = {
            send( message ) {
                this.body = message
            }
        };
        const next = () => {
        }

        function throwUsedTokenError() {
            throw new Error( "Used_Token" );
        }

        // Act
        const jwtMiddleware = jwt.verifyJwtAndRole( "admin", publicKey, throwUsedTokenError );
        // We need to make sure the roles include admin
        const payload = jwtUtilAuth.getHeaderPayloadFromJwt( jwtString ).payload;
        payload.roles = [ "admin" ];
        const jwtWithAdmin = jwtUtilAuth.createSignedJwtFromObject( { alg: 'EdDSA' }, payload, privateKey );
        req.get = ( h ) => h === "Authorization" ? "Bearer " + jwtWithAdmin : null;

        await jwtMiddleware( req, res, next );

        // Assert
        assert.deepStrictEqual( req.jwt.payload.roles[ 0 ], "admin" );
    } );

    it( "verifyJwt", async function () {

        const validJwt = "Bearer " + jwtString;

        // Arrange
        const req = {
            get( header ) {
                if ( header === "Authorization" ) {
                    return validJwt;
                }
            }
        };

        const res = {
            send( message ) {
                this.body = message
            }
        };
        const next = () => {
        }

        function throwUsedTokenError() {
            throw new Error( "Used_Token" );
        }

        // Act
        const jwtMiddleware = jwt.verifyJwt( publicKey, throwUsedTokenError );
        await jwtMiddleware( req, res, next );

        // Assert
        assert.deepStrictEqual( req.jwt.payload.iat, 1638662314 );
    } );

    it( "verifyWebToken", async function () {

        // Arrange
        const req = {
            get( header ) {
                if ( header === "AnyCustomName" ) {
                    return jwtString;
                }
            }
        };

        const res = {
            send( message ) {
                this.body = message
            }
        };
        const next = () => {
        }

        function throwBadTokenError() {
            throw new Error( "Used_Token" );
        }

        // Act
        const jwtMiddleware = jwt.verifyWebToken( publicKey, "AnyCustomName", throwBadTokenError );
        await jwtMiddleware( req, res, next );

        // Assert
        assert.deepStrictEqual( req.jwt.payload.iat, 1638662314 );
    } );

    it( "throws error", function () {

        // Act
        assert.throws( function () {
            throwError();
        }, Error )

        function throwUsedTokenError() {
            throw new Error( "Used_Token" );
        }

        assert.throws( function () {
            throwError( throwUsedTokenError );
        }, Error )

        assert.doesNotThrow( function () {
            throwError( () => {
            } );
        }, Error )
    } );

    it( "validateJwtNoThrow good jwt", async function () {

        // Arrange
        const req = {
            get( header ) {
                if ( header === "Authorization" ) {
                    return "Bearer " + jwtString
                }
            }
        };

        // Act
        const receivedJwt = await jwt._validateJwtNoThrow( req );

        // Assert
        assert.deepStrictEqual( receivedJwt, jwtString );
    } );

    it( "validateJwtNoThrow bad jwt", async function () {

        // Arrange
        const req = {
            get( header ) {
                if ( header === "Authorization" ) {
                    return "Bearer " + jwtStringBad
                }
            }
        };

        // Act
        const receivedJwt = await jwt._validateJwtNoThrow( req );

        // Assert
        assert.deepStrictEqual( receivedJwt, jwtStringBad );
    } );

    it( "validateJwtNoThrow no jwt", async function () {

        // Arrange
        const req = {
            get( header ) {
            }
        };

        // Act
        const receivedJwt = await jwt._validateJwtNoThrow( req );

        // Assert
        assert.deepStrictEqual( receivedJwt, null );
    } );

    it( "isJwtSignatureValidNoThrow good jwt", async function () {

        // Act
        const isSignatureValid = await jwt._isJwtSignatureValidNoThrow( jwtString, publicKey );

        // Assert
        assert.deepStrictEqual( isSignatureValid, true );
    } );

    it( "isJwtSignatureValidNoThrow bad jwt", async function () {

        // Act
        const isSignatureValid = await jwt._isJwtSignatureValidNoThrow( jwtStringBad, publicKey );

        // Assert
        assert.deepStrictEqual( isSignatureValid, false );
    } );

    it( "extractJwtObjectNoThrow good jwt", async function () {
        // Arrange
        const req = {
            get( header ) {
                if ( header === "Authorization" ) {
                    return "Bearer " + jwtString
                }
            }
        };

        const expectedJwt = {
            header: { alg: 'EdDSA', typ: 'JWT' },
            payload: {
                iat: 1638662314,
                client_id: '8b0db877-a6b3-4a23-a493-e687915cdd87',
                roles: [],
                exp: 1638662314 + 3600
            }
        }

        // Act
        await jwt._extractJwtObjectNoThrow( req, jwtString );

        // Assert
        assert.deepStrictEqual( req.jwt, expectedJwt );
    } );

    it( "extractJwtObjectNoThrow bad jwt", async function () {
        // Arrange
        const req = {
            get( header ) {
                if ( header === "Authorization" ) {
                    return "Bearer " + jwtStringBad
                }
            }
        };

        const expectedBadJwt = {
            header: { alg: 'sha512', typ: 'JWT' },
            payload: {
                iat: 1638662314993,
                client_id: "8b0db877-a6b3-4a23-a493-e685cdd87",
                roles: []
            }
        }

        // Act
        await jwt._extractJwtObjectNoThrow( req, jwtStringBad );

        // Assert
        assert.deepStrictEqual( req.jwt, expectedBadJwt );
    } );

    it( "verifyJwtNoThrow good jwt", async function () {

        const validJwt = "Bearer " + jwtString;

        // Arrange
        const req = {
            get( header ) {
                if ( header === "Authorization" ) {
                    return validJwt;
                }
            }
        };

        const res = {
            send( message ) {
                this.body = message
            }
        };
        const next = () => {
        }

        // Act
        const jwtMiddleware = jwt.verifyJwtNoThrow( publicKey );
        await jwtMiddleware( req, res, next );

        // Assert
        assert.deepStrictEqual( req.jwt.payload.iat, 1638662314 );
    } );

    it( "verifyWebTokenNoThrow good jwt", async function () {

        // Arrange
        const req = {
            get( header ) {
                if ( header === "AnyCustomName" ) {
                    return jwtString;
                }
            }
        };

        const res = {
            send( message ) {
                this.body = message
            }
        };
        const next = () => {
        }

        // Act
        const jwtMiddleware = jwt.verifyWebTokenNoThrow( publicKey, "AnyCustomName" );
        await jwtMiddleware( req, res, next );

        // Assert
        assert.deepStrictEqual( req.jwt.payload.iat, 1638662314 );
    } );

    it( "verifyJwtNoThrow bad jwt", async function () {

        // Arrange
        const req = {
            get( header ) {
                if ( header === "Authorization" ) {
                    return jwtStringBad;
                }
            }
        };

        const res = {
            send( message ) {
                this.body = message
            }
        };
        const next = () => {
        }

        // Act
        const jwtMiddleware = jwt.verifyJwtNoThrow( publicKey );
        await jwtMiddleware( req, res, next );

        // Assert
        assert.deepStrictEqual( req.jwt, null );
    } );

    it( "verifyJwtNoThrow no jwt", async function () {

        // Arrange
        const req = {
            get( header ) {
            }
        };

        const res = {
            send( message ) {
                this.body = message
            }
        };
        const next = () => {
        }

        // Act
        const jwtMiddleware = jwt.verifyJwtNoThrow( publicKey );
        await jwtMiddleware( req, res, next );

        // Assert
        assert.deepStrictEqual( req.jwt, null );
    } );

    it( "verifyVisitorNoThrow good jwt", async function () {

        const visitorId = 'b63887af-4fd5-47ad-9aed-687866809554';
        const visitorToken = "bearer " + jwtUtilAuth.createSignedJwtFromObject(
            { alg: 'EdDSA' },
            { iat: 1658444290, client_id: visitorId },
            privateKey
        );

        // Arrange
        const req = {
            get( header ) {
                if ( header === "Visitor" ) {
                    return visitorToken;
                }
            }
        };

        const res = {
            send( message ) {
                this.body = message
            }
        };
        const next = () => {
        }

        // Act
        const jwtMiddleware = jwt.verifyVisitorNoThrow( publicKey );
        await jwtMiddleware( req, res, next );

        // Assert
        assert.deepStrictEqual( req.visitor.payload.client_id, visitorId );
    } );
} );
