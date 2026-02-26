# src/hooks/ — Custom React Hooks

## What Lives Here

- `useAuth.ts` — Current user, login state, logout function
- `useSpreadsheet.ts` — Load/save spreadsheet, auto-save logic
- `useRealtime.ts` — WebSocket connection, presence, cursor sync
- `usePermission.ts` — Check current user's role (owner/editor/viewer)
- `useKeyboardShortcuts.ts` — Global keyboard event handling
- `useClickOutside.ts` — Close dropdowns/modals on outside click
- `useDebounce.ts` — Debounced values for auto-save, search
- `useUndoRedo.ts` — Undo/redo stack management

## Rules

- Hooks are thin wrappers around Zustand stores + side effects
- NEVER put business logic in hooks — that goes in stores or services
- ALWAYS clean up side effects in useEffect return function
- Name hooks with `use` prefix: `useAuth`, not `getAuth`
- Each hook file exports ONE hook (matching filename)
