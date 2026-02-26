#!/bin/bash
# Pre-stop verification: ensure quality before ending session
set -e
echo "🔍 Running pre-stop verification..."

# 1. TypeScript
echo "  ✓ TypeScript check..."
npx tsc --noEmit 2>/dev/null || { echo "❌ TypeScript errors found!"; exit 1; }

# 2. Unit tests
echo "  ✓ Unit tests..."
npx vitest run --reporter=dot 2>/dev/null || { echo "❌ Unit tests failed!"; exit 1; }

# 3. Build
echo "  ✓ Build check..."
npm run build 2>/dev/null || { echo "❌ Build failed!"; exit 1; }

# 4. Uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  echo "⚠️  Uncommitted changes detected. Commit and push before ending."
  exit 1
fi

# 5. Unpushed commits
UNPUSHED=$(git log --oneline origin/main..HEAD 2>/dev/null | wc -l)
if [[ "$UNPUSHED" -gt 0 ]]; then
  echo "⚠️  $UNPUSHED unpushed commit(s). Push before ending."
  exit 1
fi

echo "✅ All checks passed. Safe to end session."
