---
name: carecard-must-do
description: 'Non-negotiable startup requirements for every agent, including Codex, Claude, other assistants, and delegated agents. Load first whenever beginning or resuming any task to govern questions, visible working copies, and agent-named branches.'
---

# CareCard Must Do

## Mandatory for every agent

Every agent must read and follow this skill before beginning or resuming work
in this repository. This applies regardless of provider, product, model, role,
or invocation method, including Codex, Claude, other assistants, and delegated
agents. Planning, questions, read-only investigation, coding, review,
documentation, validation, and Git operations are all covered.

Load this skill first, then the repository's mandatory engineering standards,
then the specialist skills relevant to the task. Continue applying these rules
throughout the task. When entering another repository, read its local copy.
When delegation is already authorized, give delegated agents this same startup
requirement. An agent without automatic skill discovery must open this file
explicitly; its lack of discovery support is not an exemption.

## Explain the issue and solutions before asking

Before every user-facing question, including a clarification, preference,
approval request, or question presented through a tool, explain:

- the relevant facts and what is uncertain or needs to change;
- the issue and why the user's answer is needed;
- the viable solutions or next steps and their practical consequences; and
- the recommended solution and the reason for that recommendation.

Make the explanation detailed enough for a first-year engineering student to
understand. Define necessary technical terms and distinguish observed facts
from assumptions. Explain concrete effects rather than relying on unexplained
jargon. Do not invent alternatives when only one practical next step exists.

Present the question after the explanation. Resolve discoverable facts through
appropriate inspection before asking the user to supply them. This requirement
does not create a reason to ask unnecessary questions or repeat an approval
already granted for the action.

## Keep the working repository visible

Make changes in the normal repository directory the user is working in. Do not
routinely replace it with a clone, linked worktree, detached checkout, or other
working copy under `/tmp`, a system temporary directory, a cache, or a hidden or
undisclosed location. A branch names a line of work; a worktree or clone creates
another working directory. Do not use either to hide where changes are made.

A separate working directory is permitted only for a compelling technical
reason, such as isolation that is necessary to protect unrelated active work.
Before creating it, explain why the normal checkout cannot safely serve the
task, disclose the exact directory and branch, and explain how the finished
work will remain accessible in the normal repository. Convenience alone is
not a compelling reason. This disclosure adds no separate approval step;
existing authorization requirements still apply.

Keep ownership and handoff explicit, preserve unrelated work, and clean up only
resources owned by the task when cleanup is authorized. Ordinary temporary
logs, build artifacts, and test fixtures are permitted when they are not used
as an undisclosed replacement working repository.

## Work on an agent-named branch

Before changing repository files, create and switch to a task-specific branch
named `<agent-name>/<task-name>` in the owning repository. Use the agent's
recognizable lowercase name and a descriptive task name, such as
`codex/carecard-must-do`, `claude/fix-login`, or `junie/update-validation`.
Reuse an existing agent-named branch only when continuing that same task.
Read-only investigation and planning do not require creating a branch.

Identify the repository directory and working branch before making changes.
Preserve existing commits and unrelated local changes. Start new work from
freshly fetched `origin/main`, or rebase continuing work onto it when needed.
Fetch again before every source-branch push and rebase when the branch does
not already contain the latest `origin/main`.

Follow the repository's remaining Git, validation, and authorization rules.
Branch creation does not authorize pushing, merging, or deleting branches.
Never delete local or remote `main`, and never force-push to remote `main`.

## Existing repository isolation contract

Non-negotiable repository isolation rule: Every repository must run its Husky
hooks and tests using only files, code, fixtures, dependencies, and services
contained within that repository. Tests and Husky scripts must not import,
require, read, execute, or otherwise depend on sibling repositories or paths
outside the repository root. app-e2e-tests is the only exception because
cross-repository end-to-end testing is its explicit responsibility.

Also apply [$carecard-workspace-standards](../carecard-workspace-standards/SKILL.md)
for the mandatory TDD and code organization rules.
