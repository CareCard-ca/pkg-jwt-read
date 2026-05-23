# Codex Instructions For pkg-jwt-read

These instructions apply to the `pkg-jwt-read` repository. This file is self-contained:
it includes the workspace-level instructions that were previously read from
`/Users/pankajpriscilla/SO_CareCardCa/.codex/AGENTS.md`, followed by
repository-specific guidance. Removing the workspace-level `.codex/AGENTS.md`
must not change the rules for this repository.

## Embedded Workspace Instructions

These instructions apply to the whole workspace. The workspace is a collection of independent repositories, not one monorepo. Treat each `api-*`, `pkg-*`, and `app-dashboard` directory as its own project with its own package scripts, Git status, and test commands.

### Non-Negotiable Instructions

- **Never use TypeScript type `any`.** Always use specific domain types, generics, `unknown` with proper narrowing, or existing project types.
- **Always follow the owner's coding style.** Preserve the existing style in the file and repository you are editing.
- **Always follow the owner's naming conventions.** Use meaningful function, variable, file, test, and type names that match the surrounding code.
- **Always follow the existing project structure.** Put code, tests, docs, services, validation, transforms, components, and helpers where the current repository already expects them.
- **Always use Test-Driven Development.** Write or update focused tests first, verify they fail for the missing behavior when practical, then implement the code.
- **Never suppress errors, TypeScript errors, linter warnings, or failing tests.** Do not add `eslint-disable`, `@ts-ignore`, broad catches, empty catches, or other suppression unless the user explicitly requests it. Handle the issue properly.
- **Do not add new dependencies unless they are clearly necessary.** If a dependency might be needed, stop and ask for confirmation first, with a clear reason, tradeoff, and why existing code cannot reasonably solve it.
- **Before finalizing any response for a repository, run every script in that repository's `.husky` directory.** Do not bypass hooks. If a `.husky` script fails, fix the underlying issue and rerun it. If it cannot run because of environment constraints, report the exact script and reason.

### Core Coding Principles

- Prefer minimal dependencies. Do not add libraries or frameworks unless the existing stack cannot reasonably solve the problem.
- Prefer implementing core logic directly with readable code over adding abstractions or packages.
- Explain architectural tradeoffs before major changes, especially changes that affect shared packages, API contracts, security, persistence, authentication, or frontend/backend boundaries.
- Favor readable, maintainable code over short clever code.
- Preserve the existing project style, file structure, naming style, module system, and test framework.
- Use Test-Driven Development: write or update focused tests first, then implement the code.
- Use meaningful function and variable names. Names should expose intent and domain behavior.
- Use specific types everywhere. Do not use `any`.
- Keep changes scoped and easy to review. Avoid unrelated formatting churn or opportunistic refactors.
- Use postgres functions and stored procedures instead of raw SQL.
- Use postgres and database search and other functionalities instead of doing it in controllers.
- Use different type postgres searches, like fuzzy search, trigram search, full-text search, and vector search.
- When possible, push the complexity of data saving, edit and access to the database.

### Repo Workflow

- Work from the specific project directory you are changing, such as `api-auth`, `api-contact-us`, `api-institutions`, `pkg-common-util`, or `app-dashboard`.
- Check local status inside the affected project before editing. These directories are independent Git repositories.
- Do not revert or overwrite changes you did not make.
- Before finishing a code change, run the relevant tests and lint/format checks for the affected project.
- Before finalizing any response after code changes, run all validation commands required by the affected repository. This includes relevant package scripts, all commands in `.husky` hooks, and all scripts or documented validation commands in `.junie`.
- When a project has a `.junie` directory, read the applicable `.junie` guidance for that repository before editing. Before the final response, run every executable script in `.junie` and every validation/test command explicitly documented there. Fix any issues those commands report before finalizing.
- When a project has files in `.husky`, run every direct script in `.husky` before finishing. Fix any issue they report before finalizing. Never skip, bypass, or silence these scripts.
- If a required `.junie` or `.husky` command cannot be run because of a missing dependency, unavailable service, credentials, or environment limitation, clearly report the exact command, the failure reason, and the remaining risk in the final response.
- Avoid editing generated or heavy-output directories such as `node_modules`, `dist`, `coverage`, `.next`, `logs`, and generated stores unless the task explicitly requires it.

### Backend Microservices

The `api-*` directories are independent Express/Postgres backend services. Most JavaScript services use CommonJS, Mocha, Supertest, Docker Compose database tests, `@carecard/*` packages, and `sub-apps` controller/router/model patterns. TypeScript services such as `api-contact-us` and `api-template-ts` use Jest or TypeScript tooling and should keep their existing TS style.

