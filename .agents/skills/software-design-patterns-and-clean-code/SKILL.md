---
name: software-design-patterns-and-clean-code
description: 'Use every time before coding, refactoring, debugging, or reviewing in this repository, alongside all other applicable skills, to apply pragmatic software design patterns, SOLID, Clean Code, and testable architecture.'
---

Non-negotiable root-cause solution rule: Always identify and solve the verified root cause, use the stronger solution, and deliver a correct, durable, production-quality result. Never treat a temporary workaround, resource increase, retry, suppression, bypass, or symptom-only patch as completion. Validate the root-cause fix against the real failing workflow and prove the end state.

# Software Design Patterns And Clean Code

Non-negotiable TDD rule: Always write the failing test first, run it to confirm it fails for the intended reason, then implement the code and rerun the test until it passes. Test Driven Development is required for all coding work and must not be skipped. For documentation- or skill-only edits, add or update the relevant validation check before changing the prose.

Non-negotiable repository isolation rule: Every repository must run its Husky hooks and tests using only files, code, fixtures, dependencies, and services contained within that repository. Tests and Husky scripts must not import, require, read, execute, or otherwise depend on sibling repositories or paths outside the repository root. app-e2e-tests is the only exception because cross-repository end-to-end testing is its explicit responsibility.

Non-negotiable error and warning rule: Never suppress, silence, hide, downgrade, filter, ignore, skip, or bypass errors or warnings from code, tests, tools, compilers, linters, or validation. Fix the root cause, then rerun the affected check and require a clean result. Expected error-path tests may assert errors, but must not conceal unexpected failures.

Non-negotiable code organization rule: Functions with the same or equivalent behavior must use the same or clearly corresponding descriptive names across CareCard repositories, and equivalent functionality must live in files with the same names within each repository's established architecture. No backward compatibility names, aliases, or duplicate locations are allowed.

## Purpose

Use this skill with every coding, refactoring, debugging, or review task in
this repository. It supplements repository-specific skills; follow both, and
let the more specific skill decide file locations, framework conventions,
validation commands, and API contracts.

## Core Principles

- Prefer simple, maintainable, readable implementation over clever abstraction.
- Use Gang of Four design patterns only when they reduce real complexity,
  improve clarity, or make behavior easier to test.
- Follow SOLID principles, especially Single Responsibility and Dependency
  Inversion where they improve maintainability.
- Keep clear separation of concerns between routing, orchestration, domain
  logic, persistence, validation, formatting, and side effects.
- Apply DRY, KISS, and YAGNI. Remove meaningful duplication, keep solutions
  direct, and avoid speculative generalization.
- Favor small, composable functions with meaningful names and explicit inputs.
- Prefer pure functions for calculations, mapping, validation, and transforms
  when practical.
- Keep side effects minimal, localized, and easy to identify.
- Use explicit error handling. Do not swallow failures or hide actionable
  error context.
- Design code so behavior can be tested through focused unit, integration, or
  service tests without fragile setup.
- Avoid unnecessary dependencies. Use existing language, framework, and local
  helper capabilities before adding packages.

## Function Comments

For every new or modified function, method, or exported callback, add a short
comment immediately above it explaining the main pattern or principle being
applied. Keep the comment accurate and specific to the function.

Use the host language's normal comment syntax. Examples:

```ts
// Pattern: Single Responsibility - validates user input only.
function validateUserInput(...) { ... }

// Pattern: Pure Function - deterministic output with no side effects.
function calculateTotal(...) { ... }

// Pattern: Dependency Inversion - depends on an injected repository contract.
async function loadProfile(...) { ... }
```

## Working Rules

- Do not violate these coding principles unless there is no reasonable
  alternative.
- If a principle must be violated, include a short explanation in the code
  review or final summary.
- Refactor touched existing code to follow these patterns and principles when
  doing so is safe and related to the requested change.
- Do not use this skill as a reason for broad unrelated rewrites.
- Before introducing an abstraction or design pattern, confirm it removes real
  complexity compared with a straightforward function or module.
- Prefer dependency inversion at boundaries such as databases, external
  services, clocks, file systems, queues, and network calls when it improves
  testability or substitution.
- Keep interfaces and abstractions narrow. Do not create generic layers that
  only have one trivial implementation unless they clarify a boundary.
- Preserve the repository's existing style, naming, module system, and testing
  approach.
