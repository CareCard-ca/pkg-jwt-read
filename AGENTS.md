# Codex Instructions

## Non-negotiable Codex banked-reset requirement

- Never use or consume a banked Codex rate-limit reset automatically.
- Before using any banked Codex rate-limit reset, stop, ask the user for explicit, direct approval for that specific reset, and wait for their reply.
- Never treat earlier approval, a standing instruction, silence, urgency, an unfinished task, or a request to continue as approval for a future reset.
- Do not invoke `/usage` redemption, a reset-consumption action, a reset API or tool, or any equivalent mechanism unless the user explicitly approved that specific reset.
- If a Codex limit is reached without that approval, pause and let the user reset it manually. Never consume a banked reset to keep working.

## Repository validation contracts

Non-negotiable repository isolation rule: Every repository must run its Husky hooks and tests using only files, code, fixtures, dependencies, and services contained within that repository. Tests and Husky scripts must not import, require, read, execute, or otherwise depend on sibling repositories or paths outside the repository root. app-e2e-tests is the only exception because cross-repository end-to-end testing is its explicit responsibility.

Non-negotiable code organization rule: Functions with the same or equivalent behavior must use the same or clearly corresponding descriptive names across CareCard repositories, and equivalent functionality must live in files with the same names within each repository's established architecture. No backward compatibility names, aliases, or duplicate locations are allowed.

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
