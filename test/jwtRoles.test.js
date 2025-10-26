const { describe, it } = require( "mocha" );
const assert = require( "assert" );
const jwtRoles = require( '../lib/jwtRoles' );

describe( "Lib jwt Roles", function () {

    it( "jwtAdminRoleCode", function () {

        // Act
        const receivedCode = jwtRoles.getCodeFromNameOfRole( "admin" );
        const receivedName = jwtRoles.getNameOfRoleFromCode( receivedCode );

        // Assert
        assert.deepStrictEqual( receivedCode, "ad" );
        assert.deepStrictEqual( receivedName, "admin" );
    } );

    it( "jwtSuperAdminRoleCode", function () {

        // Act
        const receivedCode = jwtRoles.getCodeFromNameOfRole( "super_admin" );
        const receivedName = jwtRoles.getNameOfRoleFromCode( receivedCode );

        // Assert
        assert.deepStrictEqual( receivedCode, "su" );
        assert.deepStrictEqual( receivedName, "super_admin" );
    } );

    it( "jwtDefaultRole", function () {

        // Act
        const receivedCode = jwtRoles.getCodeFromNameOfRole();
        const receivedName = jwtRoles.getNameOfRoleFromCode();

        // Assert
        assert.deepStrictEqual( receivedCode, "" );
        assert.deepStrictEqual( receivedName, "" );
    } );
} );
