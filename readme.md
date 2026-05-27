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
- **Service JWTs**: Helpers for verifying and extracting microservice-to-microservice JWTs with standard `iss`, `sub`, `aud`, `iat`, and `exp` claims.

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

### Service-To-Service JWTs

Use service JWT verification helpers for backend service calls. The sending
service signs the token with `@carecard/auth-util`. The receiving service uses
this package to verify the token with the sending service public key and check
the expected issuer and audience.

```javascript
const { jwtCreateServiceAuthorizationHeader } = require('@carecard/auth-util');
const { jwtVerifyService } = require('@carecard/jwt-read');

const authorization = jwtCreateServiceAuthorizationHeader({
  issuer: 'ms-institutions',
  audience: 'ms-auth',
  privateKey: institutionsPrivateKey,
});

app.use(jwtVerifyService(institutionsPublicKey, 'ms-institutions', 'ms-auth', throwNotAuthorizedError));
```

Service JWT payloads follow standard JWT semantics:

- `iss`: sending service
- `sub`: sending service identity
- `aud`: receiving service
- `iat`: issued-at NumericDate
- `exp`: expiration NumericDate

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