- Keep service-specific controllers thin. Controllers should read as a clear workflow: parse input, authorize, validate, call domain/model logic, build response, and pass errors to `next`.
- Extract multiline chunks into descriptively named functions in the appropriate `controllerLib`, `commonLib`, `sub-apps/lib`, model helper, or shared `pkg-*` package.
- Avoid defining reusable workflow, validation, mapping, response, authorization, parsing, or domain helpers in the same controller/app file where they are immediately used.
- Prefer straightforward sequencing of named helper calls over deeply nested conditionals.
- Preserve current behavior unless fixing a clear bug, security issue, or documented contract problem.
- Keep application setup files such as `app.js`, `app.ts`, `bin/www`, and routers focused on composition and wiring.
- Use existing Express middleware patterns: `requestContext`, CORS configuration, Helmet, cookie parsing, body-size limits, rate limits where already present, routers, 404 handling, logging middleware, and centralized error handlers.
- Use structured, actionable logging for important application events, external calls, state transitions, failures, and security-relevant actions.
- Do not log secrets, tokens, passwords, credentials, personal identifiers, full request payloads, or stack traces in user-facing responses.
- Keep logs useful for production monitoring. Avoid noisy logs that fire on every trivial branch unless they are request/access logs already established by the service.

### Shared Packages And API Contracts

The `pkg-*` directories are reusable CareCard packages. Shared API response, error, authentication, JWT, and validation behavior belongs there when it is common across services.

- Prefer `@carecard/common-util`, `@carecard/auth-util`, `@carecard/jwt-read`, and `@carecard/validate` over duplicated local implementations.
- For API responses and errors, use the standardized `@carecard/common-util` behavior where possible: `requestContext`, `sendResponse`, `createError`, `notFound404`, `appErrorHandler`, error throw helpers, case converters, and `ApiErrorType`.
- Do not create or maintain duplicated common response/error helpers inside each `api-*` service. If a reusable capability is missing, add it to the correct `pkg-*` package and update callers.
- Keep service-local response code limited to service-specific mapping or wiring.
- Preserve the standard response shape expected by the dashboard: `success`, `status`, `statusCode`, `code`, `message`, `data`, `error`, `details`, and `meta`.
- Include request/correlation context where available through `requestId`, `traceId`, and `meta`.
- Error responses must be safe for users and useful for debugging without exposing secrets, tokens, credentials, stack traces, or sensitive personal data.
- Map validation, authentication, authorization, not-found, conflict, bad input, file, and unexpected failures to distinct machine-readable codes.
- Prefer current direct exports from shared packages over deprecated nested exports. For example, prefer direct `@carecard/jwt-read` function names and direct `@carecard/auth-util` helpers.

### Validation Rules

- Keep request-boundary validation close to the API/controller layer.
- Use `validateWhitelistProperties()` once per validation boundary unless there is a specific documented reason to validate defensively again.
- Avoid hidden duplicate validation across controller and library layers for the same logical payload.
- Keep domain/library functions focused on domain behavior and assume validated inputs when called from validated controller paths.
- If a public/shared library function still needs defensive validation, document why and avoid repeating the exact same validation already done by the caller.
- Preserve validation behavior for invalid, missing, extra, and valid fields.
- Pay attention to nested fields, dot-notation paths, camelCase/snake_case conversion, and frontend response transforms.

### Tests

- Write or update tests before implementation whenever changing behavior.
- Testing is mandatory before finalizing code changes. Do not stop after implementation if tests, `.junie`, or `.husky` checks remain unrun.
- Code coverage must never be lower than the previous commit. When coverage tooling exists, compare against the previous commit or recorded baseline before finalizing, add tests to maintain or improve coverage, and never reduce coverage thresholds to make checks pass.
- Keep tests readable and domain-specific. Prefer explicit helper names over generic test utilities that hide important behavior.
- Use existing test frameworks and layouts:
  - JavaScript `api-*`: usually Mocha, Supertest, `test/index.test.js`, and Docker-backed Postgres scripts.
  - TypeScript `api-*`: usually Jest and `tests/index.test.ts`.
  - `pkg-*`: Mocha plus TypeScript type tests where present.
  - `app-dashboard`: Vitest, React Testing Library, mock API tests, and Selenium for end-to-end flows.
- For database tests, use existing seed, migration, rollback, and cleanup patterns. Keep tests isolated and make cleanup reliable even after failures.
- Add tests for API success responses, validation errors, auth/authz errors, JWT errors, not-found/conflict cases, and unexpected error handling when those paths change.
- For frontend changes, test validation, transforms, query/mutation wrappers, components, and user-visible flows at the narrowest practical level first.
- If any test or repository check fails, fix the issue and rerun the failing command. Only finalize with failing checks when the failure is unrelated to the change or blocked by environment constraints, and document that explicitly.

### Dashboard Frontend

