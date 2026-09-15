---
name: carecard-must-do
description: 'Non-negotiable startup requirements for every agent, including Codex, Claude, other assistants, and delegated agents. Load first whenever beginning or resuming any task to govern questions, visible working copies, and working-branch continuity.'
---

# CareCard Must Do

## Explicit approval before GitHub settings changes

Before changing any GitHub setting, explain the exact proposed change, ask the
user explicitly, and wait for their approval. This includes temporary changes
to GitHub Actions, workflow enablement, branch protection, and repository or
organization settings. Authorization to commit, push, merge, tag, cancel runs,
or clean up branches does not authorize settings changes.

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

## Choose and refresh the working branch

Reuse the current working branch for every follow-up request, even when the
subject changes or the working tree is clean. Create a branch only when no
working branch exists or the checkout is on `main` or `development`. Otherwise,
fetch remote `main` HEAD and rebase the same working branch onto that fetched
commit, preserving its commits and uncommitted work.

Identify the repository directory, current branch, and working-tree state.
Fetch `origin/main` at task start before making task changes.

- Create and switch to a new `<agent-name>/<branch-name>` branch from freshly
  fetched `origin/main` only when no working branch exists or the current branch is
  `main` or `development`. Use the agent's recognizable lowercase name and a
  descriptive
  branch name, or the exact branch name supplied by the user.
- On every other branch, keep the current branch and rebase it onto freshly
  fetched `origin/main` before starting task changes. Preserve its existing
  commits and build the new task's commits on top of that work. Reuse this
  branch for subsequent tasks, including when the working tree is clean or
  the new task differs from the previous one.

Preserve uncommitted changes when preparing the rebase and restore any changes
that were temporarily set aside. Do not reset, replace, squash, or discard the
current branch's work merely to start a new task. Honor explicit user
working-branch instructions. Read-only investigation and planning do not
require creating a branch.

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
