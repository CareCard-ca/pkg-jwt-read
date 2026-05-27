---
name: github-pr-merge-cleanup
description: Use only when the user explicitly asks for remote Git or GitHub PR work: reviewing remote mergeability, validating, merging, closing, deleting, or cleaning up a pull request branch.
---

# Pull Request Merge Close

## Purpose

Only after the user explicitly asks for remote Git or GitHub PR work, review, validate, merge, close, delete branch, and clean local state for a GitHub pull request targeting origin/development.

## When To Use

- Use only when the user explicitly asks to review mergeability, validate, merge, close, or clean up a GitHub pull request branch.

## When Not To Use

- Do not use for creating a new pull request; use the PR create/update skill.
- Do not use when the user only asks for local code changes without PR merge work.

## Remote Git Operations Guardrail

Do not run remote Git or GitHub operations unless the current user request explicitly asks for that remote operation. This includes `git fetch`, `git pull`, `git push`, `git push --delete`, remote branch cleanup, GitHub API calls, and any `gh pr` command that creates, updates, readies, merges, closes, or cleans up a pull request. Do not infer permission from branch names, validation needs, prior workflow habits, or convenience; ask first when remote state would be useful but was not requested.

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

- Do not edit generated output, dependency folders, logs, coverage, dist, or build artifacts unless the task explicitly requires it.
- Do not revert or overwrite user changes; stage only files related to the requested skill or instruction update.
- Never suppress errors, lint failures, type failures, security failures, or failing tests; fix the underlying issue or report the blocker.

## Scope

Use this skill from the root of the repository that owns the pull request. The
repository must use GitHub CLI, have a remote base branch, and have the target
branch available locally or on `origin`.

Default terms:

- Base branch: `development` when `origin/development` exists, otherwise the
  repository default branch.
- Target branch: the current branch unless the user names another branch.
- Pull request: the open PR whose head is the target branch and whose base is
  the base branch.

Do not continue automatically when:

- `gh auth status` fails.
- The target branch is detached or is the base branch.
- The working tree has uncommitted changes that are not part of the requested
  PR cleanup.
- No open PR exists for the target branch.
- A rebase or validation fix would require behavior changes instead of coding
  criteria cleanup.

## Workflow

1. Capture the base branch, target branch, PR number, and protection state:

   ```sh
   gh auth status
   base="development"
   git ls-remote --exit-code --heads origin development >/dev/null 2>&1 || \
     base="$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')"
   target_branch="$(git branch --show-current)"
   test -n "$target_branch"
   test "$target_branch" != "$base"
   git status --short
   git fetch origin "$base" --prune
   pr_number="$(gh pr list --head "$target_branch" --base "$base" --state open --json number --jq '.[0].number // empty')"
   test -n "$pr_number"
   protected="$(gh api "repos/{owner}/{repo}/branches/$target_branch" --jq '.protected' 2>/dev/null || echo false)"
   ```

   If the PR head branch is not local, create a local branch from the remote
   head before continuing.

2. Check mergeability before changing history:

   ```sh
   gh pr view "$pr_number" --json mergeStateStatus,mergeable,headRefName,baseRefName
   if git merge-tree --write-tree HEAD "origin/$base" >/tmp/pull-request-merge-close-merge-tree.out
   then
     merge_conflict_detected=false
   else
     merge_conflict_detected=true
   fi
   ```

3. If a merge conflict is detected, rebase the target branch on the fresh base
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

   Do not resolve rebase conflicts unless the user explicitly asks.

4. Load and apply all relevant repository skills before merging:
   - Read the repository's `.agents/skills/**/SKILL.md` files that apply to the
     changed code, plus shared workspace standards when present.
   - Compare the target branch against the base with
     `git diff --stat "origin/$base...HEAD"` and inspect changed files.
   - Check whether the target branch satisfies the applicable coding,
     architecture, validation, security, and style criteria from those skills.
   - Run the validation commands required by the skills and repository hooks.
   - If criteria are not met and the fix does not change functionality, make the
     minimal cleanup, stage only intended files, commit to the target branch,
     and push the target branch.
   - If meeting the criteria would change behavior, stop and report the gap.

5. Confirm the PR is still mergeable after validation changes:

   ```sh
   git fetch origin "$base" --prune
   git merge-tree --write-tree HEAD "origin/$base" >/tmp/pull-request-merge-close-final-merge-tree.out
   gh pr checks "$pr_number"
   ```

6. Merge the PR with GitHub CLI. Delete the remote target branch only when it is
   not protected:

   ```sh
   if [ "$protected" = true ]; then
     gh pr merge "$pr_number" --squash --admin
   else
     gh pr merge "$pr_number" --squash --admin --delete-branch
   fi
   ```

7. Clean up the local repository after merge:

   ```sh
   git fetch origin "$base" --prune
   git switch "$base"
   git pull --ff-only origin "$base"
   git branch -d "$target_branch" || git branch -D "$target_branch"
   git ls-remote --heads origin "$target_branch"
   ```

8. Final response should include the PR URL, whether a rebase was performed,
   what validation and skill checks ran, whether any cleanup commit was added,
   whether the remote target branch was deleted or protected, and whether local
   development is up to date.
