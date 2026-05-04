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

    jwtObj['age'] = Math.floor(Date.now() / 1000) - iat;
    return jwtObj.age;
  } else {
    jwtObj['age'] = Infinity;
    return jwtObj.age;
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

  return req;
}

        jwtObj["age"] = Infinity
        return jwtObj.age;

  const isJwtSignatureValid = jwtVerifySignedToken(webTokenString, publicKey);

  if (webTokenString && isJwtSignatureValid) {
    _extractJwtObject(req, webTokenString, customErrorFunction);
    validateAndExtractOptionalUserAuthorizationObject(req, options, customErrorFunction);
  } else {
    req['jwt'] = null;
    throwError(customErrorFunction);
  }

  return req;
}

// Pattern: Decorator - extends no-throw JWT extraction without changing req.jwt failure semantics.
function validateAndExtractJwtObjectNoThrow(req, publicKey, options) {
  _validateAndExtractGenericNoThrow(req, publicKey, _validateJwtNoThrow, _extractJwtObjectNoThrow, 'jwt');
  validateAndExtractOptionalUserAuthorizationObjectNoThrow(req, options);
  return req;
}

// Pattern: Decorator - keeps service-JWT checks distinct from optional user authorization context.
function validateAndExtractServiceJwtObject(req, publicKey, expectedIssuer, expectedAudience, customErrorFunction, options) {
  const jwtString = _validateJwt(req, customErrorFunction);
  const isJwtSignatureValid = jwtVerifySignedToken(jwtString, publicKey);

  if (jwtString && isJwtSignatureValid) {
    _extractJwtObject(req, jwtString, customErrorFunction);
  } else {
    /* istanbul ignore else */
    if (req) {
      req.jwt = null;
    }
  }

  if (!req?.jwt || !_isServiceJwtFor(req.jwt.payload, expectedIssuer, expectedAudience)) {
    /* istanbul ignore else */
    if (req) req.jwt = null;
    throwError(customErrorFunction);
  }

  validateAndExtractOptionalUserAuthorizationObject(req, options, customErrorFunction);
  return req;
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

// Pattern: Factory - normalizes direct user authorization options into one config shape.
function createUserAuthorizationConfig(publicKey, options) {
  return normalizeUserAuthorizationConfig({
    ...(options || {}),
    publicKey,
  });
}

// Pattern: Factory - detects optional user authorization configuration without affecting legacy callers.
function createOptionalUserAuthorizationConfig(options) {
  if (!options || !Object.prototype.hasOwnProperty.call(options, 'userAuthorization')) return null;
  return normalizeUserAuthorizationConfig(options.userAuthorization || {});
}

// Pattern: Pure Function - centralizes defaults for scoped authorization header verification.
function normalizeUserAuthorizationConfig(options) {
  return {
    publicKey: options?.publicKey,
    headerName: options?.headerName || DEFAULT_USER_AUTHORIZATION_HEADER_NAME,
    maxTokenLength: normalizePositiveInteger(options?.maxTokenLength, DEFAULT_USER_AUTHORIZATION_MAX_TOKEN_LENGTH),
    expectedType: options?.expectedType,
    expectedIssuer: options?.expectedIssuer,
    expectedAudience: options?.expectedAudience,
  };
}

// Pattern: Pure Function - keeps numeric option validation deterministic and local.
function normalizePositiveInteger(value, defaultValue) {
  const normalized = Number(value);
  return Number.isInteger(normalized) && normalized > 0 ? normalized : defaultValue;
}

// Pattern: Single Responsibility - reads only the configured header and never logs token material.
function readUserAuthorizationHeader(req, config) {
  const rawToken = getRequestHeader(req, config.headerName);
  const present = rawToken !== undefined && rawToken !== null;
  if (!present || typeof rawToken !== 'string') return { present, token: null };

  const token = rawToken.trim();
  if (!token || token.length > config.maxTokenLength || !isJwtString(token)) return { present: true, token: null };
  return { present: true, token };
}

// Pattern: Adapter - supports Express case-insensitive headers and simple test doubles.
function getRequestHeader(req, headerName) {
  const value = req?.get?.(headerName);
  if (value !== undefined && value !== null) return value;

  const lowerCaseHeaderName = headerName.toLowerCase();
  if (lowerCaseHeaderName === headerName) return value;
  return req?.get?.(lowerCaseHeaderName);
}

// Pattern: Single Responsibility - verifies signature and registered JWT time claims for user authorization.
function isUserAuthorizationTokenAllowed(token, config) {
  if (!token || !config.publicKey || !jwtVerifySignedToken(token, config.publicKey)) return false;

  const payload = readJwtPayloadNoThrow(token);
  if (!payload) return false;
  if (isJwtPayloadIssuedInFuture(payload)) return false;
  if (isJwtPayloadExpired(payload)) return false;
  if (isJwtPayloadNotYetValid(payload)) return false;
  if (config.expectedType && payload.typ !== config.expectedType) return false;
  if (config.expectedIssuer && payload.iss !== config.expectedIssuer) return false;
  if (!expectedAudienceMatches(payload.aud, config.expectedAudience)) return false;

  return true;
}

// Pattern: Pure Function - decodes payload defensively after signature and shape checks.
function readJwtPayloadNoThrow(token) {
  try {
    return jwtGetHeaderPayload(token)?.payload || null;
  } catch {
    return null;
  }
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

  if (jwtSplit[0]?.toLowerCase() === 'bearer') {
    return jwtSplit[1];
  }

  return null;
}

function _extractWebTokenNoThrow(jwtRaw) {
  if (jwtRaw && typeof jwtRaw === 'string') {
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
    validateAndExtractWebToken,
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
