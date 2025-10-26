module.exports = {
    getNameOfRoleFromCode,
    getCodeFromNameOfRole,
}

function getNameOfRoleFromCode( roleCode ) {
    const codesToCategory = {
        "ad": "admin",
        "su": "super_admin",
    }
    return codesToCategory[ roleCode ] || "";
}

function getCodeFromNameOfRole( roleCode ) {
    const codesToCategory = {
        "admin": "ad",
        "super_admin": "su",
    }
    return codesToCategory[ roleCode ] || "";
}
