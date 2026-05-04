# @carecard/jwt-read

![Tests Passing](https://github.com/CareCard-ca/pkg-jwt-read/actions/workflows/ci.yml/badge.svg)
![Coverage](https://img.shields.io/badge/Coverage-80%25-orange)

Utility package for reading, parsing, and verifying JWTs in the CareCard ecosystem.

## Features

- **JWT Verification**: Middleware-like utilities for signature and role verification.
- **Express Integration**: Designed to work seamlessly with Express `req` objects.
- **Role Mapping**: Simple utility for translating internal role codes to human-readable names.
- **Claims Extraction**: Easy extraction of `sub` (clientId) and other JWT payload claims.
- **Expiration Management**: Helpers to check if a JWT is expired and calculate its remaining TTL.

## Installation

```bash
npm install @carecard/jwt-read
```

## Usage

### Middleware-like Verification (`verifyJwtAndRole`)

```javascript
const { verifyJwtAndRole, throwUsedTokenError } = require('@carecard/jwt-read');

// Create a verification function for 'admin' role
const verifyAdmin = verifyJwtAndRole('admin', publicKey, throwUsedTokenError);

// In an Express controller/middleware
try {
    await verifyAdmin(req, res, next);
    // If successful, req.jwt contains { header, payload }
    console.log(req.jwt.payload.sub);
} catch (error) {
    // Handle verification error
}
```

### Direct JWT Reading

```javascript
const { verifyJwt, isJwtExpired } = require('@carecard/jwt-read');

const result = verifyJwt(rawJwt, publicKey);
if (result && !isJwtExpired(result)) {
    console.log('JWT is valid and not expired:', result.payload);
}
```

### Role Utilities

```javascript
const { getNameOfRole, getCodeOfRole } = require('@carecard/jwt-read');

console.log(getNameOfRole('ad')); // Result: 'admin'
console.log(getCodeOfRole('super_admin')); // Result: 'su'
```

## Testing

Run tests using:

```bash
npm test
```

To run tests with coverage:

```bash
npm run test:coverage
```

To run type tests:

```bash
npm run test:types
```

## Architecture

The package is organized into several modules:
- `jwtLib`: Main logic for JWT verification, extraction, and Express integration.
- `jwtRoles`: Role mapping between internal codes and names.

All modules are exported through the main `index.js`.
