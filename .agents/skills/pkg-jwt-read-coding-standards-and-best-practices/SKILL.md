---
name: pkg-jwt-read-coding-standards-and-best-practices
description: 'Mandatory for every pkg-jwt-read task, including analysis, clarification, planning, implementation, review, debugging, documentation, public API work, skill maintenance, and validation. Use before every narrower skill.'
---

# Pkg JWT Read Coding Standards And Best Practices

Non-negotiable root-cause solution rule: Always identify and solve the verified
root cause, use the stronger solution, and deliver a correct, durable,
production-quality result. Never treat a temporary workaround, resource
increase, retry, suppression, bypass, or symptom-only patch as completion.
Validate the root-cause fix against the real failing workflow and prove the end
state.

Non-negotiable error and warning rule: Never suppress, silence, hide, downgrade,
filter, ignore, skip, or bypass errors or warnings from code, tests, tools,
compilers, linters, or validation. Fix the root cause, then rerun the affected
check and require a clean result. Expected error-path tests may assert errors,
but must not conceal unexpected failures.

Non-negotiable repository isolation rule: Every repository must run its Husky
hooks and tests using only files, code, fixtures, dependencies, and services
contained within that repository. Tests and Husky scripts must not import,
require, read, execute, or otherwise depend on sibling repositories or paths
outside the repository root. app-e2e-tests is the only exception because
cross-repository end-to-end testing is its explicit responsibility.

## Mandatory Use And Authorities

Load this skill before doing any work in `pkg-jwt-read`, including read-only
and documentation-only work. Then load every narrower skill that owns the
affected package contract.

Use these existing authorities instead of duplicating them:

- `$carecard-workspace-standards` for TDD, root-cause solutions, dependencies,
  errors, isolation, and repository workflow;
- `$software-design-patterns-and-clean-code` for design, DRY, KISS,
  testability, and clean-code details;
- `$pkg-jwt-read-jwt-middleware-library` for JWT middleware, auth context,
  exports, types, security, and validation; and
- `$pkg-publish` only when runtime package artifacts or consumer versions must
  be published and propagated.

This skill adds the function-evolution, direct-contract, composition, and
completion rules below without weakening those companion skills.

## Requirement Judgment

1. Read the complete request and inspect implementation, public exports,
   declarations, middleware call sites, tests, documentation, and consumers
   before deciding how to change the package.
2. Translate the request into a coherent technical contract. Do not apply
   wording mechanically when it is contradictory, unsafe, impossible, or
   incompatible with authentication or package architecture.
3. Make low-risk, reversible assumptions only when they preserve requested
   behavior and scope.
4. Ask for clarification when an unresolved choice would materially change a
   public API, authentication or authorization behavior, security, consumer
   behavior, destructive scope, or the repositories that must change.
5. Explain architectural tradeoffs before a major API, middleware, type,
   authentication, module, package, or dependency change.

## Scope And Quality

- Treat every workspace repository as independent and validate it from its own
  root.
- Update every skill, document, source, export, declaration, consumer, and
  package version genuinely required for a coherent task, and add every new
  consumer-facing runtime or type test the behavior requires. Modify a
  pre-existing test only after the user grants fresh, explicit permission for
  that exact change.
- Do not broaden the task into unrelated cleanup.
- Preserve CommonJS, middleware, request-context, role, declaration, naming,
  and test conventions unless the task explicitly replaces them.
- Prefer Node core and existing package helpers over new dependencies.
- Prefer readable direct implementation over clever compression or a temporary
  workaround.
- Use meaningful names that describe authentication and authorization intent.

## Function Evolution

Before changing a function's behavior or signature, inventory every direct,
indirect, test, exported, middleware, callback, configuration-driven, and
dynamic consumer.

- If exactly one consumer is proven, change the function only when required.
- If two or more consumers exist, do not change the shared function's behavior.
  Create a new purpose-named function and migrate only intended consumers.
