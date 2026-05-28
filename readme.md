# @carecard/jwt-read

![Tests Passing](https://github.com/CareCard-ca/pkg-jwt-read/actions/workflows/ci.yml/badge.svg)
![Coverage](https://img.shields.io/badge/Coverage-80%25-orange)

Utility package for reading, parsing, and verifying JWTs in the CareCard
ecosystem. It also provides the shared request middleware used by `ms-*`
services to accept either an `ms-auth` JWT or an opaque server-auth token
introspected by `ms-auth`.

## Features

- **JWT Verification**: Middleware-like utilities for signature and role verification.
- **Express Integration**: Designed to work seamlessly with Express `req` objects.
- **Role Mapping**: Simple utility for translating internal role codes to human-readable names.
- **Claims Extraction**: Easy extraction of `sub` (clientId) and other JWT payload claims.
- **Expiration Management**: Helpers to check if a JWT is expired and calculate its remaining TTL.
- **Service JWTs**: Helpers for verifying and extracting microservice-to-microservice JWTs with standard `iss`, `sub`, `aud`, `iat`, and `exp` claims.
- **JWT or Server Auth**: Middleware helpers that verify normal JWTs locally and
  call a service-provided introspector for opaque server-auth tokens.

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

### Auth RLS Role Semantics

`ms-auth` treats a JWT or server-auth payload containing `roles: ["ad"]` as the
auth-service super-admin signal for its RLS policies. Consumers may map `ad` to
UI/domain names such as `super_admin`, but middleware should preserve the
original roles array on the request context so services can make
database-context decisions consistently.

Docs that mention `ms-auth` controller internals should use concise action
names such as `loginUser`, `registerUser`, `getUserDetail`, and `renewJwt`.
Access level is conveyed by route middleware and endpoint placement, not by
`public`/`protected`/`admin`/`Handler` suffixes.

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

### JWT Or Server-Auth Middleware

Use the `OrServerAuth` helpers on app-facing `ms-*` routes that should accept
both current authentication modes. The JWT path verifies locally with the
`ms-auth` public key. The server-auth path calls the provided introspector,
which should send the opaque token to
`POST /api/v1/ms-auth/server-auth/introspect` with the receiving service's
service JWT.

```javascript
const { jwtGetRoleCode, jwtVerifyOrServerAuth, jwtVerifyOrServerAuthAndHasRole } = require('@carecard/jwt-read');

const verifyUser = jwtVerifyOrServerAuth(msAuthPublicKey, token => introspectServerAuthTokenWithMsAuth(token), throwNotAuthorizedError);

const verifyAdmin = jwtVerifyOrServerAuthAndHasRole(
  jwtGetRoleCode('admin'),
  msAuthPublicKey,
  token => introspectServerAuthTokenWithMsAuth(token),
  throwNotAuthorizedError,
);
```

The introspector must return claims for valid tokens. This package normalizes
those claims onto `req.jwt.payload` with `authMode: "server-auth"` and
`auth_mode: "server-auth"` so services can keep their existing JWT-backed
database context and role checks.

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
