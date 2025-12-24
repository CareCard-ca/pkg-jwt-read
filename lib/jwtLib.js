const validate = require( '@carecard/validate' ).validate;
const { jwtUtilAuth } = require( '@carecard/auth-util' );
const {
    throwLoginRequiredError,
    throwNotAuthorizedError
} = require( "@carecard/common-util" ).error;

function jwtClientId( req ) {

    return req?.jwt?.payload?.client_id;

}

function visitorClientId( req ) {

    return req?.visitor?.payload?.client_id;

}

function doesJwtUserHasRole( req, userRole ) {

    if ( userRole && typeof userRole === "string" ) {
        return req?.jwt?.payload?.roles?.includes( userRole );
    } else {
        throwNotAuthorizedError();
    }
}

function throwError( customErrorFunction ) {
    ( typeof customErrorFunction === "function" ) ?
        customErrorFunction() :
        throwLoginRequiredError()
}

function isJwtExpired( req, jwtValiditySeconds ) {

    if ( jwtValiditySeconds && typeof jwtValiditySeconds === "number" ) {
        return ( parseInt( jwtValiditySeconds ) * 1000 ) < jwtAgeInMilliseconds( req );
    } else {
        return true;
    }

}

function jwtAgeInMilliseconds( req ) {

    if ( req?.jwt?.payload?.iat ) {

        req.jwt[ "age" ] = Date.now() - req.jwt.payload.iat;
        return req.jwt.age;

    } else {

        req.jwt[ "age" ] = Infinity
        return req.jwt.age;

    }
}

async function validateAndExtractJwtObject( req, publicKey, customErrorFunction ) {

    const jwtString = await _validateJwt( req, customErrorFunction );

    const isJwtSignatureValid = await _isJwtSignatureValid( jwtString, publicKey, customErrorFunction );

    if ( jwtString && isJwtSignatureValid ) {
        await _extractJwtObject( req, jwtString, customErrorFunction );
    } else {
        req[ "jwt" ] = null;
        throwError( customErrorFunction );
    }

    return req;
}

async function validateAndExtractWebToken( req, publicKey, headerName, customErrorFunction ) {

    const webTokenString = await _validateWebToken( req, headerName, customErrorFunction );

    const isJwtSignatureValid = await _isJwtSignatureValid( webTokenString, publicKey, customErrorFunction );

    if ( webTokenString && isJwtSignatureValid ) {
        await _extractJwtObject( req, webTokenString, customErrorFunction );
    } else {
        req[ "jwt" ] = null;
        throwError( customErrorFunction );
    }

    return req;
}

async function validateAndExtractJwtObjectNoThrow( req, publicKey ) {

    try {

        const jwtString = await _validateJwtNoThrow( req );

        const isJwtSignatureValid = await _isJwtSignatureValidNoThrow( jwtString, publicKey );

        if ( jwtString && isJwtSignatureValid ) {
            await _extractJwtObjectNoThrow( req, jwtString );
        } else {
            req[ "jwt" ] = null;
        }

    } catch ( err ) {

        req[ "jwt" ] = null;

    }

    return req;
}

async function validateAndExtractWebTokenObjectNoThrow( req, publicKey, headerName ) {

    try {

        const jwtString = _validateWebTokenNoThrow( req, headerName );

        const isJwtSignatureValid = await _isJwtSignatureValidNoThrow( jwtString, publicKey );

        if ( jwtString && isJwtSignatureValid ) {
            await _extractJwtObjectNoThrow( req, jwtString );
        } else {
            req[ "jwt" ] = null;
        }

    } catch ( err ) {

        req[ "jwt" ] = null;

    }

    return req;
}

