---
name: pkg-jwt-read-jwt-middleware-library
description: 'Use when changing pkg-jwt-read JWT parsing, middleware, visitor tokens, role checks, auth context, package exports, or tests.'
---

# Package JWT Read

Non-negotiable TDD rule: Always write the failing test first, run it to confirm it fails for the intended reason, then implement the code and rerun the test until it passes. Test Driven Development is required for all coding work and must not be skipped. For documentation- or skill-only edits, add or update the relevant validation check before changing the prose.

Non-negotiable repository isolation rule: Every repository must run its Husky hooks and tests using only files, code, fixtures, dependencies, and services contained within that repository. Tests and Husky scripts must not import, require, read, execute, or otherwise depend on sibling repositories or paths outside the repository root. app-e2e-tests is the only exception because cross-repository end-to-end testing is its explicit responsibility.

Non-negotiable code organization rule: Functions with the same or equivalent behavior must use the same or clearly corresponding descriptive names across CareCard repositories, and equivalent functionality must live in files with the same names within each repository's established architecture. No backward compatibility names, aliases, or duplicate locations are allowed.

## Purpose

CareCard JWT read package for parsing, request attachment, visitor tokens, role mapping, JWT-or-server-auth authorization middleware, exports, and tests.

## When To Use

- Use when changing pkg-jwt-read JWT parsing, server-auth introspection
  middleware, visitor tokens, role checks, auth context, package exports, or
  tests.
- Pair with `carecard-workspace-standards` when the task affects shared CareCard conventions or cross-repository contracts.

## When Not To Use

- Do not use for service-local behavior that should remain inside one API or app.
- Do not change package public APIs without updating consumers and compatibility tests.

## Relevant Files And Directories

- package entry files
- `src` when present
- `test`
- `package.json`
- `package-lock.json`
- `.husky`

## Coding Principles

- Preserve the repository structure, naming style, module system, and local helper patterns.
- Prefer readable, maintainable code with meaningful function, variable, file, and test names.
- Avoid new dependencies unless the existing stack cannot reasonably solve the task and the user confirms the tradeoff.
- Keep public exports stable and update CommonJS, ESM, TypeScript declaration, and compatibility surfaces together when present.

## Testing Expectations

- Write or update package tests before behavior or public API changes.
- Include type/export compatibility tests where the package already has them.
- Run package test, lint, type, and Husky validation commands required by the changed area.

## Safety Constraints

- Do not edit generated output, dependency folders, logs, coverage, dist, or build artifacts unless the task requires it.
- Do not revert or overwrite user changes; stage only requested skill or instruction files.
- Never suppress errors, lint failures, type failures, security failures, or failing tests; fix the underlying issue or report the blocker.
- Do not log or expose secrets, JWTs, passwords, credentials, private keys, sensitive personal data, SQL internals, or stack traces.

## Overview

Use this skill when working inside `pkg-jwt-read`, the `@carecard/jwt-read`
package. It provides utilities for reading, parsing, verifying, and attaching
JWT data in the CareCard ecosystem. It depends on `@carecard/auth-util` for
low-level cryptographic operations. It also exposes middleware helpers that
allow `ms-*` services to accept either an `ms-auth` JWT or an opaque server-auth
token introspected by `ms-auth`.

Use `$carecard-workspace-standards` for shared workspace, dependency, package,
testing, and security rules. Legacy `pkg-jwt-read/.codex` and
`pkg-jwt-read/.junie` guidance has been migrated into these skills; do not
depend on those folders being present.

## Non-Negotiable Rules

- Never use TypeScript type `any`. Use specific JWT, Express, request, payload,
  header, role, generic, or `unknown` types with narrowing.
- Follow this repository's coding style, naming conventions, and CommonJS
  project structure.
- Use Test-Driven Development: add or update relevant Mocha or type tests before
  changing behavior.
- Never suppress errors, linter warnings, TypeScript errors, or failing tests.
  Handle the underlying issue.
- Do not add dependencies unless absolutely needed. Ask for confirmation first
  with the reason and tradeoff.
- Before finalizing work, run every direct script in `.husky` and fix anything
  they report.

## Package Shape

