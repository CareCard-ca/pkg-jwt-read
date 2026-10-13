'use strict';

const { jwtVerifySignedToken, jwtGetHeaderPayload } = require('@carecard/auth-util');

// Pattern: Transport Parser - accepts exactly one HTTP bearer credential.
function jwtReadBearerToken(header) {
  if (typeof header !== 'string') {
    return null;
  }
  return /^Bearer[ \t]+([^\s]+)$/i.exec(header.trim())?.[1] || null;
}

// Pattern: Configuration Guard - rejects an invalid caller-selected lifetime.
function assertMaximumAge(maximumAgeSeconds) {
  if (
    maximumAgeSeconds !== undefined &&
    (!Number.isSafeInteger(maximumAgeSeconds) || maximumAgeSeconds <= 0)
  ) {
    throw new TypeError('maximumAgeSeconds must be a positive safe integer.');
  }
}

// Pattern: Registered Claims - calculates expiration without any application lifetime default.
function jwtGetTokenDeadline(payload, maximumAgeSeconds) {
  assertMaximumAge(maximumAgeSeconds);
  if (!Number.isSafeInteger(payload?.exp) || payload.exp < 0) {
    return null;
  }
  if (
    payload.iat !== undefined &&
    (!Number.isSafeInteger(payload.iat) || payload.iat < 0 || payload.exp <= payload.iat)
  ) {
    return null;
  }
  if (maximumAgeSeconds === undefined) {
    return payload.exp;
  }
  return Number.isSafeInteger(payload.iat)
    ? Math.min(payload.exp, payload.iat + maximumAgeSeconds)
    : null;
}

// Pattern: Fail-Closed Guard - checks registered token timing on every invocation.
function jwtIsTokenExpired(request, maximumAgeSeconds) {
  const payload = request?.jwt?.payload;
  const deadline = jwtGetTokenDeadline(payload, maximumAgeSeconds);
  const now = Date.now() / 1000;
  return (
    deadline === null || payload.iat > now || now >= deadline || !hasActiveNotBefore(payload, now)
  );
}

function hasActiveNotBefore(payload, now) {
  return (
    payload.nbf === undefined ||
    (Number.isSafeInteger(payload.nbf) && payload.nbf >= 0 && now >= payload.nbf)
  );
}

function audienceMatches(actual, expected) {
  const actualValues = Array.isArray(actual) ? actual : [actual];
  const expectedValues = Array.isArray(expected) ? expected : [expected];
  return actualValues.some(value => typeof value === 'string' && expectedValues.includes(value));
}

// Pattern: Configuration Guard - keeps service policy explicit and rejects malformed requirements.
function assertRequirements(requirements) {
  if (!requirements || typeof requirements !== 'object' || Array.isArray(requirements)) {
    throw new TypeError('Token requirements must be an object.');
  }
  assertMaximumAge(requirements.maximumAgeSeconds);
  for (const name of ['issuer', 'subject']) {
    if (
      requirements[name] !== undefined &&
      (typeof requirements[name] !== 'string' || !requirements[name].trim())
    ) {
      throw new TypeError(`${name} must be a non-empty string.`);
    }
  }
  if (
    requirements.validateClaims !== undefined &&
    typeof requirements.validateClaims !== 'function'
  ) {
    throw new TypeError('validateClaims must be a function.');
  }
  if (requirements.audience !== undefined) {
    const audiences = Array.isArray(requirements.audience)
      ? requirements.audience
      : [requirements.audience];
    if (
      audiences.length === 0 ||
      audiences.some(value => typeof value !== 'string' || !value.trim())
    ) {
      throw new TypeError('audience must be a non-empty string or array of non-empty strings.');
    }
  }
}

// Pattern: Configured Verification - checks registered constraints and delegates custom claim semantics.
function claimsMeetRequirements(payload, requirements) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return false;
  }
  if (jwtIsTokenExpired({ jwt: { payload } }, requirements.maximumAgeSeconds)) {
    return false;
  }
  if (requirements.issuer !== undefined && payload.iss !== requirements.issuer) {
    return false;
  }
  if (requirements.subject !== undefined && payload.sub !== requirements.subject) {
    return false;
  }
  if (requirements.audience !== undefined && !audienceMatches(payload.aud, requirements.audience)) {
    return false;
  }
  return requirements.validateClaims === undefined || requirements.validateClaims(payload) === true;
}

// Pattern: Signed Token Boundary - verifies cryptography before exposing opaque custom claims.
function jwtReadVerifiedToken(token, verificationJwks, requirements = {}) {
  assertRequirements(requirements);
  if (!jwtVerifySignedToken(token, verificationJwks)) {
    return null;
  }
  const parts = jwtGetHeaderPayload(token);
  return claimsMeetRequirements(parts?.payload, requirements) ? parts : null;
}

// Pattern: Introspection Boundary - accepts only caller-normalized canonical claims.
async function jwtReadIntrospectedToken(token, introspect, requirements = {}) {
  assertRequirements(requirements);
  if (typeof introspect !== 'function') {
    throw new TypeError('An introspection function is required.');
  }
  const result = await introspect(token);
  return result?.active === true && claimsMeetRequirements(result.claims, requirements)
    ? { header: {}, payload: result.claims }
    : null;
}

module.exports = {
  jwtGetTokenDeadline,
  jwtIsTokenExpired,
  jwtReadVerifiedToken,
  jwtReadIntrospectedToken,
  jwtReadBearerToken,
};
