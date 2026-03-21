const {isJwtString} = require('@carecard/validate').validate;
const {jwtUtilAuth} = require('@carecard/auth-util');
const {
    throwLoginRequiredError,
    throwNotAuthorizedError
} = require("@carecard/common-util").error;

function jwtClientId(req) {
    const jwtObj = req?.jwt || this;
    return jwtObj?.payload?.client_id;
}

function visitorClientId(req) {
    const visitorObj = req?.visitor || this;
    return visitorObj?.payload?.client_id;
}

function doesJwtUserHasRole(req, userRole) {
    // Check if called as req.jwt.doesJwtUserHasRole(userRole) or doesJwtUserHasRole(role)
    if (arguments.length === 1 && typeof req === 'string') {
        userRole = req;
        req = undefined;
    }

    const jwtObj = req?.jwt || this;

    if (userRole && typeof userRole === "string") {
        return jwtObj?.payload?.roles?.includes(userRole);
    } else {
        throwNotAuthorizedError();
    }
}

function throwError(customErrorFunction) {
    (typeof customErrorFunction === "function") ?
        customErrorFunction() :
        throwLoginRequiredError()
}

function isJwtExpired(req, jwtValiditySeconds) {
    // Check if called as req.jwt.isJwtExpired(seconds) or isJwtExpired(seconds)
    if (arguments.length === 1 && typeof req === 'number') {
        jwtValiditySeconds = req;
        req = undefined;
    }

    const jwtObj = req?.jwt || this;

    if (jwtObj?.payload?.exp) {
        return (Math.floor(Date.now() / 1000)) >= jwtObj.payload.exp;
    }

    if (jwtValiditySeconds && typeof jwtValiditySeconds === "number") {
        return (parseInt(jwtValiditySeconds)) < jwtAgeInSeconds.call(this, req);
    } else {
        return true;
    }

}

function jwtAgeInSeconds(req) {
    const jwtObj = req?.jwt || this;

    if (jwtObj?.payload?.iat) {

        let iat = jwtObj.payload.iat;
        if (iat > 1000000000000) {
            iat = Math.floor(iat / 1000);
        }

        jwtObj["age"] = Math.floor(Date.now() / 1000) - iat;
        return jwtObj.age;

    } else {

        jwtObj["age"] = Infinity
        return jwtObj.age;

    }
}

function validateAndExtractJwtObject(req, publicKey, customErrorFunction) {

    const jwtString = _validateJwt(req, customErrorFunction);

    const isJwtSignatureValid = jwtUtilAuth.verifyJwtSignature(jwtString, publicKey);

    if (jwtString && isJwtSignatureValid) {
        _extractJwtObject(req, jwtString, customErrorFunction);
    } else {
        req["jwt"] = null;
        throwError(customErrorFunction);
    }

    return req;
}

function validateAndExtractWebToken(req, publicKey, headerName, customErrorFunction) {

    const webTokenString = _validateWebToken(req, headerName, customErrorFunction);

    const isJwtSignatureValid = jwtUtilAuth.verifyJwtSignature(webTokenString, publicKey);

    if (webTokenString && isJwtSignatureValid) {
        _extractJwtObject(req, webTokenString, customErrorFunction);
    } else {
        req["jwt"] = null;
        throwError(customErrorFunction);
    }

    return req;
}

function validateAndExtractJwtObjectNoThrow(req, publicKey) {

    try {

        const jwtString = _validateJwtNoThrow(req);

        const isJwtSignatureValid = jwtUtilAuth.verifyJwtSignature(jwtString, publicKey);

        if (jwtString && isJwtSignatureValid) {
            _extractJwtObjectNoThrow(req, jwtString);
        } else {
            req["jwt"] = null;
        }

    } catch (err) {

        req["jwt"] = null;

    }

    return req;
}

