---
name: github-pr-create-update
description: 'Use when asked to push, create, update, or ready a GitHub pull request. Default PRs to main. Create a branch from fresh origin/main only from main or development; otherwise preserve and rebase the current branch for subsequent tasks. Fetch again before source pushes and preserve main from deletion or force pushes.'
---

Non-negotiable root-cause solution rule: Always identify and solve the verified root cause, use the stronger solution, and deliver a correct, durable, production-quality result. Never treat a temporary workaround, resource increase, retry, suppression, bypass, or symptom-only patch as completion. Validate the root-cause fix against the real failing workflow and prove the end state.

# Pull Request Create

Non-negotiable TDD rule: Always write the failing test first, run it to confirm it fails for the intended reason, then implement the code and rerun the test until it passes. Test Driven Development is required for all coding work and must not be skipped. For documentation- or skill-only edits, run the relevant focused non-test
validation before changing the prose; do not add automated tests that inspect
prose, files, or repository structure.

Non-negotiable repository isolation rule: Every repository must run its Husky hooks and tests using only files, code, fixtures, dependencies, and services contained within that repository. Tests and Husky scripts must not import, require, read, execute, or otherwise depend on sibling repositories or paths outside the repository root. app-e2e-tests is the only exception because cross-repository end-to-end testing is its explicit responsibility.

Non-negotiable error and warning rule: Never suppress, silence, hide, downgrade, filter, ignore, skip, or bypass errors or warnings from code, tests, tools, compilers, linters, or validation. Fix the root cause, then rerun the affected check and require a clean result. Expected error-path tests may assert errors, but must not conceal unexpected failures.

Non-negotiable code organization rule: Functions with the same or equivalent behavior must use the same or clearly corresponding descriptive names across CareCard repositories, and equivalent functionality must live in files with the same names within each repository's established architecture. No backward compatibility names, aliases, or duplicate locations are allowed.

## Default Git Policy

Apply these defaults unless the user explicitly specifies otherwise. The
prohibition on deleting or force-pushing `main` always applies.

1. Use `main` as the PR base and freshly fetched `origin/main` as the source of
   truth. `origin/HEAD`, a stale local `main`, and the presence of `development`
   do not change this default. If remote `main` is missing or cannot be fetched,
   report the blocker instead of selecting another base.
2. At task start, fetch `origin/main`. Create `<agent-name>/<branch-name>`
   from that commit only when the current branch is `main` or `development`.
   Otherwise keep and rebase the current branch onto that commit, preserving
   its existing commits and building subsequent task commits on top. Honor an
   explicit working-branch instruction; it changes branch selection, not
   freshness.
3. Fetch again before every source-branch push. Rebase when the working branch
   does not already contain the latest `origin/main`; a clean mergeability
   check is not proof that rebasing is unnecessary. If it already contains that
   commit, no rebase is needed. The direct `development` replacement below is a
   ref synchronization, not a source-branch rebase.
4. Squash-merge into remote `main` after the applicable validation passes.
   Administrator privileges may be used to merge without GitHub reviews; they
   do not authorize bypassing required checks. Verify the merge, then delete
   the merged source branch remotely and locally.
5. Fetch the latest remote `main` after merging and fast-forward local `main`
   to that commit. Preserve divergent local work and report a blocked update
   rather than discarding it.
6. Replace branches named exactly `development`, locally and remotely, with
   the latest remote `main` commit. Use an explicit, observed-commit
   `--force-with-lease` for a non-fast-forward remote update. Create a missing
   counterpart when local or remote `development` exists; leave repositories
   with neither unchanged. If `development` was the merged source, recreate
   it from the new `main` after deleting it. Other working branches are not
   development synchronization targets.
7. Never delete local or remote `main`, and never force-push to remote `main`,
   including with `--force-with-lease`, a forced refspec, or a mirror push.
   Check the exact destination ref before every deletion or forced update.

