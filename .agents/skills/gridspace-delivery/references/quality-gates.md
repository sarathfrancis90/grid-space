# Quality Gates

Run these checks before opening or updating a PR.

## Required

1. `npm run typecheck`
2. `npx vitest run`
3. `npm run build`

## Conditional

- `npx playwright test` for user-facing behavior changes or end-to-end flow updates.

## PR Checklist

- Explain what changed and why.
- Include validation commands executed.
- Link issues with `Closes #<issue-number>` when applicable.
- Note risk areas and follow-up tasks.

## Common Failure Policy

- If typecheck fails: fix types first; do not defer with `any`.
- If tests fail: isolate regressions and add/update tests for changed behavior.
- If build fails: fix build pipeline before requesting review.
