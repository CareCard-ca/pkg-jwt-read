---
name: carecard-api-contract
description: 'Mandatory for every task after carecard-must-do and the repository engineering standards. Maintain non-negotiable API conformity across server calls, direct browser uploads and messaging, seed data, mocks, tests, and documentation.'
---

# CareCard API Contract

## Mandatory Use

Every agent must read and apply this skill on every task, including planning,
read-only investigation, coding, review, tests, documentation, and skill work.
Load `carecard-must-do` first, then the repository engineering standards, then
this skill before narrower skills. Use this repository's own copy; no test,
hook, build, or runtime dependency on another checkout is permitted.

## Non-Negotiable API Conformity

The authoritative API contracts are the implemented request and response
boundaries between `ms-*` and `app-*` server components, called through the
`app-*` service layer. The implemented direct browser contracts for file
uploads and messaging are also authoritative.

Seed data in `cc-seed-data`, mock data and test data in every `app-*` repository,
API documentation, E2E test data, helpers, examples, and every other place
where these contracts are represented must always use and conform to those
authoritative contracts. A mock, seed, test, document, or example must never
redefine an API contract. This requirement is non-negotiable.

Every field in every non-authoritative request and response must have the same
data type and nullability as its authoritative boundary. Preserve UUID string
formats, timestamp and date-only string formats, booleans, numbers, arrays,
objects, and explicit null values. Preserve endpoint-specific numeric strings
when the owner returns them, including PostgreSQL BIGINT message sequences;
do not substitute numbers just because an app transform later parses them.

## Determine the Contract Before Changing Representations

- Trace each request through the application service query, validation, and
  transform to the owning microservice route, controller, and response writer.
  Inspect database/model behavior when it determines the returned data.
- Compare method, path, authentication, parameters, headers, body fields,
  casing, types, identifiers, required/optional/null values, status codes,
  response data, errors, envelope metadata, and pagination.
- Distinguish raw HTTP data from transformed application objects and relational
  seed rows. Seed rows must satisfy the owning schema and produce conforming
  API results; they are not HTTP response envelopes.
- Preserve intentional mock-only controls as explicit development seams. They
  do not authorize different production API payloads or outcomes.
- For direct browser uploads, trace the application-owned intent request and
  the byte upload with its one-use bearer credential. Preserve the actual
  multipart body, response, and failure contract.
- For direct browser messaging, trace application-owned ticket issuance,
  handshake authentication, commands, acknowledgements, events, and recovery.
  Preserve endpoint-specific formats; do not wrap binary content, bodyless
  responses, tickets, or realtime acknowledgements in a generic JSON envelope.

## Repair and Maintain All Affected Representations

- Fix verified drift at its originating input, generator, mock factory, or
  fixture and update every dependent representation in the same task.
- Edit seed facts/generators in `cc-seed-data`; regenerate ignored outputs
  rather than patching generated dumps or creating editable seed copies.
- Reuse existing service types and repository-native helpers. Do not add
  compatibility aliases, alternate shapes, a parallel schema framework, or
  runtime cross-repository imports to conceal a mismatch.
- When an authoritative contract intentionally evolves, identify and update
  every affected seed, mock, test, example, API document, E2E scenario, and skill.
  Documentation inventories remain derived evidence, not a new authority.
- Keep equivalent copies of this skill aligned and preserve repository-local
  ownership. Do not infer authorization to publish, deploy, or reset data.

## Behavioral Validation

Use TDD for executable changes: establish a failing observable request,
response, event, or persisted-data assertion before implementation. Exercise
public callable boundaries; do not test source text or internal structure.
Cover affected success and failure outcomes, and run the validation required
by the current task and the owning repository. Validate documentation and
skill changes with focused non-test checks. Never claim an unrun check passed.

## Shared Engineering Requirements

Non-negotiable TDD rule: Always write the failing test first, run it to confirm it fails for the intended reason, then implement the code and rerun the test until it passes. Test Driven Development is required for all coding work and must not be skipped. For documentation- or skill-only edits, run the relevant focused non-test validation before changing the prose; do not add automated tests that inspect prose, files, or repository structure.

Non-negotiable repository isolation rule: Every repository must run its Husky hooks and tests using only files, code, fixtures, dependencies, and services contained within that repository. Tests and Husky scripts must not import, require, read, execute, or otherwise depend on sibling repositories or paths outside the repository root. app-e2e-tests is the only exception because cross-repository end-to-end testing is its explicit responsibility.

Non-negotiable code organization rule: Functions with the same or equivalent behavior must use the same or clearly corresponding descriptive names across CareCard repositories, and equivalent functionality must live in files with the same names within each repository's established architecture. No backward compatibility names, aliases, or duplicate locations are allowed.

### Non-Negotiable Microservice Layer Testing Contract

For every `ms-*` microservice, each applicable testing layer below is mandatory. In this contract, testing a function directly means invoking its documented callable boundary with controlled inputs. It never means testing its internals or other implementation details directly. Every function under test must be treated as a black box.

- Every database function and every stable database-access function must be exercised through its callable database boundary against the repository-owned test database. Place this coverage in `test/db/<related-model>[.<behavior>].test.<ext>`.
- Every model function that reads or changes database data must be exercised through its callable model interface. Place this coverage in `test/<sub-app>/model.test.<ext>` or a more specific model test file in the same directory.
- Every controller function used by the application must be exercised through its callable controller interface with controlled request, response, and error inputs. Place this coverage in `test/<sub-app>/controller.test.<ext>` or a more specific controller test file in the same directory.
- Every application route must be exercised with real HTTP requests against the composed application mounted on a repository-managed Node HTTP server. Place this coverage in `test/<sub-app>/app.test.<ext>`; use `test/app/app.test.<ext>` for routes without a sub-app.
- Every large helper function and every helper with independent domain behavior, validation, mapping, branching, state transition, object mutation, or failure behavior must have behavior coverage in `test/<sub-app>/helper.test.<ext>` or an appropriately named test file. Exercise a documented callable helper interface as a black box. Cover a private helper implementation through the callable boundary that owns it, and never export or invoke it solely for testing.
- Tests must provide inputs and assert observable outputs, errors, persisted state, side effects, emitted behavior, or intentional object mutation.
- Tests must not directly invoke, inspect, spy on, or assert implementation details, including private functions or state, SQL or query text and construction, algorithms, branches, control flow, variable names, collaborator sequences, or internal call counts.
- A behavior-preserving rewrite behind an unchanged callable contract must not require functional test changes.
- Use the repository-native test extension, such as `.js`, `.ts`, or `.mjs`. A microservice without a particular layer does not need an empty placeholder test file.