function validateAndExtractWebTokenObjectNoThrow(req, publicKey, headerName) {

    try {

        const jwtString = _validateWebTokenNoThrow(req, headerName);

        const isJwtSignatureValid = jwtUtilAuth.verifyJwtSignature(jwtString, publicKey);

        if (jwtString && isJwtSignatureValid) {
            _extractJwtObjectNoThrow(req, jwtString);
        } else {
            req["jwt"] = null;
        }

    } catch (err) {

        req["jwt"] = null;

    }

    return req;
}

function validateAndExtractVisitorObjectNoThrow(req, publicKey) {

    try {

        const jwtString = _validateVisitorNoThrow(req);

        const isJwtSignatureValid = jwtUtilAuth.verifyJwtSignature(jwtString, publicKey);

        if (jwtString && isJwtSignatureValid) {
            _extractVisitorObjectNoThrow(req, jwtString);
        } else {
            req["visitor"] = null;
        }

    } catch (err) {

        req["visitor"] = null;

    }

    return req;
}

function verifyJwtAndRole(role, publicKey, customErrorFunction) {
    return function (req, res, next) {
        try {
            validateAndExtractJwtObject(req, publicKey, customErrorFunction);
            const isRoleExist = doesJwtUserHasRole(req, role);
            _isLoginRequired(isRoleExist, customErrorFunction);
            next();
        } catch (err) {
            next(err);
        }
    }
}

function verifyJwt(publicKey, customErrorFunction) {
    return function (req, res, next) {
        try {
            validateAndExtractJwtObject(req, publicKey, customErrorFunction);
            next();
        } catch (err) {
            next(err);
        }
    }
}

function verifyWebToken(publicKey, headerName, customErrorFunction) {
    return function (req, res, next) {
        try {
            validateAndExtractWebToken(req, publicKey, headerName, customErrorFunction);
            next();
        } catch (err) {
            next(err);
        }
    }
}

function verifyJwtNoThrow(publicKey) {
    return function (req, res, next) {
        try {
            validateAndExtractJwtObjectNoThrow(req, publicKey);
            next();
        } catch (err) {
            next(err);
        }
    }
}

function verifyWebTokenNoThrow(publicKey, headerName) {
    return function (req, res, next) {
        try {
            validateAndExtractWebTokenObjectNoThrow(req, publicKey, headerName);
            next();
        } catch (err) {
            next(err);
        }
    }
}

function verifyVisitorNoThrow(publicKey) {
    return function (req, res, next) {
        try {
            validateAndExtractVisitorObjectNoThrow(req, publicKey);
            next();
        } catch (err) {
            next(err);
        }
    }
}

function throwUsedTokenError() {
    throw new Error("Used_Token");
}

/*********************
 * Private functions *
 *********************/
function _isLoginRequired(hasRequiredRole, customErrorFunction) {

    if (!hasRequiredRole) {
        throwError(customErrorFunction);
    }

}

function _extractJwtObject(req, jwt, customErrorFunction) {
    if (jwt && typeof jwt === "string") {
        const jwtObj = jwtUtilAuth.getHeaderPayloadFromJwt(jwt);
        _attachJwtMethods(jwtObj);
        req["jwt"] = jwtObj;
    } else {
        throwError(customErrorFunction);
    }
}

function _extractJwtObjectNoThrow(req, jwt) {
    if (jwt && typeof jwt === "string") {
        const jwtObj = jwtUtilAuth.getHeaderPayloadFromJwt(jwt);
        _attachJwtMethods(jwtObj);
        req["jwt"] = jwtObj;
    } else {
        req["jwt"] = null;
    }
}

function _extractVisitorObjectNoThrow(req, jwt) {
    if (jwt && typeof jwt === "string") {
        const visitorObj = jwtUtilAuth.getHeaderPayloadFromJwt(jwt);
        _attachVisitorMethods(visitorObj);
        req["visitor"] = visitorObj;
    } else {
        req["visitor"] = null;
    }
}

function _attachJwtMethods(jwtObj) {
    if (jwtObj) {
        Object.defineProperties(jwtObj, {
            jwtClientId: {value: jwtClientId, enumerable: false},
            doesJwtUserHasRole: {value: doesJwtUserHasRole, enumerable: false},
            isJwtExpired: {value: isJwtExpired, enumerable: false},
            jwtAgeInSeconds: {value: jwtAgeInSeconds, enumerable: false}
        });
    }
}

