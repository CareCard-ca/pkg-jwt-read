---
name: carecard-workspace-standards
description: Follow the shared SO_CareCardCa/CareCard workspace coding, testing, repository, dependency, shared package, frontend, database, API response, and security standards. Use before modifying, testing, reviewing, or debugging any api-*, pkg-*, app-*, website, dashboard, or other CareCard repository in this workspace, especially when choosing validation commands, package boundaries, TypeScript types, dependencies, API contracts, database logic, service patterns, or frontend architecture.
---

# CareCard Workspace Standards

## Workspace Model

Treat `/Users/pankajpriscilla/SO_CareCardCa` as a collection of independent Git
repositories, not as one monorepo. Work from the specific child repository
being changed. Each `api-*`, `pkg-*`, and `app-*` directory has its own package
scripts, Git status, test commands, style, naming, structure, test framework,
and Husky hooks.

## Agent Configuration

Keep agent runtime configuration in `.agents/config.toml`:

- `approval_policy = "never"`
- `sandbox_mode = "danger-full-access"`

Follow the current session permissions when they differ from repository-stored
config.

## Non-Negotiable Rules

- Never use TypeScript type `any`; use specific domain types, generics,
  existing project types, or `unknown` with proper narrowing.
- Follow the owner's coding style, naming conventions, and project structure.
- Put code, tests, docs, services, validation, transforms, components, and
  helpers where the current repository expects them.
- Use Test-Driven Development for behavior changes: write or update focused
  tests first, verify they fail for the missing behavior when practical, then
  implement.
- Never suppress errors, TypeScript errors, linter warnings, authorization
  failures, RLS failures, build failures, hydration issues, or failing tests.
  Do not add `eslint-disable`, `@ts-ignore`, broad catches, empty catches, or
  similar suppression unless explicitly requested.
- Do not add dependencies unless clearly necessary. If one might be needed, ask
  first with the reason, tradeoff, and why existing code cannot solve it.
- Before finalizing repository work, run the affected repository's relevant
  tests, lint/format checks, validation commands, and every direct script in
  `.husky`. Fix failures and rerun. If blocked, report the exact command,
  reason, and remaining risk.

## Coding Principles

- Prefer minimal dependencies and readable direct implementation over new
  libraries, frameworks, clever abstractions, or broad rewrites.
- Explain architectural tradeoffs before major changes, especially changes to
  shared packages, API contracts, security, persistence, authentication, or
  frontend/backend boundaries.
- Preserve the existing file structure, module system, naming style, and test
  framework.
- Keep changes scoped and easy to review. Avoid unrelated formatting churn,
  opportunistic refactors, and edits in generated or heavy-output directories
  such as `node_modules`, `dist`, `coverage`, `.next`, `logs`, and generated
  stores.
- Use meaningful names that expose intent and domain behavior.
- Prefer PostgreSQL functions, stored procedures, database search, fuzzy search,
  trigram search, full-text search, vector search, and database-side
  persistence/access behavior when that matches the service design.
- Push data saving, editing, search, access, and aggregation complexity into the
  database when it is the safer source of truth.
- Avoid controller-side or one-off raw SQL implementations when a PostgreSQL
  function, stored procedure, or established database search primitive is the
  clearer source of truth.

## Repository Workflow

1. Change into the affected child repository.
2. Run `git status --short` there before editing.
3. Preserve user changes. Do not revert or overwrite changes you did not make.
4. Read local repository guidance from `.agents/skills` before editing.
5. When updating a repository, adding a feature, fixing a bug, or making any
   other significant change, update the relevant `.agents` skill and
   documentation in the same change so repository guidance stays current.
6. Run targeted tests first, then broader repository checks.
7. Run every direct `.husky` script before finishing. Do not bypass hooks.

## Shared Packages And API Contracts

- Prefer `@carecard/common-util`, `@carecard/auth-util`, `@carecard/jwt-read`,
  and `@carecard/validate` over duplicated local implementations.
- The source code for `@carecard/*` packages lives in sibling `pkg-*`
  repositories such as `pkg-common-util`, `pkg-auth-util`, `pkg-jwt-read`, and
  `pkg-validate`.
- For API responses and errors, use standardized `@carecard/common-util`
  behavior where possible: `requestContext`, `sendResponse`, `createError`,
  `notFound404`, `appErrorHandler`, error throw helpers, case converters, and
  `ApiErrorType`.
- Do not create or maintain duplicated common response or error helpers inside
  each `api-*` service.
