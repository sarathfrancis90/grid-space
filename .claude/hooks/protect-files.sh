#!/bin/bash
# Prevent accidental modification of critical files
PROTECTED_FILES=(
  "package-lock.json"
  ".claude/settings.json"
  "CLAUDE.md"
  "prisma/schema.prisma"
  ".env"
  ".env.example"
)

CHANGED="$1"
for f in "${PROTECTED_FILES[@]}"; do
  if [[ "$CHANGED" == *"$f" ]]; then
    echo "PROTECTED FILE: $f — Are you sure you want to modify this? Use --force flag if intentional."
    exit 1
  fi
done
exit 0
