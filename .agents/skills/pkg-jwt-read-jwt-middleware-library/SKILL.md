---
name: pkg-jwt-read-jwt-middleware-library
description: 'Use when changing pkg-jwt-read JWT parsing, middleware, visitor tokens, role checks, auth context, package exports, or tests.'
---

Non-negotiable root-cause solution rule: Always identify and solve the verified root cause, use the stronger solution, and deliver a correct, durable, production-quality result. Never treat a temporary workaround, resource increase, retry, suppression, bypass, or symptom-only patch as completion. Validate the root-cause fix against the real failing workflow and prove the end state.

# Package JWT Read

Non-negotiable TDD rule: Always write the failing test first, run it to confirm it fails for the intended reason, then implement the code and rerun the test until it passes. Test Driven Development is required for all coding work and must not be skipped. For documentation- or skill-only edits, run the relevant focused non-test
validation before changing the prose; do not add automated tests that inspect
prose, files, or repository structure.

Non-negotiable repository isolation rule: Every repository must run its Husky hooks and tests using only files, code, fixtures, dependencies, and services contained within that repository. Tests and Husky scripts must not import, require, read, execute, or otherwise depend on sibling repositories or paths outside the repository root. app-e2e-tests is the only exception because cross-repository end-to-end testing is its explicit responsibility.

Non-negotiable error and warning rule: Never suppress, silence, hide, downgrade, filter, ignore, skip, or bypass errors or warnings from code, tests, tools, compilers, linters, or validation. Fix the root cause, then rerun the affected check and require a clean result. Expected error-path tests may assert errors, but must not conceal unexpected failures.

Non-negotiable TypeScript type rule: Never use the TypeScript type `any`; always use specific domain types, generics, existing project types, or `unknown` with explicit narrowing in all TypeScript-family files (`.ts`, `.tsx`, `.mts`, `.cts`, and `.d.ts`).

Non-negotiable code organization rule: Functions with the same or equivalent behavior must use the same or clearly corresponding descriptive names across CareCard repositories, and equivalent functionality must live in files with the same names within each repository's established architecture. No backward compatibility names, aliases, or duplicate locations are allowed.

## Non-Negotiable Package Independence

`pkg-*` must always be agnostic to roles and the inner workings of `ms-*` and
`app-*`. Packages must not own business role codes, permissions, workflow
states, domain payload schemas, database caller contexts, application routes,
or application-specific policy defaults. Those contracts belong to their
owning services and applications.

Keep packages limited to reusable technical mechanisms. Accept explicit
caller-supplied schemas, parsers, policy configuration, identities, and opaque
custom claims where needed. Never import a service or application, copy its
business catalogue into a package, infer privilege from custom claims, or add
caller-name branches. Preserve consumer behavior in owner-local adapters and
validate both the generic package contract and the owning public boundaries.

## Purpose

Generic JWT readers for signature verification, registered constraints, opaque custom claims, caller-configured introspection, exports, and tests.

## When To Use

- Use when changing generic JWT readers, bearer transport parsing, configured
  constraints, canonical introspection, public types, or tests.
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

- Write a new failing consumer-facing test through the supported package root
  before behavior or public API changes. Modify a pre-existing test only after
  the user grants fresh, explicit permission for that exact change.
- Include consumer-facing runtime and compilation tests through the supported package root. Exercise public behavior and realistic type usage without inspecting export objects, source files, or module layout.
- Run package test, lint, type, and Husky validation commands required by the changed area.

## Safety Constraints

- Do not edit generated output, dependency folders, logs, coverage, dist, or build artifacts unless the task requires it.
- Do not revert or overwrite user changes; stage only requested skill or instruction files.
- Never suppress errors, lint failures, type failures, security failures, or failing tests; fix the underlying issue or report the blocker.
- Do not log or expose secrets, JWTs, passwords, credentials, private keys, sensitive personal data, SQL internals, or stack traces.

## Generic Token Contract

Keep public exports and declarations aligned. Use `lib/configuredTokens.js` for
signature-backed readers, explicit registered constraints, canonical caller
introspection, generic bearer parsing, and caller-selected deadlines. Keep
standard subject/timing helpers in `lib/registeredClaims.js`.

Do not add role maps, business claim schemas, application audience rules,
request/database caller contexts, auth-response aliases, framework routes,
service names, or fixed application lifetimes. The owner supplies custom-claim
validation and canonical introspection results. HTTP authorization strategies
and downstream account refresh remain owner responsibilities.

Use parsed keys and crypto primitives from auth-util. Invalid credentials fail
closed; malformed configuration throws; introspection errors propagate. Preserve
arbitrary custom claims exactly without assigning authority or mutating meaning.
Use unknown and narrowing, never TypeScript any.

Write failing public-root behavior and type tests before changes. Cover explicit
constraints, timing boundaries, malformed inputs, retained/removed keys, opaque
claims, and introspection failure. Run the complete repository-native suite,
lint, formatting, types, and normal Husky checks. Architecture audits are separate
from functional tests and must not expose private functions for testing.
