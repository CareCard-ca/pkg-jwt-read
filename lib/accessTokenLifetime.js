'use strict';

const ACCESS_TOKEN_MAX_AGE_SECONDS = 600;

// Pattern: Lifetime Policy - access credentials expire at the earlier of exp and ten minutes after issuance.
function getAccessTokenDeadline(payload) {
  if (
    !Number.isSafeInteger(payload?.iat) ||
    !Number.isSafeInteger(payload?.exp) ||
    payload.iat < 0 ||
    payload.exp <= payload.iat
  ) {
    return null;
  }
  return Math.min(payload.exp, payload.iat + ACCESS_TOKEN_MAX_AGE_SECONDS);
}

// Pattern: Fail-Closed Guard - evaluates current time on every authorization without expiration grace.
function isAccessTokenExpired(req) {
  const payload = req?.jwt?.payload;
  const deadline = getAccessTokenDeadline(payload);
  const now = Date.now() / 1000;
  return deadline === null || payload.iat > now || now >= deadline;
}

module.exports = { getAccessTokenDeadline, isAccessTokenExpired };
