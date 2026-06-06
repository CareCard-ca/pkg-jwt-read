---
name: github-pr-create-update
description: 'Use only when the user explicitly asks for remote Git or GitHub PR work: pushing a branch, creating or updating a PR, or marking a PR ready from the current repository branch into development or main.'
---

# Pull Request Create

## Purpose

After the user explicitly asks for remote Git or GitHub PR work, create,
update, verify, push, and mark ready a GitHub pull request from the current
repository branch into `development`, or into `main` when `development` is
absent.

## When To Use

- Use only when the user explicitly asks to create, update, push for, or mark
  ready a GitHub pull request from the current repository branch.

## When Not To Use

- Do not use for merging or deleting an already-approved pull request; use the
  merge cleanup skill.
- Do not use for ordinary local commits that do not involve GitHub PR work.

## Remote Git Operations Guardrail

Do not run remote Git or GitHub operations unless the current user request
explicitly asks for them. This includes `git fetch`, `git pull`, `git push`,
`git push --delete`, remote branch cleanup, GitHub API calls, and any `gh pr`
command that creates, updates, readies, merges, closes, or cleans up a pull
request. Do not infer permission from branch names, validation needs, prior
workflow habits, or convenience; ask first when remote state would help but was
not requested.

## Scope

Use this skill from the root of the repository whose current branch contains
the intended PR changes. The repository must have `origin/development` or
`origin/main`, and GitHub CLI must be available and authenticated.

Default terms:

- Base branch: `development` when `origin/development` exists; otherwise
  `main` when `origin/main` exists.
- Source branch: the current branch unless the user names another branch.

Do not continue automatically when:

- The source branch is `development`, `main`, `master`, or detached.
- The working tree has uncommitted changes. Explain that a PR only includes
  committed changes and ask the user whether to commit or stash them.
- `gh auth status` fails.
- Neither `origin/development` nor `origin/main` exists.

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

2. Select the pull request base branch. Prefer `development`; use `main` only
   when `origin/development` is absent:

   ```sh
   if git ls-remote --exit-code --heads origin development >/dev/null 2>&1; then
     base="development"
   elif git ls-remote --exit-code --heads origin main >/dev/null 2>&1; then
     base="main"
   else
     echo "No origin/development or origin/main branch exists."
     exit 1
   fi
   git fetch origin "$base" --prune
   ```

3. Check whether the current branch can merge with the latest base without
   changing the worktree:

   ```sh
   if git merge-tree --write-tree HEAD "origin/$base" >/tmp/pull-request-create-merge-tree.out
   then
     merge_conflict_detected=false
   else
     merge_conflict_detected=true
   fi
   ```

4. If a merge conflict is detected, try rebasing on the latest base:

   ```sh
   if [ "$merge_conflict_detected" = true ]; then
     if git rebase "origin/$base"; then
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

   Do not use `--no-verify`; pre-push hooks must run. Do not resolve rebase
   conflicts unless the user explicitly asks.

5. Verify the remote branch matches local `HEAD`:

   ```sh
   local_sha="$(git rev-parse HEAD)"
   remote_sha="$(git ls-remote --heads origin "$branch" | awk '{print $1}')"
   test "$local_sha" = "$remote_sha"
   ```

6. Inspect the branch changes before writing the PR title:

   ```sh
   git log --reverse --format='%s' "origin/$base..HEAD"
   git diff --stat "origin/$base...HEAD"
   ```

7. Reuse an existing open PR for this exact branch/base pair when present:

   ```sh
   pr_number="$(gh pr list \
     --head "$branch" \
     --base "$base" \
     --state open \
     --json number \
     --jq '.[0].number // empty')"
   ```

8. If there is no PR, create one against the selected base and capture the new
   PR number:

   ```sh
   pr_url="$(gh pr create \
     --base "$base" \
     --head "$branch" \
     --title "$title" \
     --body "$body")"
   pr_number="$(gh pr view "$pr_url" --json number --jq '.number')"
   ```

9. If a PR exists, mark it ready when it is a draft, then keep the title
   descriptive:

   ```sh
   is_draft="$(gh pr view "$pr_number" --json isDraft --jq '.isDraft')"
   if [ "$is_draft" = "true" ]; then
     gh pr ready "$pr_number"
   fi
   gh pr edit "$pr_number" --title "$title"
   ```

10. Final response should include the PR URL, selected base branch, whether a
    rebase was performed, whether an existing PR was reused or marked ready,
    and any validation that could not be run.
