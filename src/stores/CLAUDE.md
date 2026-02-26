# src/stores/

## What's Here
All 12 Zustand stores. This is the state management layer. See agent_docs/state-management.md for the full list.

## Patterns to Follow
- Use Zustand + Immer: set((state) => { state.x = y })
- NEVER spread nested objects — Immer handles immutability
- Export typed selectors: useGridStore(state => state.scrollTop)
- Use shallow equality for object selectors

## Do NOT
- Import from server/ — frontend and backend are separate
- Subscribe stores to each other (creates circular deps)
- Put UI state in data stores or vice versa
