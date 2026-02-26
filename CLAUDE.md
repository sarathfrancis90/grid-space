# GridSpace — Production-Ready Google Sheets Replacement

> **427 features · 16 sprints · Full-stack · Multi-user · Real-time collaboration**
> This is a drop-in replacement for Google Sheets. Every feature. End to end.

## Mission

Build a production-ready spreadsheet application that fully replaces Google Sheets.
Frontend + Backend + Database + Auth + Sharing + Real-time Collaboration + API.

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + TypeScript | UI framework |
| **State** | Zustand + Immer | Client-side state management |
| **Grid** | HTML5 Canvas + react-window | High-performance virtual grid |
| **Formulas** | Custom parser + formulajs | 80+ spreadsheet functions |
| **Charts** | Chart.js | 7 chart types |
| **File I/O** | SheetJS + PapaParse | XLSX/CSV import/export |
| **Styling** | TailwindCSS | Utility-first CSS |
| **Backend** | Express + TypeScript | REST API + WebSocket server |
| **Database** | PostgreSQL + Prisma ORM | Persistent storage |
| **Cache/Sessions** | Redis | Session store, pub/sub, caching |
| **Auth** | Passport.js + JWT + bcrypt | Email/password + OAuth |
| **Real-time** | Socket.io + Yjs (CRDT) | Multi-user collaboration |
| **Email** | Resend (or SendGrid) | Sharing invitations, notifications |
| **Testing** | Playwright (E2E) + Vitest (unit) | Full test coverage |
| **CI/CD** | GitHub Actions + Vercel/Docker | Automated deploy pipeline |
| **Monitoring** | Sentry (errors) + Pino (logs) | Production observability |

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│  FRONTEND (React SPA)                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐   │
│  │   Grid   │ │ Formula  │ │ Toolbar  │ │  Dashboard    │   │
│  │  Canvas  │ │  Engine  │ │  & Menus │ │  (Home page)  │   │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐   │
│  │  Charts  │ │   Auth   │ │ Sharing  │ │  Version Hx   │   │
│  │ Chart.js │ │  Pages   │ │  Dialog  │ │   Sidebar     │   │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Zustand Stores (12 stores)                          │    │
│  │  spreadsheet, grid, cell, formula, history,          │    │
│  │  clipboard, filter, ui, auth, sharing, realtime,     │    │
│  │  notifications                                       │    │
│  └──────────────────────────────────────────────────────┘    │
└───────────────────────────┬──────────────────────────────────┘
                            │ REST API + WebSocket