- Keep service-local response code limited to service-specific mapping or
  wiring.
- Add broadly useful shared functionality to the relevant `pkg-*` package
  instead of duplicating it locally in an `api-*` or `app-*` project.
- When changing a `pkg-*` package, write package tests first, increase that
  package's minor version in `package.json`, run `npm install` in the package,
  update consuming projects to the new package version, run `npm install` in
  each consumer, and validate all affected projects.
- Preserve the dashboard-facing API response shape: `success`, `status`,
  `statusCode`, `code`, `message`, `data`, `error`, `details`, and `meta`.
- Include request or correlation context where available through `requestId`,
  `traceId`, and `meta`.
- Error responses must be safe for users and useful for debugging without
  exposing secrets, tokens, credentials, stack traces, or sensitive personal
  data.
- Map validation, authentication, authorization, not-found, conflict, bad
  input, file, and unexpected failures to distinct machine-readable codes.
- Prefer current direct exports from shared packages over deprecated nested
  exports.

## Backend Microservices

Most JavaScript `api-*` services use CommonJS, Mocha, Supertest, Docker Compose
database tests, `@carecard/*` packages, and `sub-apps`
controller/router/model patterns. TypeScript services such as `api-contact-us`
and `api-template-ts` use Jest or TypeScript tooling and should keep their
existing TypeScript style.

- Keep controllers thin: parse input, authorize, validate, call domain/model
  logic, build a response, and pass errors to `next`.
- Extract multiline workflow, validation, mapping, response, authorization,
  parsing, and domain helpers into the existing `controllerLib`, `commonLib`,
  `sub-apps/lib`, model helper, or shared `pkg-*` package location.
- Avoid defining reusable workflow, validation, mapping, response,
  authorization, parsing, or domain helpers in the same controller or app file
  where they are immediately used.
- Prefer straightforward named helper calls over deeply nested conditionals.
- Preserve current behavior unless fixing a clear bug, security issue, or
  documented contract problem.
- Keep `app.js`, `app.ts`, `bin/www`, and routers focused on composition and
  wiring.
- Preserve existing middleware patterns: request context, CORS, Helmet, cookie
  parsing, body-size limits, rate limits, routers, 404 handling, logging
  middleware, and centralized error handlers.
- Use structured, actionable logging for important application events, external
  calls, state transitions, failures, and security-relevant actions.
- Do not log secrets, tokens, passwords, credentials, personal identifiers,
  full request payloads, or stack traces in user-facing responses.
- Keep logs useful for production monitoring. Avoid noisy logs that fire on
  every trivial branch unless they are request or access logs already
  established by the service.

## Validation Rules

- Keep request-boundary validation close to the API/controller layer.
- Use `validateWhitelistProperties()` once per validation boundary unless there
  is a specific documented reason to validate defensively again.
- Avoid hidden duplicate validation across controller and library layers for
  the same logical payload.
- Keep domain/library functions focused on domain behavior and assume validated
  inputs when called from validated controller paths.
- If a public/shared library function still needs defensive validation,
  document why and avoid repeating the exact same validation already done by the
  caller.
- Preserve validation behavior for invalid, missing, extra, and valid fields.
- Pay attention to nested fields, dot-notation paths, camelCase/snake_case
  conversion, and frontend response transforms.

## Database Migrations And Rollbacks

- Keep migration files in sync with rollback files.
- For every migration file, maintain exactly one matching rollback file with the
  same numeric or version suffix.
- Migration files run in ascending filename order; rollback files run in
  descending filename order.
- Migration and rollback SQL must both be idempotent.
- When changing a migration, update the matching rollback in the same commit
  and add or update migration-pairing checks when available.

## Tests

- Testing is mandatory before finalizing code changes.
- Code coverage percentage must not decrease from the previous commit; it can
  stay the same or increase. When coverage tooling exists, compare against the
  previous commit or recorded baseline, add tests to maintain or improve
  coverage, and never reduce coverage thresholds to pass checks.
- Keep tests readable and domain-specific.
- Tests must cover desired or happy paths and prevention or rejection of
  undesired behavior.
- JavaScript `api-*` services usually use Mocha, Supertest,
  `test/index.test.js`, and Docker-backed PostgreSQL scripts.
- TypeScript `api-*` services usually use Jest and `tests/index.test.ts`.
- `pkg-*` packages usually use Mocha plus TypeScript type tests where present.
- `app-dashboard` uses Vitest, React Testing Library, mock API tests, and
  Selenium for end-to-end flows.
- For database tests, use existing seed, migration, rollback, and cleanup
  patterns.