Fetches needed to establish a fresh `origin/main` at task start and before a
source-branch push are authorized without a separate approval question. Commits,
pushes, PR mutations, and branch cleanup require an authorized task; a request
for local work alone does not authorize publication. An authorized squash merge
into `main` includes the merged-source cleanup, local `main` update, and
`development` synchronization below unless the user explicitly says otherwise.
Never delete local or remote `main`, or force-push to remote `main`, including
with `--force-with-lease`.

## Prepare The Working Branch

Work from the owning repository root. Inspect status, the current branch,
upstream, and worktrees before changing refs. Preserve unrelated changes and
existing commits; do not reset a working branch to discard its work. Honor the
user's explicit working-branch instruction. Create a new
`<agent-name>/<branch-name>` from fresh `origin/main` only when the current
branch is `main` or `development`. Otherwise keep the current branch, rebase it
onto fresh `origin/main`, and build the new task's commits on its existing
work. A different task or a clean working tree does not require a new branch.
Do not use `main` or the selected base as a PR source branch. Stop if the source
branch cannot be resolved or HEAD is detached.

Fetch the authoritative ref explicitly:

```sh
git fetch origin refs/heads/main:refs/remotes/origin/main
```

For an existing working branch, preserve any uncommitted changes and rebase
before starting task changes; restore any changes temporarily set aside:

```sh
git rebase origin/main
```

Before every source-branch push, including pushes after validation fixes,
fetch again and rebase when the branch does not already contain the latest
`origin/main`. If rebasing changes the validated inputs, rerun
the affected validation. Preserve successful evidence for unchanged inputs.
If a rebase conflicts, abort only the rebase started by this task and report
the conflict; do not push or discard work. Preserve any pre-existing Git
operation and dirty worktree rather than trying to reset through it.

Before rebasing a published source branch, record its remote commit and verify
that its existing work is accounted for locally. Reconcile unincorporated
remote work before rewriting it. Use a normal push for a new branch or a
fast-forward update. When a rebase requires rewriting the remote source, use
an explicit lease tied to the recorded source commit:

```sh
if [ -z "$source_branch" ] || [ "$source_branch" = main ]; then
  printf '%s\n' 'Refusing to delete or force-update main or an unnamed branch.' >&2
  exit 1
fi
git push --set-upstream \
  --force-with-lease="refs/heads/$source_branch:$observed_source_commit" \
  origin "HEAD:refs/heads/$source_branch"
```

Resolve `source_branch` and `observed_source_commit` from verified repository
state before using this example. Do not replace a rejected lease with
`--force` or retry against a new expected commit without inspecting the remote
change. Keep hooks enabled. Verify that the remote source commit equals the
local commit after a successful push.

## Create Or Update The Pull Request

1. Confirm GitHub authentication, the intended source branch, and the clean,
   committed changes included in the PR. Load the owning repository skills and
   run their applicable validation. Stage and commit only authorized changes;
   preserve supplied branch names, titles, commit messages, and PR text.
2. Prepare and push the source branch using the fresh-main procedure above.
3. Find the open PR for that source. Reuse the exact source/base match. If
   automation created the task PR against `development`, retarget that PR to
   `main` and recheck its diff and checks instead of creating a duplicate.
   Honor an explicit user-selected base; do not silently retarget that choice.
4. Create a missing PR against `main` when PR creation is authorized. Use a
   file for a multiline body with `gh pr create --body-file` or
   `gh pr edit --body-file`. Do not create an empty PR for a source already
   represented in the base; report the no-op and perform only authorized
   cleanup supported by merge or content-equivalence evidence.
5. Mark draft PRs ready in the authorized create/update/ready or merge workflow,
   while preserving an explicit request to keep the PR as a draft. Keep the title factual and preserve exact user-supplied text.
   A create/update-only request ends with the PR; it does not authorize merging.

## Reporting

Report the repository, working branch, fetched main commit, whether rebasing
was needed, validation results, push result, PR URL and state, administrator
merge use, source cleanup, final checkout, and main/development commit parity.
Distinguish merged, unchanged, not applicable, and blocked repositories. Give
the exact failing command and reason for an incomplete step. Do not amend
commits unless explicitly requested; use additive commits for follow-up work.

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
