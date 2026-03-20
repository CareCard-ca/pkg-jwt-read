const jwtLib = require( './lib/jwtLib' );
const jwtRoles = require( './lib/jwtRoles' );


module.exports = {
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