- In database `rls_logic.test.js` files, assert RLS logic only by calling
  `carecard.can_access_row(...)` and checking the intended boolean. Put table
  CRUD and lower RLS helper checks in query/enforcement tests.
- Add tests for API success responses, validation errors, auth/authz errors,
  JWT errors, not-found/conflict cases, and unexpected error handling when
  those paths change.
- For frontend changes, test validation, transforms, query/mutation wrappers,
  components, and user-visible flows at the narrowest practical level first.
- If a test or repository check fails, fix the issue and rerun the failing
  command. Only finalize with failing checks when the failure is unrelated or
  blocked by environment constraints, and document that explicitly.

## Dashboard Frontend

`app-dashboard` is a Next.js App Router TypeScript app using MUI, React Query,
`next-intl`, and shared CareCard utilities. It consumes `api-auth`,
`api-institutions`, `api-contact-us`, and `api-user-profiles` through service
modules.

- Keep backend URL definitions centralized in `src/services/api.routes.ts`.
- Keep fetch behavior centralized in `src/services/common/api`, especially
  `appFetch`, `api.client`, and `parseApiResponse`.
- Services should return typed app/domain objects or typed form states, not raw
  fetch responses.
- Keep validation in `*.validation.ts`, API calls in `*.queries.ts` or mutation
  helpers, mapping in `*.transform.ts`, and orchestration in `*.service.ts`.
- Preserve standardized `ApiResponse` parsing for current backend responses and
  legacy/non-standard responses.
- Do not expose JWTs, session contents, or sensitive backend details in client
  components or logs.
- Respect `basePath: '/secure'`, server actions, middleware session renewal,
  mock API mode, and existing i18n message patterns.
- Use existing MUI and app component patterns. Do not introduce a new UI
  framework.

Dashboard service and test conventions:

- When reconciling dashboard profile address and phone-number behavior,
  preserve current development behavior unless the task explicitly changes it.
- Service/API snackbar behavior is centralized in
  `src/hooks/useServiceSnackbar.hooks.ts`.
- Query error snackbars delegate shared message normalization through
  `src/hooks/useErrorSnackbar.hooks.ts`.
- Profile, settings, notifications, institutions, and user authorization UI
  prefer service snackbar helpers for user-friendly fallback errors, technical
  error filtering, mutation result handling, and duplicate error suppression.
- `tests/app/dashboard/profile/page.test.tsx` keeps dynamic profile children
  inert in the shell-level page test to avoid async imports resolving after
  Vitest tears down jsdom in CI.

## Public Website Frontends

The `app-website-*` repositories are public Next.js App Router websites, not
the authenticated dashboard.

- Keep route files in `src/app` thin and compose sections from
  `src/components`.
- Preserve `next.config.ts` settings such as `output: 'standalone'`,
  `reactCompiler: true`, and `next-intl` plugin usage when present.
- Use existing MUI theme, customizations, navigation, providers, app config,
  offline handling, site layout, and cookie banner patterns.
- Keep localized copy in the supported `messages` locales for the repository.
- Keep API helpers in `src/lib/api`, route builders in `src/lib/routes.ts`, and
  proxy/session helpers in the existing `src/proxy.ts`, `src/lib/proxy`, or
  `src/lib/utils` locations used by the repo.
- Use actual brand, product, partner, or service assets from `public` when
  pages need visuals.
- Keep first viewport content clear about the brand or offer and preserve
  responsive, accessible layouts.

## Dependency And Version Guidance

- Keep CareCard package usage consistent with the service or app being changed.
- When standardizing response or error behavior, prefer `@carecard/common-util`
  `3.1.15` because it contains response and error functions aligned with
  `api-auth`.
- If package version changes are required, update lockfiles and verify affected
  services or apps.
- Avoid broad dependency upgrades as part of feature or refactor work unless
  the task is specifically about dependencies.

## Security Requirements

- Treat authentication, authorization, JWT, password, email confirmation,
  recovery, file upload, CORS, rate limits, and error response behavior as
  security-sensitive.
- Never log or return secrets, tokens, passwords, credentials, private keys,
  full JWT payloads, stack traces, raw request payloads, backend internals, or
  sensitive personal data.
- Use safe user messages and structured details only when they do not reveal
  sensitive implementation or data.
- Keep body-size limits, Helmet, CORS allow-lists, and rate-limit behavior
  intact unless a task explicitly changes them.
- Document remaining security concerns that require product, infrastructure, or
  deployment decisions.