- If every consumer needs the new contract, migrate all consumers and delete
  the old function after proving it unused.
- Treat every exported, declared, public, middleware, callback, or dynamically
  discovered function as shared unless single use is conclusively proven.
- Do not add caller branches, mode flags, or optional parameters merely to
  make one shared function serve incompatible contracts.
- Cover the new function, public surface, types, and every migrated consumer
  through TDD.

## Direct Contract Without Backward Compatibility

When the active task replaces a contract, implement the requested end state
directly. Do not add legacy aliases, deprecated wrappers, compatibility
overloads, duplicate exports, dual auth paths, transitional names, or fallback
behavior solely to preserve the superseded contract.

Delete obsolete functions and exports after all intended consumers have
migrated and repository-native search proves them unused, while runtime and type tests
verify the remaining public contract. This does not authorize unrelated API removal. If an existing
published or security contract requires compatibility and the request does not
clearly supersede it, explain the conflict and ask first.

## TDD And Root-Cause Gate

Follow `$carecard-workspace-standards` and
`$pkg-jwt-read-jwt-middleware-library` for the complete failing-test-first and
root-cause workflow. Documentation and skill changes require focused non-test validation before
prose changes; do not add automated tests that inspect prose, files, or
repository structure. Do not accept retries, suppressed
diagnostics, weakened types, disabled tests, forced success, compatibility
patches, or symptom-only workarounds as completion.

## Function Size

Every new or materially changed function or middleware body must contain at most 25 logical code lines.

- Count executable statements, branches, loop headers, side-effecting calls,
  returns, and throws.
- Exclude signatures, type-only declarations, blank lines, comments, and
  isolated braces.
- Extract cohesive purpose-named helpers and compose them when needed.
- Keep parsing, verification, attachment, role evaluation, and error behavior
  explicit rather than hiding them in one long function.
- Avoid meaningless forwarding wrappers and do not refactor untouched
  functions solely to satisfy this limit.

## UI Composition

This package does not own UI. If a package contract requires UI changes, make
them in the owning app repository. There, create focused components, compose
existing and new components, and delete obsolete components only after proving
them unused and replaced.

## Skills, Documentation, And Database Boundaries

- Update affected skills, README guidance, examples, exports, and declarations
  with behavior or validation changes.
- Reference existing authoritative skills instead of copying their details.
- If work reaches an `ms-*` database, change SQL only in the owning repository
  using its database-migration-ownership skill. For first-create work, edit the
  existing migration and matching rollback directly rather than adding a
  compatibility migration.
- Keep persistence and service behavior in their owning repositories.

## Completion

1. Review each changed repository's diff and status independently.
2. Run focused runtime and type tests, then all broader checks required by
   local skills.
3. If every changed file in a repository is Markdown (`*.md`), skip Husky and
   run only focused Markdown validation.
4. If any changed file is not Markdown, run every direct `.husky` script. If
   none exists, run the strongest repository-native focused validation.
5. Fix every in-scope failure at its root cause and rerun the exact command.
6. Report exact commands, results, limitations, and remaining risk.
7. Do not perform remote Git or GitHub operations unless explicitly requested.

## TDD And Validation

Test Driven Development is a non-negotiable requirement.

The sole purpose of automated tests is to verify observable functionality and externally visible behavior.
Tests must validate what the system does through its public interfaces and expected outcomes.

Tests must not assert, inspect, or depend on implementation details, including but not limited to:

- The existence of specific lines of code, statements, functions, classes, files, or modules.
- Specific algorithms, control flow, variable names, method calls, code snippets, or internal implementation choices.
- Any internal structure that can change without changing externally observable behavior.

A correct implementation may be completely rewritten or refactored without requiring changes to functional tests, provided its externally observable behavior remains unchanged.

Any test that fails solely because the implementation changed while the externally observable behavior remained correct is incorrectly designed and must be rewritten or removed.

This requirement is mandatory for all new tests and must be applied whenever existing tests are modified.