function _attachVisitorMethods(visitorObj) {
    if (visitorObj) {
        Object.defineProperties(visitorObj, {
            visitorClientId: {value: visitorClientId, enumerable: false}
        });
    }
}

async function _isJwtSignatureValid(jwt, publicKey, customErrorFunction) {

    if (jwt && typeof jwt === "string") {
        return jwtUtilAuth.verifyJwtSignature(jwt, publicKey)
    } else {
        throwError(customErrorFunction);
    }
}

async function _isJwtSignatureValidNoThrow(jwt, publicKey) {

    if (jwt && typeof jwt === "string") {
        return jwtUtilAuth.verifyJwtSignature(jwt, publicKey)
    } else {
        return false;
    }
}

function _validateJwt(req, customErrorFunction) {

    // Get from http header.
    let jwtRaw = req.get("Authorization");

    // Extract jwt from bearer schema.
    let jwt = _extractJwt(jwtRaw, customErrorFunction);

    // Validate characters string of jwt.
    if (isJwtString(jwt)) {
        return jwt;
    } else {
        throwError(customErrorFunction);
    }
}

function _validateWebToken(req, headerName, customErrorFunction) {

    // Get from http header.
    let jwtRaw = req.get(headerName);

    // Extract jwt from bearer schema.
    let webToken = _extractWebToken(jwtRaw, customErrorFunction);

    // Validate characters string of jwt.
    if (isJwtString(webToken)) {
        return webToken;
    } else {
        throwError(customErrorFunction);
    }
}

function _validateJwtNoThrow(req) {

    // Get from http header.
    let jwtRaw = req.get("Authorization");

    if (!jwtRaw) {
        return null;
    }

    // Extract jwt from bearer schema.
    let jwt = _extractJwtNoThrow(jwtRaw);

    // Validate characters string of jwt.
    if (isJwtString(jwt)) {
        return jwt;
    }

    return null;
}

function _validateWebTokenNoThrow(req, headerName) {

    // Get from http header.
    let jwtRaw = req.get(headerName);

    if (!jwtRaw) {
        return null;
    }

    // Extract jwt from bearer schema.
    let webToken = _extractWebTokenNoThrow(jwtRaw);

    // Validate characters string of jwt.
    if (isJwtString(webToken)) {
        return webToken;
    }

    return null;
}

function _validateVisitorNoThrow(req) {

    // Get from http header.
    let jwtRaw = req.get("Visitor");

    if (!jwtRaw) {
        return null;
    }

    // Extract jwt from bearer schema.
    let jwt = _extractJwtNoThrow(jwtRaw);

    // Validate characters string of jwt.
    if (isJwtString(jwt)) {
        return jwt;
    }

    return null;
}

function _extractJwt(jwtRaw, customErrorFunction) {
    let jwtSplit = null;

    if (jwtRaw && typeof jwtRaw === "string") {
        jwtSplit = jwtRaw.split(" ");
    } else {
        throwError(customErrorFunction);
    }

    if (jwtSplit[0]?.toLowerCase() === "bearer") {
        return jwtSplit[1];
    } else {
        throwError(customErrorFunction);
    }

    return null;
}

function _extractWebToken(jwtRaw, customErrorFunction) {

    if (jwtRaw && typeof jwtRaw === "string") {
        return jwtRaw;
    } else {
        throwError(customErrorFunction);
    }

    return null;
}

function _extractJwtNoThrow(jwtRaw) {
    let jwtSplit = null;

    if (jwtRaw && typeof jwtRaw === "string") {
        jwtSplit = jwtRaw.split(" ");
    } else {
        return null;
    }

    if (jwtSplit[0]?.toLowerCase() === "bearer") {
        return jwtSplit[1];
    }

    return null;
}

function _extractWebTokenNoThrow(jwtRaw) {

    if (jwtRaw && typeof jwtRaw === "string") {
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
    jwtAgeInSeconds,
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
