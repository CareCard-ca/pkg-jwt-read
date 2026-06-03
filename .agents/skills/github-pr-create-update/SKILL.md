---
name: github-pr-create-update
description: 'Use only when the user explicitly asks for remote Git or GitHub PR work: pushing a branch, creating or updating a PR, or marking a PR ready from the current repository branch.'
---

# Pull Request Create

## Purpose

After the user explicitly asks for remote Git or GitHub PR work, create, update, verify, push, and mark ready a GitHub pull request from the current repository branch into origin/development.

## When To Use

- Use only when the user explicitly asks to create, update, push for, or mark ready a GitHub pull request from the current repository branch.

## When Not To Use

- Do not use for merging or deleting an already-approved pull request; use the merge cleanup skill.
- Do not use for ordinary local commits that do not involve GitHub PR work.

## Remote Git Operations Guardrail

Do not run remote Git or GitHub operations unless the current user request explicitly asks for them. This includes `git fetch`, `git pull`, `git push`, `git push --delete`, remote branch cleanup, GitHub API calls, and any `gh pr` command that creates, updates, readies, merges, closes, or cleans up a pull request. Do not infer permission from branch names, validation needs, prior workflow habits, or convenience; ask first when remote state would help but was not requested.

## Relevant Files And Directories

- Git branch state in this repository
- GitHub pull requests viewed with `gh`
- repository validation commands and `.husky` scripts

## Coding Principles

- Preserve the repository structure, naming style, module system, and local helper patterns.
- Prefer readable, maintainable code with meaningful function, variable, file, and test names.
- Avoid new dependencies unless the existing stack cannot reasonably solve the task and the user confirms the tradeoff.

## Testing Expectations

- Run repository validation before PR creation or merge when code behavior changed.
- Confirm the branch is clean except intended changes before finishing.

## Safety Constraints

- Do not edit generated output, dependency folders, logs, coverage, dist, or build artifacts unless the task requires it.
- Do not revert or overwrite user changes; stage only requested skill or instruction files.
- Never suppress errors, lint failures, type failures, security failures, or failing tests; fix the underlying issue or report the blocker.

## Commit Continuation Rule

Do not amend commits unless the user explicitly asks. If
hook, formatter, documentation, skill, validation, or review follow-up changes
appear after a commit, stage only the intended files and make a new commit with
a clear message.

## Scope

Use this skill from the root of the repository whose current branch contains
the intended PR changes. The repository must have `origin/development`, and
GitHub CLI must be available and authenticated.

Do not continue automatically when:

- The current branch is `development`, `main`, `master`, or detached.
- The working tree has uncommitted changes. Explain that a PR only includes
  committed changes and ask the user whether to commit or stash them.
- `gh auth status` fails.
- `origin/development` cannot be fetched.

## Workflow

1. Capture the source branch and run preflight checks:

   ```sh
   branch="$(git branch --show-current)"
   test -n "$branch"
   test "$branch" != "development"
   test "$branch" != "main"
   test "$branch" != "master"
   git status --short
   gh auth status
   ```

2. Pull a fresh development reference from the remote without leaving the
   source branch:

   ```sh
   git fetch origin development --prune
   ```

   Use `origin/development` as the source of truth. If a local `development`
   branch exists and is not checked out, it may be fast-forwarded to match the
   remote without forcing history:

   ```sh
   git fetch origin development:development
   ```

   If that local branch update fails because `development` has diverged or is
   checked out in another worktree, do not force it. Continue using
   `origin/development` for validation.

3. Check whether the current branch can merge with latest development without
   changing the worktree:

   ```sh
   if git merge-tree --write-tree HEAD origin/development >/tmp/pull-request-create-merge-tree.out
   then
     merge_conflict_detected=false
   else
     merge_conflict_detected=true
   fi
   ```

4. If a merge conflict is detected, try rebasing on latest development:

   ```sh
   if [ "$merge_conflict_detected" = true ]; then
     if git rebase origin/development; then
       git push --force-with-lease -u origin "$branch"
     else
       git rebase --abort
       echo "Rebase conflicted; aborted without pushing."
       exit 1
     fi
   else
     git push -u origin "$branch"
   fi
   ```

   Do not resolve rebase conflicts unless the user explicitly asks. If the
   rebase fails, abort it and stop.

5. Inspect the branch changes before writing the PR title:

   ```sh
   git log --reverse --format='%s' origin/development..HEAD
   git diff --stat origin/development...HEAD
   ```

   Create a concise, descriptive title from the actual changes. Remove words
   such as `draft`, `[draft]`, `Draft:`, and `WIP`. Do not leave a generic title
   such as "updates", "changes", or "draft PR".

6. Reuse an existing open PR for this branch when present:

   ```sh
   pr_number="$(gh pr list \
     --head "$branch" \
     --base development \
     --state open \
     --json number \
     --jq '.[0].number // empty')"
   ```

7. If there is no PR, create one against `development` and capture the new PR
   number:

   ```sh
   pr_url="$(gh pr create \
     --base development \
     --head "$branch" \
     --title "$title" \
     --body "$body")"
   pr_number="$(gh pr view "$pr_url" --json number --jq '.number')"
   ```

   Keep the body factual. Mention the main changes and validation commands
   that were actually run.

8. If a PR exists, mark it ready when it is a draft:

   ```sh
   is_draft="$(gh pr view "$pr_number" --json isDraft --jq '.isDraft')"
   if [ "$is_draft" = "true" ]; then
     gh pr ready "$pr_number"
   fi
   ```

9. Update the PR title after create/reuse so it is descriptive and contains no
   draft wording:

   ```sh
   gh pr edit "$pr_number" --title "$title"
   ```

10. Final response should include the PR URL, whether a rebase was performed,
    whether an existing PR was reused or marked ready, and any validation that
    could not be run.
