name: Admin: Enable Automation (BOT_PAT + Branch Protection)
about: Request for admin to add BOT_PAT secret and confirm branch protection settings so auto-approve workflows may operate.

---

**Action required (admin):**

1. Generate a GitHub Personal Access Token (PAT) with `repo` scope and provide to automation by adding it as repo secret `BOT_PAT`.
2. (Optional) If branch protection prevents GitHub Actions from approving/merging, update Branch Protection settings to allow the automation bot or allow Actions as needed.
3. Once done, reply to this issue and run the admin workflow `Admin: Test Auto-approve Flow` (Actions tab) to verify. The workflow will create a test PR and add `bypass` label automatically.

Security notes:
- Rotate the PAT periodically and limit access properly. Consider using a GitHub App for finer-grained permissions.

---

(You can use the PR branch: `chore/dev/copilot-vscode-setup-windows` to see the workflow files.)