# Repository Agent Instructions

## Mandatory startup for every agent

Every agent, including Codex, Claude, other assistants, and delegated agents,
must read and follow [carecard-must-do](.agents/skills/carecard-must-do/SKILL.md)
before beginning or resuming any task. This includes planning, questions,
read-only investigation, coding, review, documentation, and validation.

Then load the [repository engineering standards](.agents/skills/pkg-jwt-read-coding-standards-and-best-practices/SKILL.md)
and the specialist skills relevant to the task.
An agent without automatic skill discovery must open the skill explicitly;
the requirement applies regardless of the agent platform.

Also read [AGENTS.md](AGENTS.md) for the full repository instructions.

## Existing repository isolation contract

Non-negotiable repository isolation rule: Every repository must run its Husky
hooks and tests using only files, code, fixtures, dependencies, and services
contained within that repository. Tests and Husky scripts must not import,
require, read, execute, or otherwise depend on sibling repositories or paths
outside the repository root. app-e2e-tests is the only exception because
cross-repository end-to-end testing is its explicit responsibility.

## Existing test-preservation policy

The TDD and validation requirements are non-negotiable and cannot be
overridden. The separate pre-existing-test protection still requires the
user's fresh, explicit permission for each exact proposed test modification.

A pre-existing test—defined as any test present before work on the current task
begins—must not be deleted, disabled, skipped, weakened, excluded from execution,
or otherwise removed. A pre-existing test must not be modified without the
user's explicit approval for the exact proposed change. If changing a
pre-existing test is believed necessary, stop before making the change and
request approval. The request must identify every affected test, describe the
precise proposed modification, provide detailed technical justification, and
explain all known or reasonably foreseeable regression risks. Until approval is
granted, leave every pre-existing test unchanged.

Also apply [$carecard-workspace-standards](.agents/skills/carecard-workspace-standards/SKILL.md)
for the mandatory TDD and code organization rules.
