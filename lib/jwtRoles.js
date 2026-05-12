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

function getCodeFromNameOfRole(roleName) {
  const namesToCode = {
    admin: 'ad',
    super_admin: 'su',
  };
  return namesToCode[roleName] || '';
}

function getContext(req) {
  const userId = jwtClientId(req);
  const roles = req.jwt?.payload?.roles;

  if (Array.isArray(roles) && roles.includes('ad')) {
    return {
      user_id: userId,
      role: 'super_admin',
    };
  }

  return {
    user_id: userId,
  };
}