`app-dashboard` is a Next.js App Router TypeScript app using MUI, React Query, `next-intl`, and shared CareCard utilities. It consumes `api-auth`, `api-institutions`, `api-contact-us`, and `api-user-profiles` through service modules.

- Keep backend URL definitions centralized in `src/services/api.routes.ts`.
- Keep fetch behavior centralized in `src/services/common/api`, especially `appFetch`, `api.client`, and `parseApiResponse`.
- Services should return typed app/domain objects or typed form states, not raw fetch responses.
- Keep validation in `*.validation.ts`, API calls in `*.queries.ts` or mutation helpers, mapping in `*.transform.ts`, and orchestration in `*.service.ts`.
- Preserve the standardized `ApiResponse` parsing behavior for both current backend responses and legacy/non-standard responses.
- Do not expose JWTs, session contents, or sensitive backend details in client components or logs.
- Respect `basePath: '/secure'`, server actions, middleware session renewal, mock API mode, and existing i18n message patterns.
- Use existing MUI and app component patterns. Do not introduce a new UI framework.

### Dependency And Version Guidance

- Keep CareCard package usage consistent with the service being changed.
- When standardizing response/error behavior, prefer `@carecard/common-util` `3.1.15` because it contains response and error functions aligned with `api-auth`.
- If package version changes are required, update lockfiles and verify affected services.
- Avoid broad dependency upgrades as part of feature or refactor work unless the task is specifically about dependencies.

### Security Requirements

- Treat authentication, authorization, JWT, password, email confirmation, recovery, file upload, CORS, rate limits, and error response behavior as security-sensitive.
- Never log or return secrets, tokens, passwords, credentials, private keys, full JWT payloads, or sensitive personal data.
- Use safe error messages for users and structured details only when they do not reveal sensitive implementation or data.
- Keep body-size limits, Helmet, CORS allow-lists, and rate-limit behavior intact unless a task explicitly changes them.
- Document remaining security concerns that require product, infrastructure, or deployment decisions.

## Repository-Specific Instructions

### Non-Negotiable Instructions

- Never use TypeScript type `any`. Use specific JWT, Express, request, payload, header, role, generic, or `unknown` types with narrowing.
- Always follow this repository's coding style, naming conventions, and CommonJS project structure.
- Always use Test-Driven Development: add or update the relevant Mocha or type tests before changing behavior.
- Never suppress errors, linter warnings, TypeScript errors, or failing tests. Handle the underlying issue.
- Do not add new dependencies unless they are absolutely needed. Ask for confirmation first with the reason and tradeoff.
- Before finalizing work in this repository, run every script in `.husky/` and fix anything they report.

### Package Shape

- Keep `index.js` as the centralized public export surface.
- Keep TypeScript declarations in `index.d.ts` aligned with every public export in `index.js`.
- Keep JWT verification and request attachment behavior in `lib/jwtLib.js`.
- Keep role code/name mapping and JWT context behavior in `lib/jwtRoles.js`.
- Preserve the package's CommonJS module style unless the repository is intentionally migrated.
- Keep backward-compatible deprecated exports unless the user explicitly asks to remove them.

### JWT And Security Rules

- Treat JWT parsing, signature verification, visitor tokens, authorization roles, and request context as security-sensitive.
- Use `@carecard/auth-util` for JWT decomposition and signature verification. Do not duplicate cryptographic logic here.
- Use `@carecard/common-util` error helpers for login and authorization failures.
- Preserve the distinction between throwing APIs and `NoThrow` APIs. `NoThrow` variants should set the attached request property to `null` for invalid tokens without hiding unexpected implementation errors.
- Do not log JWTs, token fragments, public/private keys, decoded payloads, authorization headers, visitor headers, or sensitive request data.
- Keep user-facing errors safe and avoid exposing token internals or verification details.

### Types And API Contracts

- Model JWT header, payload, request attachment, visitor attachment, role, and context shapes explicitly in `index.d.ts`.
- Prefer `AuthenticatedRequest`, `JwtHeader`, `JwtPayload`, `JwtParts`, `JwtRequestObject`, `VisitorRequestObject`, and `JwtContext` over loose request objects.
- When existing declarations are too loose, improve them with specific types as part of the touched change instead of adding new loose types.
- Keep overloads for context-bound helpers such as `jwtIsExpired` readable and covered by type tests.
- Update `test/types.test.ts` whenever public types, exports, overloads, or attached request methods change.

### Tests

- Use Mocha for runtime tests under `test/`.
- Use `test/types.test.ts` for TypeScript declaration coverage.
- Add focused tests for valid JWTs, invalid JWTs, missing headers, role checks, visitor token extraction, expiration behavior, and request attachment behavior when those areas change.
- Keep tests deterministic and avoid relying on real external services.
- Before pushing or finalizing, run `.husky/pre-commit`; it runs lint fixing, formatting, and `npm run test:All`.
