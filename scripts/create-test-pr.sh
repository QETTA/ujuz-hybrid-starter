#!/usr/bin/env bash
# Local helper to create a test PR and add the `bypass` label using gh CLI
# Requires: gh CLI authenticated with a token that can create branches and PRs

set -euo pipefail

TIMESTAMP=$(date +%s)
BRANCH="test/auto-approve-$TIMESTAMP"
FILE_PATH=".github/tmp/test-auto-approve-$TIMESTAMP.md"
CONTENT="Test file created at $(date -u --iso-8601=seconds) to verify auto-approve flow."
BASE=$(git rev-parse --abbrev-ref origin/HEAD | sed 's|origin/||') || BASE=master

# Create branch
git checkout -b "$BRANCH" "$BASE"
# Add file
mkdir -p "$(dirname "$FILE_PATH")"
echo "$CONTENT" > "$FILE_PATH"
git add "$FILE_PATH"
git commit -m "chore(ci): add test file for auto-approve $TIMESTAMP"
git push -u origin "$BRANCH"

# Create PR and label it
PR_URL=$(gh pr create --title "ci(test): auto-approve test $TIMESTAMP" --body "This PR is created by local helper to validate the auto-approve/bypass workflow." --base "$BASE" --head "$BRANCH" --label bypass --web)

echo "Created PR: $PR_URL"

echo "Note: The auto-approve workflow requires repo secret BOT_PAT to be set by an admin. If BOT_PAT is present, the PR should be auto-approved and merged after a short delay."