# Commit and Push Workflow
1. Run typecheck: `npx tsc --noEmit`
2. Run unit tests: `npx vitest run`
3. Run build: `npm run build`
4. Run E2E tests: `npx playwright test`
5. Stage changes: `git add -A`
6. Commit: `git commit -m "feat: <description>"`
7. Push: `git push origin main`
8. Update progress: `echo "$(date): <features completed>" >> claude-progress.txt`

Commit message prefixes:
- feat: new feature
- fix: bug fix
- refactor: code restructure
- test: adding tests
- chore: maintenance, config changes
- docs: documentation updates
