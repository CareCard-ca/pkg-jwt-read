---
name: github-pr-merge-cleanup
description: 'Use only when the user explicitly asks for remote Git or GitHub PR work: pushing a branch, creating a missing PR, reviewing mergeability, validating, merging, deleting, or cleaning up a pull request branch.'
---

# Pull Request Merge Close

Non-negotiable TDD rule: Always write the failing test first, run it to confirm it fails for the intended reason, then implement the code and rerun the test until it passes. Test Driven Development is required for all coding work and must not be skipped. For documentation- or skill-only edits, add or update the relevant validation check before changing the prose.

Non-negotiable repository isolation rule: Every repository must run its Husky hooks and tests using only files, code, fixtures, dependencies, and services contained within that repository. Tests and Husky scripts must not import, require, read, execute, or otherwise depend on sibling repositories or paths outside the repository root. app-e2e-tests is the only exception because cross-repository end-to-end testing is its explicit responsibility.

Non-negotiable error and warning rule: Never suppress, silence, hide, downgrade, filter, ignore, skip, or bypass errors or warnings from code, tests, tools, compilers, linters, or validation. Fix the root cause, then rerun the affected check and require a clean result. Expected error-path tests may assert errors, but must not conceal unexpected failures.

Non-negotiable code organization rule: Functions with the same or equivalent behavior must use the same or clearly corresponding descriptive names across CareCard repositories, and equivalent functionality must live in files with the same names within each repository's established architecture. No backward compatibility names, aliases, or duplicate locations are allowed.

## Purpose

After the user explicitly asks for remote Git or GitHub PR work, push the
branch, create a missing PR when needed, review, validate, merge, delete the
branch when allowed, and clean local state for a GitHub pull request targeting
`development`, or `main` when `development` is absent.

## When To Use

- Use only when the user explicitly asks to push, review mergeability,
  validate, merge, close, or clean up a GitHub pull request branch.

## When Not To Use

- Do not use for PR-only creation/update work without a merge request; use the
  PR create/update skill.
- Do not use when the user only asks for local code changes without PR merge
  work.

## Remote Git Operations Guardrail

Do not run remote Git or GitHub operations unless the current user request
explicitly asks for them. This includes `git fetch`, `git pull`, `git push`,
`git push --delete`, remote branch cleanup, GitHub API calls, and any `gh pr`
command that creates, updates, readies, merges, closes, or cleans up a pull
request. Do not infer permission from branch names, validation needs, prior
workflow habits, or convenience; ask first when remote state would help but was
not requested.

## Scope

Use this skill from the root of the repository that owns the pull request. The
repository must use GitHub CLI, have a remote base branch, and have the target
branch available locally or on `origin`.

Default terms:

- Base branch: `development` when `origin/development` exists, otherwise
  `main` when `origin/main` exists.
- Target branch: the current branch unless the user names another branch.
- Pull request: the open PR whose head is the target branch and whose base is
  the base branch.

Do not continue automatically when:

- `gh auth status` fails.
- The target branch is detached or is the base branch.
- The working tree has uncommitted changes that are not part of the requested
  PR cleanup.
- Neither `origin/development` nor `origin/main` exists.
- A rebase or validation fix would require behavior changes instead of coding
  criteria cleanup.

If no open pull request exists for the target branch and selected base, create
one as part of the merge workflow when the user requested push/PR/merge
completion.

## Workflow

1. Capture the base branch, target branch, and authentication state:

   ```sh
   gh auth status
   remote_base_refs="$(git ls-remote --heads origin development main)"
   remote_query_status=$?
   if [ "$remote_query_status" -ne 0 ]; then
     printf 'Unable to inspect origin base branches (exit %s).\n' "$remote_query_status" >&2
     exit "$remote_query_status"
   fi
   case "$remote_base_refs" in
     *"refs/heads/development") base="development" ;;
     *"refs/heads/main") base="main" ;;
     *)
       printf '%s\n' "No origin/development or origin/main branch exists." >&2
       exit 1
       ;;
   esac
   target_branch="$(git branch --show-current)"
   test -n "$target_branch"
   test "$target_branch" != "$base"
   git status --short
   ```

   If the user names a target branch, use that branch instead of the current
   branch. If the target branch is not local but exists on `origin`, create a
   local branch from the remote head before continuing:

   ```sh
   if ! git show-ref --verify --quiet "refs/heads/$target_branch"; then
     git fetch origin "$target_branch:$target_branch"
   fi
   git switch "$target_branch"
   git fetch origin "$base" --prune
   ```

