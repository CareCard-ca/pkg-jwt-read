const jwtLib = require('./lib/jwtLib');
const jwtRoles = require('./lib/jwtRoles');

module.exports = {
    jwtVerify: jwtLib.verifyJwt,
    jwtVerifyWebToken: jwtLib.verifyWebToken,
    jwtVerifyNoThrow: jwtLib.verifyJwtNoThrow,
    jwtVerifyWebTokenNoThrow: jwtLib.verifyWebTokenNoThrow,
    jwtVerifyVisitorNoThrow: jwtLib.verifyVisitorNoThrow,
    jwtGetClientId: jwtLib.jwtClientId,
    jwtGetVisitorClientId: jwtLib.visitorClientId,
    jwtIsExpired: jwtLib.isJwtExpired,
    jwtGetAgeInSeconds: jwtLib.jwtAgeInSeconds,
    jwtVerifyAndHasRole: jwtLib.verifyJwtAndRole,
    jwtGetRoleName: jwtRoles.getNameOfRoleFromCode,
    jwtGetRoleCode: jwtRoles.getCodeFromNameOfRole,
    jwtValidateAndExtract: jwtLib.validateAndExtractJwtObject,
    jwtValidateAndExtractWebToken: jwtLib.validateAndExtractWebToken,
    jwtValidateAndExtractNoThrow: jwtLib.validateAndExtractJwtObjectNoThrow,
    jwtValidateAndExtractWebTokenNoThrow: jwtLib.validateAndExtractWebTokenObjectNoThrow,
    jwtValidateAndExtractVisitorNoThrow: jwtLib.validateAndExtractVisitorObjectNoThrow,


    /**
     * @Deprecated use new names starting with jwt...
     */
    verifyJwt: jwtLib.verifyJwt,
    verifyWebToken: jwtLib.verifyWebToken,
    verifyJwtNoThrow: jwtLib.verifyJwtNoThrow,
    verifyWebTokenNoThrow: jwtLib.verifyWebTokenNoThrow,
    verifyVisitorNoThrow: jwtLib.verifyVisitorNoThrow,
    jwtClientId: jwtLib.jwtClientId,
    visitorClientId: jwtLib.visitorClientId,
    isJwtExpired: jwtLib.isJwtExpired,
    jwtAgeInSeconds: jwtLib.jwtAgeInSeconds,
    verifyJwtAndRole: jwtLib.verifyJwtAndRole,
    throwUsedTokenError: jwtLib.throwUsedTokenError,
    doesJwtUserHasRole: jwtLib.doesJwtUserHasRole,
    getNameOfRole: jwtRoles.getNameOfRoleFromCode,
    getCodeOfRole: jwtRoles.getCodeFromNameOfRole
};
