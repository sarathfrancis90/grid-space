---
name: gridspace-delivery
description: Use this skill when implementing, fixing, or reviewing code in the GridSpace monorepo (packages/client, packages/server, GitHub workflows). It provides repo-specific workflow, validation, architecture, and PR standards.
---

# GridSpace Delivery

## Overview

This skill standardizes how to deliver safe changes in GridSpace:

- Chooses the right architecture path (frontend/backend/workflows).
- Applies repo constraints from `AGENTS.md` and `CLAUDE.md`.
- Enforces validation and PR quality gates.

## Use This Skill When

- A task touches files in `packages/client` or `packages/server`.
- A task changes CI/CD or GitHub automation in `.github/workflows`.
- A task requires issue-to-PR execution with verification and safe rollout.

## Workflow

1. Read context in this order:
   - `AGENTS.md`
   - `CLAUDE.md`
   - Relevant `agent_docs/*.md`
   - Nearest directory `CLAUDE.md` in touched code paths
2. Plan minimal change set.
3. Implement according to domain architecture.
4. Validate with repo commands.
5. Prepare PR with risk notes and test evidence.

## Domain Routing

- Frontend paths (`packages/client`): prefer store/service driven logic; avoid heavy component-side business logic.
- Backend paths (`packages/server`): preserve Route -> Controller -> Service boundaries and explicit permission checks.
- Workflow paths (`.github/workflows`): keep trigger conditions deterministic and avoid infinite review loops.

For details, read:

- `references/domain-routing.md`
- `references/quality-gates.md`

## Validation Gate

Run (or explain why not run):

1. `npm run typecheck`
2. `npx vitest run`
3. `npm run build`
4. `npx playwright test` for user-facing behavior changes