async function validateAndExtractVisitorObjectNoThrow( req, publicKey ) {

    try {

        const jwtString = await _validateVisitorNoThrow( req );

        const isJwtSignatureValid = await _isJwtSignatureValidNoThrow( jwtString, publicKey );

        if ( jwtString && isJwtSignatureValid ) {
            await _extractVisitorObjectNoThrow( req, jwtString );
        } else {
            req[ "visitor" ] = null;
        }

    } catch ( err ) {

        req[ "visitor" ] = null;

    }

    return req;
}

function verifyJwtAndRole( role, publicKey, customErrorFunction ) {
    return async function ( req, res, next ) {
        await validateAndExtractJwtObject( req, publicKey, customErrorFunction )
            .then( req => doesJwtUserHasRole( req, role ) )
            .then( isRoleExist => _isLoginRequired( isRoleExist, customErrorFunction ) )
            .then( next )
            .catch( next );
    }
}

function verifyJwt( publicKey, customErrorFunction ) {
    return async function ( req, res, next ) {
        await validateAndExtractJwtObject( req, publicKey, customErrorFunction )
            .then( () => process.nextTick( next ) )
            .catch( next );
    }
}

function verifyWebToken( publicKey, headerName, customErrorFunction ) {
    return async function ( req, res, next ) {
        await validateAndExtractWebToken( req, publicKey, headerName, customErrorFunction )
            .then( () => process.nextTick( next ) )
            .catch( next );
    }
}

function verifyJwtNoThrow( publicKey ) {
    return async function ( req, res, next ) {
        await validateAndExtractJwtObjectNoThrow( req, publicKey )
            .then( () => process.nextTick( next ) )
            .catch( next );
    }
}

function verifyWebTokenNoThrow( publicKey, headerName ) {
    return async function ( req, res, next ) {
        await validateAndExtractWebTokenObjectNoThrow( req, publicKey, headerName )
            .then( () => process.nextTick( next ) )
            .catch( next );
    }
}

function verifyVisitorNoThrow( publicKey ) {
    return async function ( req, res, next ) {
        await validateAndExtractVisitorObjectNoThrow( req, publicKey )
            .then( () => process.nextTick( next ) )
            .catch( next );
    }
}

function throwUsedTokenError() {
    throw new Error( "Used_Token" );
}

/*********************
 * Private functions *
 *********************/
function _isLoginRequired( hasRequiredRole, customErrorFunction ) {

    if ( !hasRequiredRole ) {
        throwError( customErrorFunction );
    }

}

async function _extractJwtObject( req, jwt, customErrorFunction ) {
    if ( jwt && typeof jwt === "string" ) {
        req[ "jwt" ] = jwtUtilAuth.getHeaderPayloadFromJwt( jwt );
    } else {
        throwError( customErrorFunction );
    }
}

async function _extractJwtObjectNoThrow( req, jwt ) {
    if ( jwt && typeof jwt === "string" ) {
        req[ "jwt" ] = jwtUtilAuth.getHeaderPayloadFromJwt( jwt );
    } else {
        req[ "jwt" ] = null;
    }
}

async function _extractVisitorObjectNoThrow( req, jwt ) {
    if ( jwt && typeof jwt === "string" ) {
        req[ "visitor" ] = jwtUtilAuth.getHeaderPayloadFromJwt( jwt );
    } else {
        req[ "visitor" ] = null;
    }
}

async function _isJwtSignatureValid( jwt, publicKey, customErrorFunction ) {

    if ( jwt && typeof jwt === "string" ) {
        return jwtUtilAuth.verifyJwtSignature( jwt, publicKey )
    } else {
        throwError( customErrorFunction );
    }
}

async function _isJwtSignatureValidNoThrow( jwt, publicKey ) {

    if ( jwt && typeof jwt === "string" ) {
        return jwtUtilAuth.verifyJwtSignature( jwt, publicKey )
    } else {
        return false;
    }
}

