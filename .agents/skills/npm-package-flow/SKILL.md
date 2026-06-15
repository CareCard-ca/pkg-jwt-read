---
name: npm-package-flow
description: 'Use in pkg-* repositories when publishable package code changes require a version bump, GitHub development/main squash-merge flow, npm publication, and uncommitted consumer package updates in ms-* and app-dashboard.'
---

# npm Package Flow

## Purpose

Use this skill in a `pkg-*` repository when package code changes need to be
published to npm and propagated to CareCard consumers.

The package name is the `name` field in the repository `package.json`.

## Publishable vs Non-Publishable Changes

Publishable package changes include runtime source changes, public exports,
TypeScript declarations, package metadata that affects consumers, security
behavior, or dependency behavior that changes the package contract.

The following are not publishable package changes by themselves:

- Skills or `.agents` guidance.
- Documentation and README updates.
- Tests, fixtures, mocks, snapshots, or validation-only changes.
- Formatting-only changes and comments.

For non-publishable changes, do not bump the package version, publish to npm,
or update `ms-*` and `app-dashboard` package versions.

## Required Flow For Publishable Changes

Run this workflow only when the user explicitly asks for package publication,
remote GitHub merge work, or the full package-flow completion. Remote Git and
GitHub operations must not be inferred.

1. Finish package code, tests, documentation, and skill updates inside the
   current `pkg-*` repository.
2. Bump the package version in `package.json` and `package-lock.json` according
   to the user request or the package change scope.
3. Run the package's required tests, lint, type checks, and every direct Husky
   script. Fix failures before continuing.
4. Commit the package changes to the current branch.
5. Push the current branch, create or reuse the PR into `development`,
   squash-merge it with administrator privileges, and delete the merged branch.
6. Create a new merge branch from the updated `development` branch and use that
   branch to open a PR into `main`.
7. Squash-merge the merge branch into `main` with administrator privileges and
   delete the merge branch. This `main` merge publishes the package.
8. Confirm publication with `npm view <package-name>@<version> version`.
9. Check out a fresh local branch with the same name as the deleted working
   branch from the updated `development` branch.
10. Update the new `@carecard/...` package version in `app-dashboard` and in
    only the `ms-*` repositories that already declare the package, plus any
    explicitly intended new consumers.
11. Run `npm install` and relevant validation in each updated consumer.
12. Do not commit the `ms-*` or `app-dashboard` consumer updates unless the user
    explicitly asks.

## Consumer Update Rules

- Discover existing consumers by checking each target repository `package.json`
  for the published package name.
- Install exact package versions, for example
  `npm install <package-name>@<version> --save-exact`.
- Keep consumer updates local and uncommitted unless the user gives a separate
  commit or PR instruction.
- If a consumer should become a new dependency, require explicit user intent for
  that repository.

## Reporting

Report the package name, published version, development PR, main PR, npm
publication check, consumer repositories updated, validation commands run, and
any consumer updates intentionally left uncommitted.