- Keep `index.js` as the centralized public export surface.
- Keep TypeScript declarations in `index.d.ts` aligned with every public export
  in `index.js`.
- Keep JWT verification and request attachment behavior in `lib/jwtLib.js`.
- Keep role code/name mapping and JWT context behavior in `lib/jwtRoles.js`.
- Preserve the package's CommonJS module style unless the repository is
  intentionally migrated.
- Keep backward-compatible deprecated exports unless the user explicitly asks to
  remove them.

## JWT Verification Layer

`lib/jwtLib.js` owns:

- Signature verification using public keys.
- Middleware-like functions for Express, such as `verifyJwtAndRole`.
- Service-to-service JWT verification and extraction helpers:
  `jwtValidateAndExtractService` and `jwtVerifyService`.
- JWT-or-server-auth helpers: `jwtValidateAndExtractOrServerAuth`,
  `jwtVerifyOrServerAuth`, and `jwtVerifyOrServerAuthAndHasRole`.
- Extraction of `sub`/clientId and other claims from JWT objects.
- Expiration checks and TTL calculations.
- Request attachment behavior for authenticated JWT objects and visitor tokens.
- Request attachment behavior for compact scoped authorization-context JWTs
  from `X-Authorization-Context` as `req.userAuthorization`.
- Shared header defaults for scoped authorization context:
  `DEFAULT_USER_AUTHORIZATION_HEADER_NAME` and
  `DEFAULT_USER_AUTHORIZATION_MAX_TOKEN_LENGTH`. Token issuers and consuming
  services should import these constants instead of duplicating the header name
  or 2048-character limit.
- Server-auth request attachment behavior that normalizes introspected claims
  into `req.jwt.payload` with `authMode: "server-auth"` and
  `auth_mode: "server-auth"`.
- Server-auth email confirmation claims are copied only when present. The
  `emailVerified`, `email_verified`, `emailConfirmed`, and `email_confirmed`
  aliases retain their exact names and values, and omission remains omission.
- Integration with `@carecard/common-util` for standardized login and
  authorization errors.

Use `@carecard/auth-util` for JWT creation, decomposition, and signature
verification. Do not duplicate cryptographic logic in this package.

JWT creation functions do not belong in this package. Service-to-service token
creation belongs in `@carecard/auth-util` via `jwtCreateServiceToken` and
`jwtCreateServiceAuthorizationHeader`.

Opaque server-auth token creation, hashing, persistence, and introspection
belong in `ms-auth`. This package only accepts a caller-provided introspector
function and normalizes valid introspection claims into the existing request
JWT context.

Service JWTs must follow standard JWT claim semantics. They use `iss` for the
sending service, `sub` for the sending service identity, `aud` for the
receiving service, and NumericDate `iat`, `exp`, and optional `nbf` claims.
Receivers must verify the signature with the sending service public key and
must check expected issuer, audience, subject, and lifetime. Do not add
CareCard-specific replacement claims when a registered JWT claim covers the
same meaning.

Scoped authorization-context JWTs from `X-Authorization-Context` are independent
from the primary `Authorization` JWT. They must attach to
`req.userAuthorization`, not `req.jwt`, and they should be read as raw JWT
header values rather than `Bearer` tokens. Existing JWT and server-auth
middleware may accept an optional trailing `userAuthorization` options object;
preserve legacy behavior when that option is omitted.

## Role Mapping Layer

`lib/jwtRoles.js` owns translation between internal role codes and human-readable
role names, such as `ad` and `admin`.

- Update `lib/jwtRoles.js` when adding or changing roles.
- Keep role code, role name, context, and authorization helper behavior covered
  by focused tests.
- Preserve existing role semantics unless a task explicitly changes
  authorization behavior.
- Preserve the original JWT `roles` array on request context. `ms-auth` RLS
  treats a payload containing `ad` as the auth-service super-admin signal;
  dashboard code may map that to `super_admin`, but middleware must not hide,
  rename, or drop the raw role payload needed by backend database contexts.

## NoThrow And Error Behavior

- Preserve the distinction between throwing APIs and `NoThrow` APIs.
- `NoThrow` variants should set the attached request property to `null` for
  invalid tokens without hiding unexpected implementation errors.
