const {isJwtString} = require('@carecard/validate').validate;
const {jwtVerifySignedToken, jwtGetHeaderPayload} = require('@carecard/auth-util');

const {
    throwLoginRequiredError,
    throwNotAuthorizedError
} = require("@carecard/common-util").error;

function jwtClientId(req) {
    const jwtObj = req?.jwt || this;
    return jwtObj?.payload?.sub;
}

function visitorClientId(req) {
    const visitorObj = req?.visitor || this;
    return visitorObj?.payload?.sub;
}

function doesJwtUserHasRole(req, userRole) {
    // Check if called as req.jwt.doesJwtUserHasRole(userRole) or doesJwtUserHasRole(role)
    if (arguments.length === 1 && typeof req === 'string') {
        userRole = req;
        req = undefined;
    }

    const jwtObj = req?.jwt || this;

    if (!userRole || typeof userRole !== "string" || !jwtObj?.payload?.roles || !Array.isArray(jwtObj.payload.roles)) {
        throwNotAuthorizedError();
    }

    return jwtObj.payload.roles.includes(userRole);
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

    const isJwtSignatureValid = jwtVerifySignedToken(jwtString, publicKey);

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

    const isJwtSignatureValid = jwtVerifySignedToken(webTokenString, publicKey);

    if (webTokenString && isJwtSignatureValid) {
        _extractJwtObject(req, webTokenString, customErrorFunction);
    } else {
        req["jwt"] = null;
        throwError(customErrorFunction);
    }

    return req;
}

function validateAndExtractJwtObjectNoThrow(req, publicKey) {
    return _validateAndExtractGenericNoThrow(req, publicKey, _validateJwtNoThrow, _extractJwtObjectNoThrow, "jwt");
}

function validateAndExtractWebTokenObjectNoThrow(req, publicKey, headerName) {
    return _validateAndExtractGenericNoThrow(req, publicKey, (r) => _validateWebTokenNoThrow(r, headerName), _extractJwtObjectNoThrow, "jwt");
}

function validateAndExtractVisitorObjectNoThrow(req, publicKey) {
    return _validateAndExtractGenericNoThrow(req, publicKey, _validateVisitorNoThrow, _extractVisitorObjectNoThrow, "visitor");
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

function _validateGenericNoThrow(req, headerName, extractor) {
    let jwtRaw = req.get(headerName);
    if (!jwtRaw) return null;
    let jwt = extractor(jwtRaw);
    return isJwtString(jwt) ? jwt : null;
}

function _validateGeneric(req, headerName, extractor, customErrorFunction) {
    let jwtRaw = req.get(headerName);
    let jwt = extractor(jwtRaw, customErrorFunction);
    if (isJwtString(jwt)) return jwt;
    throwError(customErrorFunction);
    return null;
}

function _validateAndExtractGenericNoThrow(req, publicKey, validator, extractor, propertyName) {
    try {
        const jwtString = validator(req);
        const isJwtSignatureValid = jwtVerifySignedToken(jwtString, publicKey);

        if (jwtString && isJwtSignatureValid) {
            extractor(req, jwtString);
        } else {
            req[propertyName] = null;
        }
    } catch (err) {
        if (req) req[propertyName] = null;
        throw err;
    }
    return req;
}

function _extractGenericObjectNoThrow(req, jwt, attacher, propertyName) {
    if (jwt && typeof jwt === "string") {
        const obj = jwtGetHeaderPayload(jwt);
        attacher(obj);
        req[propertyName] = obj;
    } else {
        if (req) req[propertyName] = null;
    }
}

function _extractJwtObject(req, jwt, customErrorFunction) {
    _extractJwtObjectNoThrow(req, jwt);

    if (!req["jwt"]) {
        throwError(customErrorFunction);
    }
}

function _extractJwtObjectNoThrow(req, jwt) {
    _extractGenericObjectNoThrow(req, jwt, _attachJwtMethods, "jwt");
}

function _extractVisitorObjectNoThrow(req, jwt) {
    _extractGenericObjectNoThrow(req, jwt, _attachVisitorMethods, "visitor");
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

    const isValid = await _isJwtSignatureValidNoThrow(jwt, publicKey);

    if (isValid) {
        return isValid;
    } else {
        throwError(customErrorFunction);
    }
}

async function _isJwtSignatureValidNoThrow(jwt, publicKey) {

    if (jwt && typeof jwt === "string") {
        return jwtVerifySignedToken(jwt, publicKey)
    } else {
        return false;
    }
}

function _validateJwt(req, customErrorFunction) {
    return _validateGeneric(req, "Authorization", _extractJwt, customErrorFunction);
}

function _validateWebToken(req, headerName, customErrorFunction) {
    return _validateGeneric(req, headerName, _extractWebToken, customErrorFunction);
}

function _validateJwtNoThrow(req) {
    return _validateGenericNoThrow(req, "Authorization", _extractJwtNoThrow);
}

function _validateWebTokenNoThrow(req, headerName) {
    return _validateGenericNoThrow(req, headerName, _extractWebTokenNoThrow);
}

function _validateVisitorNoThrow(req) {
    return _validateGenericNoThrow(req, "Visitor", _extractJwtNoThrow);
}

function _extractJwt(jwtRaw, customErrorFunction) {
    const jwt = _extractJwtNoThrow(jwtRaw);

    if (jwt !== null) {
        return jwt;
    } else {
        throwError(customErrorFunction);
    }

    return null;
}

function _extractWebToken(jwtRaw, customErrorFunction) {
    const webToken = _extractWebTokenNoThrow(jwtRaw);

    if (webToken !== null) {
        return webToken;
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
    verifyVisitorNoThrow,
    validateAndExtractVisitorObjectNoThrow,
    validateAndExtractJwtObjectNoThrow,
    validateAndExtractWebTokenObjectNoThrow,
    _extractJwtNoThrow,
    _extractWebTokenNoThrow,
    _extractJwt,
    _validateWebTokenNoThrow,
    _validateVisitorNoThrow,
    _extractJwtObjectNoThrow,
    _extractVisitorObjectNoThrow,
    _extractWebToken,
    _isLoginRequired,
    _attachJwtMethods,
    _attachVisitorMethods,
    _validateWebToken
}
