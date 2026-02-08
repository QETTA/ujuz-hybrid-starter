# Admin guide — Enable Auto-approve & Auto-merge (Bypass steps)

This document explains what an administrator must do to allow the `auto-approve-and-merge` workflow to operate safely.

IMPORTANT: These steps involve granting automation permissions — please review security implications before enabling.

Required admin steps

1. Create a GitHub Personal Access Token (PAT)
   - Go to GitHub -> Settings -> Developer settings -> Personal access tokens
   - Generate a token with scope: `repo` (full repo access is recommended for the bot PAT)
   - Save the token securely (you will add it to repo secrets)

2. Add repo secret `BOT_PAT`
   - Repository -> Settings -> Secrets and variables -> Actions -> New repository secret
   - Name: `BOT_PAT`
   - Value: the PAT from step 1

3. (Optional but recommended) Configure branch protection to allow Actions to bypass restrictions
   - Repository -> Settings -> Branches -> Branch protection rules
   - Edit the rule for `main` (or whichever protected branch you use)
   - If you want the workflow to be able to satisfy status checks or merge on behalf of approvals, ensure either:
     - "Allow specified actors to bypass required pull request reviews" is enabled and add your bot account; OR
     - Allow GitHub Actions to create and approve pull requests (depends on your org settings)

4. Confirm workflow operation
   - Add label `auto-merge` or `bypass` to a PR (note: the workflow will act on either label). The workflow is label-driven and applies to PRs targeting any branch by default.
   - The merge method used by the workflow is `squash`.
   - An authorized admin can run the workflow manually via Actions -> "Auto-approve and merge PRs" -> Run workflow

Security notes

- The `BOT_PAT` must be treated as a secret and rotated periodically.
- Do not give the bot PAT to untrusted actors. Limit usage to repos where automation is required.
- Consider using an organization-managed GitHub App with more granular permissions instead of a PAT for better security.

If you want, I can prepare a short admin PR body / Slack message you can send to the repo admins that includes the above steps and a request to add `BOT_PAT` and toggle the branch protection setting.