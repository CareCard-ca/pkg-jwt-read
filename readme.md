# @carecard/jwt-read

Generic JWT signature and registered-claim verification. Custom claims are opaque;
role semantics, request contexts, application ownership, auth-response aliases,
and access lifetimes belong to the owning services and applications.

## Verified tokens

`jwtReadVerifiedToken(token, parsedJwks, requirements?)` returns header and payload
only after signature, expiration, issued-at, and not-before validation. Invalid
credentials return null. Caller requirements may specify issuer, subject, audience
(string or list), maximumAgeSeconds, and validateClaims. The callback defines
custom-claim policy explicitly; it must return true to accept the payload.

There is no application audience shape or ten-minute lifetime default. A caller
may require a single string audience in validateClaims when its own contract
requires one. Malformed requirements raise TypeError.

```js
const { jwtReadVerifiedToken } = require('@carecard/jwt-read');
const parts = jwtReadVerifiedToken(token, verificationJwks, {
  issuer: 'issuer',
  audience: 'receiver',
  maximumAgeSeconds: 900,
  validateClaims: payload => payload.custom === 'expected',
});
```

## Introspection and transport

`jwtReadIntrospectedToken(token, introspect, requirements?)` accepts caller-normalized
`{ active: true, claims }` results and applies the same explicit constraints.
It preserves canonical custom claims without inferring service response fields.
Introspection failures propagate to the owner.

`jwtReadBearerToken(header)` accepts exactly one complete HTTP Bearer credential,
including outer whitespace, and rejects extra words or internal token whitespace.

`jwtGetTokenDeadline(payload, maximumAgeSeconds?)` returns the expiration or the
earlier explicit maximum age, with no business-policy default. Invalid timing
returns null. `jwtIsTokenExpired(request, maximumAgeSeconds?)` checks current time.

The existing generic `jwtGetClientId`, `jwtGetAgeInSeconds`, and `jwtIsExpired`
helpers expose standard subject/timing values. They assign no role or privilege.
Express request payload types contain registered and opaque custom claims only.

## Validation

Run `npm run test:All`, `npm run lint`, and `npm run format:check`. Tests use the
public package root and exercise opaque claims, configurable identities and
lifetimes, key rotation, canonical introspection, malformed input, and timing.
Business authorization and mapping are tested through owner-local boundaries.

Non-negotiable test order invariance rule: Every test must pass independently of which tests run before or after it, and the suite must pass in every execution order. Each test must establish the state it needs, isolate mutable state, and clean up state it owns; it must never rely on another test's setup, mutations, or cleanup. Default test, CI, and Husky commands must use the test framework's ordinary ordering and must not force randomized ordering. Random-order execution is an explicit diagnostic only, and every failure it exposes must be fixed at the root cause.

Non-negotiable root-cause solution rule: Always identify and solve the verified root cause, use the stronger solution, and deliver a correct, durable, production-quality result. Never treat a temporary workaround, resource increase, retry, suppression, bypass, or symptom-only patch as completion. Validate the root-cause fix against the real failing workflow and prove the end state.

Non-negotiable TDD rule: Always write the failing test first, run it to confirm it fails for the intended reason, then implement the code and rerun the test until it passes. Test Driven Development is required for all coding work and must not be skipped. For documentation- or skill-only edits, run the relevant focused non-test
validation before changing the prose; do not add automated tests that inspect
prose, files, or repository structure.

Non-negotiable repository isolation rule: Every repository must run its Husky hooks and tests using only files, code, fixtures, dependencies, and services contained within that repository. Tests and Husky scripts must not import, require, read, execute, or otherwise depend on sibling repositories or paths outside the repository root. app-e2e-tests is the only exception because cross-repository end-to-end testing is its explicit responsibility.

Non-negotiable error and warning rule: Never suppress, silence, hide, downgrade, filter, ignore, skip, or bypass errors or warnings from code, tests, tools, compilers, linters, or validation. Fix the root cause, then rerun the affected check and require a clean result. Expected error-path tests may assert errors, but must not conceal unexpected failures.

Non-negotiable TypeScript type rule: Never use the TypeScript type `any`; always use specific domain types, generics, existing project types, or `unknown` with explicit narrowing in all TypeScript-family files (`.ts`, `.tsx`, `.mts`, `.cts`, and `.d.ts`).

Non-negotiable code organization rule: Functions with the same or equivalent behavior must use the same or clearly corresponding descriptive names across CareCard repositories, and equivalent functionality must live in files with the same names within each repository's established architecture. No backward compatibility names, aliases, or duplicate locations are allowed.
