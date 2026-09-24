const { jwtClientId } = require('./jwtLib');
const { throwNotAuthorizedError } = require('@carecard/common-util');

module.exports = {
  getNameOfRoleFromCode,
  getCodeFromNameOfRole,
  getContext,
  getApplicationContext,
};

// Pattern: Context Projection - carries verified ownership into the existing caller context.
function getApplicationContext(req) {
  const audience = req?.jwt?.payload?.aud;
  if (typeof audience !== 'string' || audience.trim().length === 0) {
    throwNotAuthorizedError();
  }
  return { ...getContext(req), application_namespace: audience };
}

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
  const userAuthorization = getUserAuthorization(req);
  const context = {
    user_id: userId,
  };

  if (Array.isArray(roles) && roles.includes('ad')) {
    context.role = 'super_admin';
  }

  if (userAuthorization) {
    context.authorizationContext = userAuthorization.payload;
    context.userAuthorization = userAuthorization;
  }

  return context;
}

function getUserAuthorization(req) {
  const userAuthorization = req?.userAuthorization;
  if (!userAuthorization || typeof userAuthorization !== 'object') {
    return null;
  }
  if (!userAuthorization.payload || typeof userAuthorization.payload !== 'object') {
    return null;
  }

  return userAuthorization;
}
