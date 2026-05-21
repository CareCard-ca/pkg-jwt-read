# Codex Instructions For pkg-jwt-read

Follow the root workspace instructions in `/Users/pankajpriscilla/SO_CareCardCa/.codex/AGENTS.md` first. This file adds rules specific to the `@carecard/jwt-read` package.

## Non-Negotiable Instructions

- Never use TypeScript type `any`. Use specific JWT, Express, request, payload, header, role, generic, or `unknown` types with narrowing.
- Always follow this repository's coding style, naming conventions, and CommonJS project structure.
- Always use Test-Driven Development: add or update the relevant Mocha or type tests before changing behavior.
- Never suppress errors, linter warnings, TypeScript errors, or failing tests. Handle the underlying issue.
- Do not add new dependencies unless they are absolutely needed. Ask for confirmation first with the reason and tradeoff.
- Before finalizing work in this repository, run every script in `.husky/` and fix anything they report.

## Package Shape

- Keep `index.js` as the centralized public export surface.
- Keep TypeScript declarations in `index.d.ts` aligned with every public export in `index.js`.
- Keep JWT verification and request attachment behavior in `lib/jwtLib.js`.
- Keep role code/name mapping and JWT context behavior in `lib/jwtRoles.js`.
- Preserve the package's CommonJS module style unless the repository is intentionally migrated.
- Keep backward-compatible deprecated exports unless the user explicitly asks to remove them.

## JWT And Security Rules

- Treat JWT parsing, signature verification, visitor tokens, authorization roles, and request context as security-sensitive.
- Use `@carecard/auth-util` for JWT decomposition and signature verification. Do not duplicate cryptographic logic here.
- Use `@carecard/common-util` error helpers for login and authorization failures.
- Preserve the distinction between throwing APIs and `NoThrow` APIs. `NoThrow` variants should set the attached request property to `null` for invalid tokens without hiding unexpected implementation errors.
- Do not log JWTs, token fragments, public/private keys, decoded payloads, authorization headers, visitor headers, or sensitive request data.
- Keep user-facing errors safe and avoid exposing token internals or verification details.

## Types And API Contracts

- Model JWT header, payload, request attachment, visitor attachment, role, and context shapes explicitly in `index.d.ts`.
- Prefer `AuthenticatedRequest`, `JwtHeader`, `JwtPayload`, `JwtParts`, `JwtRequestObject`, `VisitorRequestObject`, and `JwtContext` over loose request objects.
- When existing declarations are too loose, improve them with specific types as part of the touched change instead of adding new loose types.
- Keep overloads for context-bound helpers such as `jwtIsExpired` readable and covered by type tests.
- Update `test/types.test.ts` whenever public types, exports, overloads, or attached request methods change.

## Tests

- Use Mocha for runtime tests under `test/`.
- Use `test/types.test.ts` for TypeScript declaration coverage.
- Add focused tests for valid JWTs, invalid JWTs, missing headers, role checks, visitor token extraction, expiration behavior, and request attachment behavior when those areas change.
- Keep tests deterministic and avoid relying on real external services.
- Before pushing or finalizing, run `.husky/pre-commit`; it runs lint fixing, formatting, and `npm run test:All`.
