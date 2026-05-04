# Coding Guidelines for @carecard/jwt-read

This package provides utilities for reading, parsing, and verifying JWTs in the CareCard ecosystem. It depends on `@carecard/auth-util` for low-level cryptographic operations.

## Architecture and Design

The package follows a simple functional utility pattern, organized into modular libraries:

- **Entry Point**: `index.js` - Centralized export of all utility functions.
- **JWT Verification Layer (`lib/jwtLib.js`)**:
    - Handles signature verification of JWTs using public keys.
    - Provides middleware-like functions for Express (e.g., `verifyJwtAndRole`).
    - Handles extraction of `sub` (clientId) and other claims from JWT objects.
    - Includes expiration checks and TTL calculations.
    - Integration with `@carecard/common-util` for standardized error throwing.
- **Role Mapping Layer (`lib/jwtRoles.js`)**:
    - Translates between internal role codes (e.g., `ad`) and human-readable role names (e.g., `admin`).

## Coding Patterns

- **Express Compatibility**: Many functions are designed to work with Express `req` objects or objects that follow a similar structure (having a `jwt` property).
- **Graceful Failure**: Use `NoThrow` variants (e.g., `verifyJwtNoThrow`) when you want to handle errors manually instead of letting the library throw exceptions.
- **Dependency Usage**: Use `@carecard/auth-util` for any signature verification or JWT decomposition to maintain consistency.
- **Error Handling**: Use the provided `throwError` and `throwUsedTokenError` to maintain consistent error responses across the ecosystem.

## Testing

- **Framework**: Mocha.
- **Directory**: `test/`.
- **Test Structure**:
    - `lib/` modules should have corresponding test files in `test/`.
    - `test/attachedMethods.test.js`: Tests methods that are attached to objects or used as context.
    - `test/types.test.ts`: Verifies TypeScript type definitions using `tsc`.
- **Environment**: Set `NODE_ENV=test`.

## Future Development

- Ensure all new features are covered by tests.
- When adding new roles, update `lib/jwtRoles.js`.
- Keep the `index.d.ts` up to date with any changes to the exported API.