- Use provided `throwError` and `throwUsedTokenError` patterns to keep
  ecosystem error responses consistent.
- Use `@carecard/common-util` error helpers for login and authorization
  failures.
- Keep user-facing errors safe and avoid exposing token internals or
  verification details.

## Security Rules

- Treat JWT parsing, signature verification, server-auth introspection,
  visitor tokens, authorization roles, and request context as
  security-sensitive.
- Do not log JWTs, token fragments, public/private keys, decoded payloads,
  authorization headers, visitor headers, or sensitive request data.
- Keep missing headers, invalid signatures, expired tokens, revoked or invalid
  server-auth tokens, role failures, and used-token errors behaviorally
  distinct where existing APIs do so.

## Types And API Contracts

- Model JWT header, payload, server-auth introspection claims, request
  attachment, visitor attachment, user authorization attachment, role, and
  context shapes explicitly in
  `index.d.ts`.
- Prefer `AuthenticatedRequest`, `JwtHeader`, `JwtPayload`, `JwtParts`,
  `JwtRequestObject`, `VisitorRequestObject`, and `JwtContext` over loose
  request objects.
- When existing declarations are too loose, improve them with specific types as
  part of the touched change instead of adding new loose types.
- Keep overloads for context-bound helpers such as `jwtIsExpired` readable and
  covered by type tests.
- Update `test/types.test.ts` whenever public types, exports, overloads, or
  attached request methods change.

## Tests

- Use Mocha for runtime tests under `test`.
- `lib` modules should have corresponding test files under `test`.
- `test/attachedMethods.test.js` covers methods attached to objects or used as
  context.
- `test/types.test.ts` verifies TypeScript declarations with `tsc`.
- Add focused tests for valid JWTs, invalid JWTs, missing headers, role checks,
  visitor token extraction, expiration behavior, request attachment behavior,
  server-auth introspection success/failure, NoThrow behavior, and
  context-bound helpers when those areas change.
- Set `NODE_ENV=test` where tests or scripts require it.
- Keep tests deterministic and avoid real external services.

## Validation

Useful commands:

- `npm run lint`
- `npm run lint:fix`
- `npm run format`
- `npm run format:check`
- `npm run test`
- `npm run test:types`
- `npm run test:coverage`
- `npm run test:All`

Before pushing or finalizing, run every direct `.husky` script. The current
`.husky/pre-commit` runs:

```bash
npm run lint:fix
npm run format
npm run test:All
```

If any validation command cannot run, report the exact command, failure reason,
and remaining risk.

## Remote Git Operations Guardrail

Do not run remote Git or GitHub operations unless the current user request explicitly asks for them. This includes `git fetch`, `git pull`, `git push`, `git push --delete`, remote branch cleanup, GitHub API calls, and any `gh pr` command that creates, updates, readies, merges, closes, or cleans up a pull request. Do not infer permission from branch names, validation needs, prior workflow habits, or convenience; ask first when remote state would help but was not requested.

## Agent Guidance Git Workflow

When this skill or any repository-owned `.agents` guidance changes, use the
repository's agents-only Git workflow:

1. Work from the affected repository root and confirm only intended `.agents`
   files changed.
2. Use `development` as the base branch when `origin/development` exists;
   otherwise use the repository's default base branch, usually `main`.
3. Create or update `feature/codex` from the updated remote base branch and
   commit all the changed `.agents` guidance files there.
4. Push `feature/codex`, create or reuse a pull request into the base branch,
   and mark the pull request ready for review with `gh pr ready <number>`.
5. Squash-merge with administrator privileges and delete the remote branch:

   ```sh
   gh pr merge <number> --squash --admin --delete-branch
   ```

6. After merge, update the local base branch and remove the local feature
   branch:

   ```sh
   git fetch origin <base> --prune
   git switch <base>
   git pull --ff-only origin <base>
   git branch -d feature/codex
   git ls-remote --heads origin feature/codex
   ```

Do not commit or push `.agents` guidance changes directly from `development`
or `main`. Do not stage unrelated files, generated output, dependency folders,
build artifacts, logs, or `.DS_Store`.
