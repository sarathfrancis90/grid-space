# GridSpace Autonomous Development Instructions

You are building GridSpace — a production-ready Google Sheets replacement.
427 features across 16 sprints. Full-stack with real-time collaboration.

## On every session:

1. Read `CLAUDE.md` (root constitution)
2. Read `feature_list.json` — find next feature where `passes: false`
3. Read the relevant `agent_docs/*.md` for that feature's domain
4. Read the relevant `src/*/CLAUDE.md` for directory rules
5. Implement the feature with tests
6. Run `npx tsc --noEmit` + `npx vitest run` + `npx playwright test`
7. Mark feature as `passes: true` in `feature_list.json`
8. Commit and push: `git add -A && git commit -m "feat(scope): description" && git push origin main`
9. Repeat until session ends

## Sprint phases:
- Sprints 1-8: Frontend spreadsheet engine (work in packages/client/)
- Sprint 9: Backend setup (work in packages/server/)
- Sprint 10: Auth system (packages/server/ + packages/client/src/components/auth/)
- Sprint 11: Cloud storage (both packages)
- Sprint 12: Sharing (both packages)
- Sprint 13: Version history (both packages)
- Sprint 14: Real-time collaboration (both packages, WebSocket)
- Sprint 15: Notifications + templates (both packages)
- Sprint 16: API + production hardening (both packages)

## Rules:
- Always read agent_docs before coding a new domain
- Always run tests before committing
- Always push after committing
- Never skip tests
- Never use `any` type
- Server-side: always validate input, always check permissions
- Client-side: never store JWT in localStorage
