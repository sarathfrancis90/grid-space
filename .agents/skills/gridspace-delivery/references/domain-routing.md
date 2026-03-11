# Domain Routing

Use this mapping to choose the correct implementation path quickly.

## Frontend

- Primary location: `packages/client/src`
- State: Zustand + Immer stores in `src/stores`
- UI: React components in `src/components`
- Rule: keep business logic in stores/services; keep components mostly orchestration and rendering.

When touching:

- Grid/canvas behavior: read `agent_docs/grid-rendering.md`
- Formula behavior: read `agent_docs/formula-engine.md`
- State behavior: read `agent_docs/state-management.md`
- Tests: read `agent_docs/testing-guide.md`

## Backend

- Primary location: `packages/server/src`
- Architecture: Route -> Controller -> Service
- Rule: enforce auth/permissions server-side; validate input for external payloads.

When touching:

- API design: read `agent_docs/api-design.md`
- Auth: read `agent_docs/auth-system.md`
- Collaboration/WebSocket: read `agent_docs/collaboration-system.md`
- Schema/migrations: read `agent_docs/database-schema.md`

## GitHub Automation

- Primary location: `.github/workflows`
- Rule: keep trigger conditions explicit and loop-safe.
- Rule: guard bot review loops (max iteration strategy).
- Rule: avoid broad permissions unless required.
