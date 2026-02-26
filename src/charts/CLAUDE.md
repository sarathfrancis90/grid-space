# src/charts/

## What's Here
Chart.js integration: 7 chart types, chart editor sidebar, chart container (move/resize/delete), data binding.

## Patterns to Follow
- TypeScript strict mode — no any, no @ts-ignore
- Export named, not default (except React components)
- One concern per file — keep files under 300 lines

## Do NOT
- Import from server/ — frontend and backend are separate
- Use any or as any — fix the types properly
- Skip tests — every feature needs at least one E2E test
