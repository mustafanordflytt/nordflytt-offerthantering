#!/bin/bash

echo "🧹 Cleaning up test files with hardcoded tokens..."

# Create backup directory
mkdir -p .backup-test-files

# Move test files to backup instead of deleting
echo "Moving test files to .backup-test-files/..."

# Fortnox test files
mv fortnox-*.js .backup-test-files/ 2>/dev/null
mv test-fortnox-*.js .backup-test-files/ 2>/dev/null
mv stockholm-flytt-*.js .backup-test-files/ 2>/dev/null
mv quick-fortnox-*.js .backup-test-files/ 2>/dev/null
mv refresh-fortnox-*.js .backup-test-files/ 2>/dev/null
mv test-token-*.js .backup-test-files/ 2>/dev/null
mv test-new-token.js .backup-test-files/ 2>/dev/null
mv test-nordflytt-*.js .backup-test-files/ 2>/dev/null

echo "✅ Test files moved to backup"

# Add backup directory to gitignore
if ! grep -q "^.backup-test-files" .gitignore; then
    echo ".backup-test-files/" >> .gitignore
    echo "✅ Added .backup-test-files to .gitignore"
fi

# Check git status
echo -e "\n📋 Checking git status..."
git status --porcelain | grep -E "(fortnox|stockholm-flytt|test-token)" || echo "✅ No test files tracked in git"

echo -e "\n✅ Cleanup complete!"
echo "Test files are backed up in .backup-test-files/ (gitignored)"