const { jwtClientId } = require('./jwtLib');

module.exports = {
  getNameOfRoleFromCode,
  getCodeFromNameOfRole,
  getContext,
};

function getNameOfRoleFromCode(roleCode) {
  const codesToCategory = {
    ad: 'admin',
    su: 'super_admin',
  };
  return codesToCategory[roleCode] || '';
}

function getNameOfRoleFromCode( roleCode ) {
    const codesToCategory = {
        "ad": "admin",
        "su": "super_admin",
    };
    return codesToCategory[ roleCode ] || "";
}

function getCodeFromNameOfRole( roleName ) {
    const namesToCode = {
        "admin": "ad",
        "super_admin": "su",
    };
    return namesToCode[ roleName ] || "";
}
