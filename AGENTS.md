# GridSpace Agent Operating Manual

This file defines how autonomous coding agents (Codex, Claude, and CI agents) should operate in this repository.

## Mission

Deliver production-safe features for GridSpace without regressing reliability, security, or TypeScript quality.

## Project Map

- `packages/client`: React 18 + TypeScript frontend (Zustand + Immer, Canvas grid, Vite)
- `packages/server`: Express + TypeScript backend (Prisma + PostgreSQL + Redis, Socket.io)
- `agent_docs`: domain references for architecture and implementation details
- `CLAUDE.md`: root engineering constitution and workflow constraints
- `feature_list.json`: roadmap and feature completion state

## Required Read Order

Before implementing any non-trivial change:

1. Read `CLAUDE.md`.
2. Read the relevant guide in `agent_docs/` for the domain you are touching.
3. Read the nearest `CLAUDE.md` inside touched directories (for local conventions).
4. Read existing tests in the same area and extend them.

## Hard Rules

- Keep strict TypeScript quality. Do not introduce `any`.
- Follow backend layering: Route -> Controller -> Service.
- Keep business logic out of React components; prefer stores/services.
- Never trust client-only permission checks; enforce access server-side.
- Validate external input (prefer Zod schemas).
- Do not hardcode secrets, tokens, or environment-specific URLs.
- Do not modify protected/config-critical files unless explicitly requested:
  - `package-lock.json`
  - `.env`
  - `.env.example`
  - `CLAUDE.md`
  - `.claude/settings.json`

## Delivery Checklist

For code changes (unless issue scope explicitly says otherwise):

1. `npm run typecheck`
2. `npx vitest run`
3. `npm run build`
4. `npx playwright test` for user-facing behavior changes

If a command cannot be run in CI context (for example missing browser deps), report it clearly in PR notes.

## Git Workflow

- Branch naming:
  - Feature work: `codex/issue-<number>-<short-slug>`
  - PR fixes: continue on existing PR branch
- Commit style:
  - `feat(scope): ...`
  - `fix(scope): ...`
  - `test(scope): ...`
  - `chore(scope): ...`
- Keep commits focused and explain intent in commit body when non-obvious.

## PR Requirements

- Link issue with `Closes #<number>` when relevant.
- Include:
  - What changed
  - Why it changed
  - Validation performed (typecheck/tests/build/e2e)
  - Any tradeoffs or follow-up items

## Agent Trigger Semantics

- `@codex`: implementation/fix workflow trigger.
- `@codex review`: review workflow trigger.
- `@claude`: existing Claude workflow trigger.
- Use labels `codex` or `codex-code` to route work to Codex issue automation.

## Local Command Reference

- Dev:
  - `npm run dev:client`
  - `npm run dev:server`
- Quality:
  - `npm run typecheck`
  - `npx vitest run`
  - `npm run build`
  - `npx playwright test`
- Server DB:
  - `npx prisma migrate deploy --schema packages/server/prisma/schema.prisma`
