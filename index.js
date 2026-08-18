const jwtLib = require('./lib/jwtLib');
const jwtRoles = require('./lib/jwtRoles');

module.exports = {
  DEFAULT_USER_AUTHORIZATION_HEADER_NAME: jwtLib.DEFAULT_USER_AUTHORIZATION_HEADER_NAME,
  DEFAULT_USER_AUTHORIZATION_MAX_TOKEN_LENGTH: jwtLib.DEFAULT_USER_AUTHORIZATION_MAX_TOKEN_LENGTH,
  jwtVerify: jwtLib.verifyJwt,
  jwtVerifyWebToken: jwtLib.verifyWebToken,
  jwtVerifyNoThrow: jwtLib.verifyJwtNoThrow,
  jwtVerifyWebTokenNoThrow: jwtLib.verifyWebTokenNoThrow,
  jwtVerifyUserAuthorization: jwtLib.verifyUserAuthorization,
  jwtVerifyUserAuthorizationNoThrow: jwtLib.verifyUserAuthorizationNoThrow,
  jwtVerifyVisitorNoThrow: jwtLib.verifyVisitorNoThrow,
  jwtGetClientId: jwtLib.jwtClientId,
  jwtGetVisitorClientId: jwtLib.visitorClientId,
  jwtIsExpired: jwtLib.isJwtExpired,
  jwtGetAgeInSeconds: jwtLib.jwtAgeInSeconds,
  jwtVerifyAndHasRole: jwtLib.verifyJwtAndRole,
  jwtGetRoleName: jwtRoles.getNameOfRoleFromCode,
  jwtGetRoleCode: jwtRoles.getCodeFromNameOfRole,
  jwtGetContext: jwtRoles.getContext,
  jwtValidateAndExtract: jwtLib.validateAndExtractJwtObject,
  jwtValidateAndExtractUserAuthorization: jwtLib.validateAndExtractUserAuthorizationObject,
  jwtValidateAndExtractUserAuthorizationNoThrow:
    jwtLib.validateAndExtractUserAuthorizationObjectNoThrow,
  jwtValidateAndExtractService: jwtLib.validateAndExtractServiceJwtObject,
  jwtValidateAndExtractOrServerAuth: jwtLib.validateAndExtractJwtOrServerAuthObject,
  jwtValidateAndExtractWebToken: jwtLib.validateAndExtractWebToken,
  jwtValidateAndExtractNoThrow: jwtLib.validateAndExtractJwtObjectNoThrow,
  jwtValidateAndExtractWebTokenNoThrow: jwtLib.validateAndExtractWebTokenObjectNoThrow,
  jwtValidateAndExtractVisitorNoThrow: jwtLib.validateAndExtractVisitorObjectNoThrow,
  jwtVerifyService: jwtLib.verifyServiceJwt,
  jwtVerifyOrServerAuth: jwtLib.verifyJwtOrServerAuth,
  jwtVerifyOrServerAuthAndHasRole: jwtLib.verifyJwtOrServerAuthAndHasRole,

  /** @deprecated use jwtVerify */
  verifyJwt: jwtLib.verifyJwt,
  /** @deprecated use jwtVerifyWebToken */
  verifyWebToken: jwtLib.verifyWebToken,
  /** @deprecated use jwtVerifyNoThrow */
  verifyJwtNoThrow: jwtLib.verifyJwtNoThrow,
  /** @deprecated use jwtVerifyWebTokenNoThrow */
  verifyWebTokenNoThrow: jwtLib.verifyWebTokenNoThrow,
  /** @deprecated use jwtVerifyVisitorNoThrow */
  verifyVisitorNoThrow: jwtLib.verifyVisitorNoThrow,
  /** @deprecated use jwtGetClientId */
  jwtClientId: jwtLib.jwtClientId,
  /** @deprecated use jwtGetVisitorClientId */
  visitorClientId: jwtLib.visitorClientId,
  /** @deprecated use jwtIsExpired */
  isJwtExpired: jwtLib.isJwtExpired,
  /** @deprecated use jwtGetAgeInSeconds */
  jwtAgeInSeconds: jwtLib.jwtAgeInSeconds,
  /** @deprecated use jwtVerifyAndHasRole */
  verifyJwtAndRole: jwtLib.verifyJwtAndRole,
  /** @deprecated use jwtThrowUsedTokenError */
  throwUsedTokenError: jwtLib.throwUsedTokenError,
  /** @deprecated use jwtDoesJwtUserHasRole */
  doesJwtUserHasRole: jwtLib.doesJwtUserHasRole,
  /** @deprecated use jwtGetRoleName */
  getNameOfRole: jwtRoles.getNameOfRoleFromCode,
  /** @deprecated use jwtGetRoleCode */
  getCodeOfRole: jwtRoles.getCodeFromNameOfRole,
};
