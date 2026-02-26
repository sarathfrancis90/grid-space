# src/file-ops/

## What's Here

Import/export: CSV (PapaParse), XLSX (SheetJS), PDF, JSON, TSV. Drag-and-drop import. File picker.

## Patterns to Follow

- TypeScript strict mode — no any, no @ts-ignore
- Export named, not default (except React components)
- One concern per file — keep files under 300 lines

## Do NOT

- Import from server/ — frontend and backend are separate
- Use any or as any — fix the types properly
- Skip tests — every feature needs at least one E2E test