2. Push the target branch to the same remote branch name. Do not use
   `--no-verify`; pre-push hooks must run.

   ```sh
   git push -u origin "$target_branch"
   local_sha="$(git rev-parse HEAD)"
   remote_sha="$(git ls-remote --heads origin "$target_branch" | awk '{print $1}')"
   test "$local_sha" = "$remote_sha"
   ```

3. Reuse an existing open PR for this exact branch/base pair, or create one
   when none exists:

   ```sh
   pr_number="$(gh pr list \
     --head "$target_branch" \
     --base "$base" \
     --state open \
     --json number \
     --jq '.[0].number // empty')"

   if [ -z "$pr_number" ]; then
     git log --reverse --format='%s' "origin/$base..HEAD"
     git diff --stat "origin/$base...HEAD"
     pr_url="$(gh pr create \
       --base "$base" \
       --head "$target_branch" \
       --title "$title" \
       --body "$body")"
     pr_number="$(gh pr view "$pr_url" --json number --jq '.number')"
   fi
   ```

4. Mark draft PRs ready and check mergeability before changing history:

   ```sh
   is_draft="$(gh pr view "$pr_number" --json isDraft --jq '.isDraft')"
   if [ "$is_draft" = "true" ]; then
     gh pr ready "$pr_number"
   fi
   gh pr view "$pr_number" --json mergeStateStatus,mergeable,headRefName,baseRefName
   if git merge-tree --write-tree HEAD "origin/$base" >/tmp/pull-request-merge-close-merge-tree.out
   then
     merge_conflict_detected=false
   else
     merge_conflict_detected=true
   fi
   ```

5. If a merge conflict is detected, rebase the target branch on the fresh base
   branch. Abort and stop if the rebase conflicts:

   ```sh
   if [ "$merge_conflict_detected" = true ]; then
     if git rebase "origin/$base"; then
       git push --force-with-lease -u origin "$target_branch"
     else
       git rebase --abort
       echo "Rebase conflicted; aborted without merging."
       exit 1
     fi
   fi
   ```

6. Load and apply all relevant repository skills before merging, then confirm
   the PR is still mergeable after any validation changes.

7. Merge the PR with GitHub CLI. Delete the remote target branch only when it is
   not protected:

   ```sh
   protected="$(gh api "repos/{owner}/{repo}/branches/$target_branch" --jq '.protected')"
   protection_query_status=$?
   if [ "$protection_query_status" -ne 0 ]; then
     printf 'Unable to inspect branch protection (exit %s).\n' "$protection_query_status" >&2
     exit "$protection_query_status"
   fi
   case "$protected" in
     true|false) ;;
     *)
       printf 'Unexpected branch protection value: %s\n' "$protected" >&2
       exit 1
       ;;
   esac
   if [ "$protected" = true ]; then
     gh pr merge "$pr_number" --squash --admin
   else
     gh pr merge "$pr_number" --squash --admin --delete-branch
   fi
   ```

8. If the merge succeeded and the remote branch still exists while unprotected,
   delete it explicitly:

   ```sh
   if [ "$protected" != true ]; then
     remote_target_ref="$(git ls-remote --heads origin "$target_branch")"
     remote_query_status=$?
     if [ "$remote_query_status" -ne 0 ]; then
       printf 'Unable to inspect the remote target branch (exit %s).\n' "$remote_query_status" >&2
       exit "$remote_query_status"
     fi
     if [ -n "$remote_target_ref" ]; then
       git push origin --delete "$target_branch"
     fi
   fi
   ```

9. Clean up the local repository after merge:

   ```sh
   git fetch origin --prune
   git switch "$base"
   git pull --ff-only origin "$base"
   git branch -d "$target_branch" || git branch -D "$target_branch"
   git ls-remote --heads origin "$target_branch"
   ```

10. Final response should include the PR URL, selected base branch, whether a
    rebase was performed, what validation and skill checks ran, whether any
    cleanup commit was added, whether the remote target branch was deleted or
    protected, whether the local target branch was deleted, and whether local
    base branch is up to date.
