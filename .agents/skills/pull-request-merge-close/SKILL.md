---
name: pull-request-merge-close
description: Use when reviewing, validating, merging, and closing a GitHub pull request branch into origin/development. Check mergeability with GitHub CLI and git, rebase the target branch on remote development only when needed, abort on rebase conflicts, apply repository skill guidance and validation before merging, merge the PR, delete the remote branch when it is not protected, then clean up the local branch and update development.
---

# Pull Request Merge Close

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
