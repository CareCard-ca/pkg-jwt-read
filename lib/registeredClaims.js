'use strict';
function jwtGetClientId(req) {
  const jwtObj = req?.jwt || this;
  return jwtObj?.payload?.sub;
}

function jwtIsExpired(req, jwtValiditySeconds) {
  // Check if called as req.jwt.jwtIsExpired(seconds) or jwtIsExpired(seconds)
  if (arguments.length === 1 && typeof req === 'number') {
    jwtValiditySeconds = req;
    req = undefined;
  }

  const jwtObj = req?.jwt || this;

  if (jwtObj?.payload?.exp) {
    return Math.floor(Date.now() / 1000) >= jwtObj.payload.exp;
  }

  if (jwtValiditySeconds && typeof jwtValiditySeconds === 'number') {
    return parseInt(jwtValiditySeconds) < jwtGetAgeInSeconds.call(this, req);
  } else {
    return true;
  }
}

function jwtGetAgeInSeconds(req) {
  const jwtObj = req?.jwt || this;

  if (jwtObj?.payload?.iat) {
    let iat = jwtObj.payload.iat;
    if (iat > 1000000000000) {
      iat = Math.floor(iat / 1000);
    }

    jwtObj['age'] = Math.floor(Date.now() / 1000) - iat;
    return jwtObj.age;
  } else {
    jwtObj['age'] = Infinity;
    return jwtObj.age;
  }
}
module.exports = { jwtGetClientId, jwtGetAgeInSeconds, jwtIsExpired };