async function _validateJwt( req, customErrorFunction ) {

    // Get from http header.
    let jwtRaw = req.get( "Authorization" );

    // Extract jwt from bearer schema.
    let jwt = _extractJwt( jwtRaw, customErrorFunction );

    // Validate characters string of jwt.
    if ( validate.isJwtString( jwt ) ) {
        return jwt;
    } else {
        throwError( customErrorFunction );
    }
}

async function _validateWebToken( req, headerName, customErrorFunction ) {

    // Get from http header.
    let jwtRaw = req.get( headerName );

    // Extract jwt from bearer schema.
    let webToken = _extractWebToken( jwtRaw, customErrorFunction );

    // Validate characters string of jwt.
    if ( validate.isJwtString( webToken ) ) {
        return webToken;
    } else {
        throwError( customErrorFunction );
    }
}

function _validateJwtNoThrow( req ) {

    // Get from http header.
    let jwtRaw = req.get( "Authorization" );

    if ( !jwtRaw ) {
        return null;
    }

    // Extract jwt from bearer schema.
    let jwt = _extractJwtNoThrow( jwtRaw );

    // Validate characters string of jwt.
    if ( validate.isJwtString( jwt ) ) {
        return jwt;
    }

    return null;
}

function _validateWebTokenNoThrow( req, headerName ) {

    // Get from http header.
    let jwtRaw = req.get( headerName );

    if ( !jwtRaw ) {
        return null;
    }

    // Extract jwt from bearer schema.
    let webToken = _extractWebTokenNoThrow( jwtRaw );

    // Validate characters string of jwt.
    if ( validate.isJwtString( webToken ) ) {
        return webToken;
    }

    return null;
}

function _validateVisitorNoThrow( req ) {

    // Get from http header.
    let jwtRaw = req.get( "Visitor" );

    if ( !jwtRaw ) {
        return null;
    }

    // Extract jwt from bearer schema.
    let jwt = _extractJwtNoThrow( jwtRaw );

    // Validate characters string of jwt.
    if ( validate.isJwtString( jwt ) ) {
        return jwt;
    }

    return null;
}

function _extractJwt( jwtRaw, customErrorFunction ) {
    let jwtSplit = null;

    if ( jwtRaw && typeof jwtRaw === "string" ) {
        jwtSplit = jwtRaw.split( " " );
    } else {
        throwError( customErrorFunction );
    }

    if ( jwtSplit[ 0 ]?.toLowerCase() === "bearer" ) {
        return jwtSplit[ 1 ];
    } else {
        throwError( customErrorFunction );
    }

    return null;
}

function _extractWebToken( jwtRaw, customErrorFunction ) {

    if ( jwtRaw && typeof jwtRaw === "string" ) {
        return jwtRaw;
    } else {
        throwError( customErrorFunction );
    }

    return null;
}

function _extractJwtNoThrow( jwtRaw ) {
    let jwtSplit = null;

    if ( jwtRaw && typeof jwtRaw === "string" ) {
        jwtSplit = jwtRaw.split( " " );
    } else {
        return null;
    }

    if ( jwtSplit[ 0 ]?.toLowerCase() === "bearer" ) {
        return jwtSplit[ 1 ];
    }

    return null;
}

function _extractWebTokenNoThrow( jwtRaw ) {

    if ( jwtRaw && typeof jwtRaw === "string" ) {
        return jwtRaw;
    }
    return null;
}

module.exports = {
    _validateJwt,
    _validateJwtNoThrow,
    _isJwtSignatureValid,
    _isJwtSignatureValidNoThrow,
    _extractJwtObject,
    _extractJwtObjectNoThrow,
    validateAndExtractJwtObject,
    jwtAgeInMilliseconds,
    isJwtExpired,
    doesJwtUserHasRole,
    jwtClientId,
    visitorClientId,
    verifyJwtAndRole,
    verifyJwt,
    verifyWebTokenNoThrow,
    verifyWebToken,
    verifyJwtNoThrow,
    throwUsedTokenError,
    throwError,
    verifyVisitorNoThrow
}
