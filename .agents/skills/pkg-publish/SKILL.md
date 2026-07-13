---
name: pkg-publish
description: 'Use when any pkg-* repository has non-Markdown package changes, including source code, public types, tests, scripts, package metadata, lockfiles, dependency behavior, or validation config, and the CareCard packages must be versioned, published in order with just-in-time package pushes, and propagated to pkg-*, ms-*, and app-dashboard consumers. Do not use for Markdown-only changes.'
---

# pkg Publish

Non-negotiable TDD rule: Always write the failing test first, run it to confirm it fails for the intended reason, then implement the code and rerun the test until it passes. Test Driven Development is required for all coding work and must not be skipped. For documentation- or skill-only edits, add or update the relevant validation check before changing the prose.

Non-negotiable repository isolation rule: Every repository must run its Husky hooks and tests using only files, code, fixtures, dependencies, and services contained within that repository. Tests and Husky scripts must not import, require, read, execute, or otherwise depend on sibling repositories or paths outside the repository root. app-e2e-tests is the only exception because cross-repository end-to-end testing is its explicit responsibility.

Non-negotiable code organization rule: Functions with the same or equivalent behavior must use the same or clearly corresponding descriptive names across CareCard repositories, and equivalent functionality must live in files with the same names within each repository's established architecture. No backward compatibility names, aliases, or duplicate locations are allowed.

## Trigger

Run this skill after every `pkg-*` repository change that touches non-Markdown
package files: source code, public type declarations, tests, scripts,
configuration, package metadata, lockfiles, dependency behavior, or validation
behavior.

Do not run this skill for Markdown-only changes, including README-only or
`*.md` skill-documentation-only updates.

## Version Rule

1. Check `package.json` in all four package repositories:
   `pkg-common-util`, `pkg-validate`, `pkg-auth-util`, and `pkg-jwt-read`.
2. Select one minor version higher than the highest current package version.
   If the highest version is `3.7.0`, the coordinated target version is
   `3.8.0`.
3. Use the same target version for all four packages.
4. Update each package's `package.json` and `package-lock.json`, then commit the
   version change on a package release branch before publishing.

## Publish Order

Always publish packages in this order, one repository at a time:

1. `@carecard/common-util`
2. `@carecard/validate`
3. `@carecard/auth-util`
4. `@carecard/jwt-read`

Publish by pushing the package release branch, creating or reusing a pull
request into `development`, marking it ready, waiting for checks, squash-merging
with administrator privileges, and verifying npm publication with:

```sh
npm view <package-name>@<target-version> version
```

The package GitHub workflow publishes automatically from `development`. Do not
create a `main` merge unless the user explicitly asks for it.

## Deferred Package Push

Commit coordinated version and dependency updates locally as the release sequence
progresses. Do not push a `pkg-*` release branch until that package is the next
package being published by merge into `development`.

Immediately before each package's publishing turn:

1. Verify the repository is on the intended release branch and has a clean
   working tree.
2. Run required validation and every direct `.husky` script for that repository.
3. Push that package's release branch.
4. Create or reuse the pull request into `development`, merge it, and wait for
   npm publication before continuing to dependency fanout.

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
4. `@carecard/jwt-read` is last, so no later package repository depends on it.

Use exact installs so `package.json` and `package-lock.json` stay aligned:

```sh
npm install <package-name>@<target-version> --save-exact
```

## Service And Dashboard Consumers

After all four packages are published, update all `ms-*` repositories and
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

Finish by verifying that all four packages are published at the same target
version and every declared `@carecard/*` dependency in `pkg-*`, `ms-*`, and
`app-dashboard` is pinned to that version.
