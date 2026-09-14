---
name: pkg-publish
description: 'Use when any pkg-* repository has non-Markdown package changes, including source code, public types, tests, scripts, package metadata, lockfiles, dependency behavior, or validation config, and the CareCard packages must be versioned, published in order with just-in-time package pushes, and propagated to pkg-*, ms-*, and app-dashboard consumers. Do not use for Markdown-only changes.'
---

Non-negotiable root-cause solution rule: Always identify and solve the verified root cause, use the stronger solution, and deliver a correct, durable, production-quality result. Never treat a temporary workaround, resource increase, retry, suppression, bypass, or symptom-only patch as completion. Validate the root-cause fix against the real failing workflow and prove the end state.

# pkg Publish

Non-negotiable test order invariance rule: Every test must pass independently of which tests run before or after it, and the suite must pass in every execution order. Each test must establish the state it needs, isolate mutable state, and clean up state it owns; it must never rely on another test's setup, mutations, or cleanup. Default test, CI, and Husky commands must use the test framework's ordinary ordering and must not force randomized ordering. Random-order execution is an explicit diagnostic only, and every failure it exposes must be fixed at the root cause.

Non-negotiable TDD rule: Always write the failing test first, run it to confirm it fails for the intended reason, then implement the code and rerun the test until it passes. Test Driven Development is required for all coding work and must not be skipped. For documentation- or skill-only edits, run the relevant focused non-test
validation before changing the prose; do not add automated tests that inspect
prose, files, or repository structure.

Non-negotiable repository isolation rule: Every repository must run its Husky hooks and tests using only files, code, fixtures, dependencies, and services contained within that repository. Tests and Husky scripts must not import, require, read, execute, or otherwise depend on sibling repositories or paths outside the repository root. app-e2e-tests is the only exception because cross-repository end-to-end testing is its explicit responsibility.

Non-negotiable error and warning rule: Never suppress, silence, hide, downgrade, filter, ignore, skip, or bypass errors or warnings from code, tests, tools, compilers, linters, or validation. Fix the root cause, then rerun the affected check and require a clean result. Expected error-path tests may assert errors, but must not conceal unexpected failures.

Non-negotiable code organization rule: Functions with the same or equivalent behavior must use the same or clearly corresponding descriptive names across CareCard repositories, and equivalent functionality must live in files with the same names within each repository's established architecture. No backward compatibility names, aliases, or duplicate locations are allowed.

## Trigger

Run this skill after every `pkg-*` repository change that touches non-Markdown
package files: source code, public type declarations, tests, scripts,
configuration, package metadata, lockfiles, dependency behavior, or validation
behavior.

Do not run this skill for Markdown-only changes, including README-only or
`*.md` skill-documentation-only updates.

## Version Rule

1. Check `package.json` in all five package repositories:
   `pkg-common-util`, `pkg-validate`, `pkg-auth-util`, `pkg-jwt-read`, and
   `pkg-telemetry`.
2. Select one minor version higher than the highest currently published package
   version. An unpublished new package adopts that coordinated target version
   and does not raise it again.
   If the highest version is `3.7.0`, the coordinated target version is
   `3.8.0`.
3. Use the same target version for all five packages.
4. Update each package's `package.json` and `package-lock.json`, then commit the
   version change on a package release branch before publishing.

## Publish Order

Always publish packages in this order, one repository at a time:

1. `@carecard/common-util`
2. `@carecard/validate`
3. `@carecard/auth-util`
4. `@carecard/jwt-read`
5. `@carecard/telemetry`

Publish by pushing the package release branch, creating or reusing a pull
request into `main`, marking it ready, waiting for checks, squash-merging
with administrator privileges, and verifying npm publication with:

```sh
npm view <package-name>@<target-version> version
```

The package GitHub workflows accept pushes to `main` and `development` and
publish an unpublished version. Use the `main` squash merge as the release
path and verify npm publication before continuing. Subsequent development
synchronization must reuse the same version; it is not a second release.

## Default Git Policy

Reuse the current working branch for every follow-up request, even when the
subject changes or the working tree is clean. Create a branch only when no
working branch exists or the checkout is on `main` or `development`. Otherwise,
fetch remote `main` HEAD and rebase the same working branch onto that fetched
commit, preserving its commits and uncommitted work.

Apply these defaults unless the user explicitly specifies otherwise. The
prohibition on deleting or force-pushing `main` always applies.

1. Use `main` as the PR base and freshly fetched `origin/main` as the source of
   truth. `origin/HEAD`, a stale local `main`, and the presence of `development`
   do not change this default. If remote `main` is missing or cannot be fetched,
   report the blocker instead of selecting another base.
2. At task start, fetch `origin/main`. Create `<agent-name>/<branch-name>`
   from that commit only when no working branch exists or the current branch is
   `main` or `development`.
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

## Deferred Package Push

Commit coordinated version and dependency updates locally as the release sequence
progresses. Do not push a `pkg-*` release branch until that package is the next
package being published by merge into `main`.

Immediately before each package's publishing turn:

1. Verify the repository is on the intended release branch and has a clean
   working tree.
2. Run required validation and every direct `.husky` script for that repository.
3. Fetch `origin/main` again, rebase the release branch when it does not already
   contain that commit, and push with hooks enabled. Use an explicit observed-commit
   lease if a rebase requires rewriting an already-pushed source branch.
4. Create or reuse the pull request into `main`, merge it, and wait for
   npm publication before continuing to dependency fanout. Complete merged-source
   cleanup and main/development synchronization under the default Git policy.

## Dependency Fanout

After each package publishes, update every package repository that depends on
that package to the exact target version and commit the change before
continuing:

1. After publishing `@carecard/common-util`, update it in `pkg-validate`,
   `pkg-auth-util`, and `pkg-jwt-read` when declared.
2. After publishing `@carecard/validate`, update it in `pkg-auth-util` and
   `pkg-jwt-read` when declared.
3. After publishing `@carecard/auth-util`, update it in `pkg-jwt-read` when
   declared.
4. `@carecard/jwt-read` has no later dependent CareCard package.
5. `@carecard/telemetry` is last and has no `@carecard/*` package dependencies.

Use exact installs so `package.json` and `package-lock.json` stay aligned:

```sh
npm install <package-name>@<target-version> --save-exact
```

## Service And Dashboard Consumers

After all five packages are published, update all `ms-*` repositories and
`app-dashboard` that declare any `@carecard/*` package dependency. Install the
latest exact target version for every declared CareCard package, run the
repository's required validation, and commit the dependency updates locally.

Do not push, open pull requests, or merge service/dashboard consumer dependency
commits unless the user explicitly asks for remote GitHub work for those
repositories.

## Validation

For each changed repository:

- Run `git diff --check`.
- Run every direct script in `.husky`; do not bypass hooks.
- For package repositories, run the package tests, type checks, and lint/format
  checks required by the hook.
- For `app-dashboard`, run both `.husky/pre-commit` and `.husky/pre-push` when
  dependencies change.

Finish by verifying that all five packages are published at the same target
version and every declared `@carecard/*` dependency in `pkg-*`, `ms-*`, and
`app-dashboard` is pinned to that version.

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