┌───────────────────────────▼──────────────────────────────────┐
│  BACKEND (Express + Socket.io)                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐   │
│  │  Auth    │ │  CRUD    │ │ Sharing  │ │  Real-time    │   │
│  │ Passport │ │  API     │ │ Service  │ │  Socket.io    │   │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐   │
│  │ Version  │ │  Notif   │ │  Email   │ │  Public API   │   │
│  │ Service  │ │ Service  │ │  Resend  │ │  (REST+Keys)  │   │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘   │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│  DATA LAYER                                                  │
│  ┌──────────────────┐  ┌─────────────────────────────────┐   │
│  │  PostgreSQL      │  │  Redis                          │   │
│  │  (Prisma ORM)    │  │  Sessions, Cache, Pub/Sub       │   │
│  │  Users, Sheets,  │  │  WebSocket adapter for scaling  │   │
│  │  Versions, ACL   │  │                                 │   │
│  └──────────────────┘  └─────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
grid-space/
├── CLAUDE.md                    ← You are here
├── package.json                 ← Monorepo root (npm workspaces)
├── packages/
│   ├── client/                  ← React frontend (Vite)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── grid/        ← Canvas grid, virtual scroll, selection
│   │   │   │   ├── formula/     ← Formula parser, engine, dependency graph
│   │   │   │   ├── formula-bar/ ← Formula bar, name box, autocomplete
│   │   │   │   ├── toolbar/     ← Toolbar buttons, dropdowns, menus
│   │   │   │   ├── sheets/      ← Sheet tabs, add/delete/rename
│   │   │   │   ├── data/        ← Sort, filter, validation, pivot tables
│   │   │   │   ├── charts/      ← Chart.js wrapper, chart editor sidebar
│   │   │   │   ├── file-ops/    ← Import/export, CSV, XLSX, PDF
│   │   │   │   ├── ui/          ← Menus, context menus, dialogs, modals
│   │   │   │   ├── auth/        ← Login, register, OAuth, profile pages
│   │   │   │   ├── dashboard/   ← Spreadsheet list, templates, home page
│   │   │   │   ├── sharing/     ← Share dialog, permissions UI
│   │   │   │   ├── versions/    ← Version history sidebar, diff view
│   │   │   │   ├── realtime/    ← Presence avatars, cursors, indicators
│   │   │   │   └── notifications/ ← Bell icon, notification center
│   │   │   ├── stores/          ← 12 Zustand stores
│   │   │   ├── hooks/           ← Custom React hooks
│   │   │   ├── services/        ← API client, WebSocket client, auth service
│   │   │   ├── workers/         ← Web Workers for formula recalc
│   │   │   ├── types/           ← TypeScript interfaces
│   │   │   ├── utils/           ← Pure utility functions
│   │   │   └── App.tsx          ← Router, providers, layout
│   │   ├── public/
│   │   └── vite.config.ts
│   │
│   └── server/                  ← Express backend
│       ├── src/
│       │   ├── routes/          ← Route definitions
│       │   ├── controllers/     ← Request handlers
│       │   ├── services/        ← Business logic
│       │   ├── middleware/      ← Auth, validation, rate limit, error
│       │   ├── models/          ← Prisma client wrapper
│       │   ├── websocket/       ← Socket.io setup, rooms, handlers
│       │   ├── email/           ← Email templates, sending service
│       │   ├── utils/           ← Server utilities
│       │   ├── config/          ← Environment, constants
│       │   └── app.ts           ← Express app setup
│       ├── prisma/
│       │   ├── schema.prisma    ← Database schema
│       │   ├── migrations/
│       │   └── seed.ts
│       └── tsconfig.json
│
├── docker-compose.yml           ← PostgreSQL + Redis for development
├── Dockerfile                   ← Production multi-stage build
├── nginx.conf                   ← Reverse proxy config
├── .github/workflows/ci.yml     ← CI pipeline
├── agent_docs/                  ← Detailed guides (read before coding)
├── .claude/                     ← Claude Code configuration
└── tests/                       ← Shared E2E test utilities
```

## Feature Domains (427 total)

| Sprint | Domain | Count | Key Features |
|---|---|---|---|
| 1 | Grid Foundation | 41 | Canvas render, selection, navigation, copy/paste, fill handle |
| 2 | Formula Engine | 41 | Parser, 80+ functions, dependency graph, error handling |
| 3 | Formatting | 38 | Text, number, borders, merge, paint format, conditional |
| 4 | Sheets & Data | 40 | Tabs, sort, filter, pivot tables, named ranges, validation |
| 5 | File Ops & Undo | 18 | CSV/XLSX import/export, undo/redo, autosave |
| 6 | Charts | 24 | 7 chart types, chart editor, conditional formatting extras |
| 7 | UI Polish | 25 | Menus, formula bar, context menus, comments, hyperlinks |
| 8 | Keyboard & Perf | 22 | Shortcuts, print dialog, zoom, performance benchmarks |
| **9** | **Backend Foundation** | **22** | **Express, Prisma, PostgreSQL, Redis, Docker, middleware** |
| **10** | **Auth & Users** | **24** | **Register, login, JWT, OAuth (Google/GitHub), profile** |
| **11** | **Cloud Storage** | **22** | **Save/load server, dashboard, auto-save, favorites** |
| **12** | **Sharing & Perms** | **22** | **Share dialog, roles, link sharing, permission enforce** |
| **13** | **Version History** | **15** | **Timeline, diff view, restore, named versions** |
| **14** | **Real-Time Collab** | **28** | **WebSocket, presence, cursors, Yjs CRDT, sync** |
| **15** | **Notif & Templates** | **20** | **Comments upgrade, @mentions, notifications, templates** |
| **16** | **API & Production** | **25** | **REST API, webhooks, Docker prod, offline, monitoring** |

## Session Protocol

### On Session Start
1. `git pull origin main`
2. Check `feature_list.json` for next incomplete feature
3. Read relevant `agent_docs/*.md` for the feature domain
4. Read relevant `src/*/CLAUDE.md` for directory-specific rules

### Development Loop (per feature)
1. Read the story/feature requirements
2. Write the implementation code
3. Write tests (Vitest unit + Playwright E2E)
4. Run `npx tsc --noEmit` — fix all type errors
5. Run `npx vitest run` — fix all test failures
6. Run `npx playwright test` — fix all E2E failures
7. Update `feature_list.json`: set `"passes": true`
8. `git add -A && git commit -m "feat(scope): description" && git push origin main`
9. Update `claude-progress.txt` with session log

### On Session End
1. Run full test suite: `npx tsc && npx vitest run && npx playwright test`
2. Commit any remaining work: `git add -A && git commit -m "wip: session progress" && git push origin main`
3. Update `claude-progress.txt` with summary

## Progressive Disclosure — Read Before Coding

| If working on... | Read this first |
|---|---|
| Grid rendering, selection, scroll | `agent_docs/grid-rendering.md` |
| Formulas, functions, parser | `agent_docs/formula-engine.md` |
| Zustand stores, state updates | `agent_docs/state-management.md` |
| Cell formatting, borders, styles | `agent_docs/formatting-system.md` |
| Keyboard shortcuts | `agent_docs/keyboard-shortcuts.md` |
| Writing tests | `agent_docs/testing-guide.md` |
| Common mistakes, Canvas quirks | `agent_docs/known-gotchas.md` |
| **Backend, Express, Prisma** | **`agent_docs/backend-architecture.md`** |
| **Auth, JWT, OAuth, Passport** | **`agent_docs/auth-system.md`** |
| **Real-time, WebSocket, Yjs** | **`agent_docs/collaboration-system.md`** |
| **REST API, endpoints, keys** | **`agent_docs/api-design.md`** |
| **Database schema, migrations** | **`agent_docs/database-schema.md`** |
| Directory-specific rules | `src/<directory>/CLAUDE.md` |

## Commit Convention

```
feat(grid): implement virtual scroll with 10k row support
feat(formula): add VLOOKUP function
feat(auth): implement JWT login flow
feat(realtime): add Yjs CRDT sync for cell edits
fix(grid): correct selection after column insert
test(formula): add unit tests for SUMIF/COUNTIF
chore: update dependencies
```

## NEVER DO

- ❌ Commit without running `npx tsc --noEmit` first
- ❌ Commit without pushing (`git push origin main`)
- ❌ Skip writing tests for a feature
- ❌ Use `any` type in TypeScript — always type properly
- ❌ Mutate Zustand state directly — always use Immer `set(state => { ... })`
- ❌ Put business logic in React components — use stores/services
- ❌ Hardcode API URLs — use environment variables
- ❌ Store passwords in plain text — always bcrypt
- ❌ Trust client-side permission checks alone — always verify server-side
- ❌ Store secrets in code — use .env files (never committed)
- ❌ Use localStorage for multi-user data — that's PostgreSQL
- ❌ Skip input validation on API endpoints — use Zod
- ❌ Modify `CLAUDE.md`, `feature_list.json`, `settings.json`, or `package-lock.json` without explicit instruction
