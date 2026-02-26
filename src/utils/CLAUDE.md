# src/utils/

## What's Here
Pure utility functions: cell address parsing (A1→{row,col}), color conversion, debounce, throttle, deep clone.

## Patterns to Follow
- TypeScript strict mode — no any, no @ts-ignore
- Export named, not default (except React components)
- One concern per file — keep files under 300 lines

## Do NOT
- Import from server/ — frontend and backend are separate
- Use any or as any — fix the types properly
- Skip tests — every feature needs at least one E2E test
