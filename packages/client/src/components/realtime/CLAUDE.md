# src/components/realtime/ — Real-Time Collaboration UI

## What Lives Here

- `PresenceBar.tsx` — Avatar row showing who's viewing (top of editor)
- `CollaboratorCursor.tsx` — Colored cursor overlay for each remote user
- `ConnectionStatus.tsx` — Connected/Reconnecting/Offline indicator
- `CellLockIndicator.tsx` — Shows "User is editing" on locked cells
- `TypingIndicator.tsx` — Shows when someone is typing in a cell

## Patterns

- Subscribe to `realtimeStore` for presence and cursor data
- Cursors render as a Canvas overlay (separate layer above grid cells)
- Presence bar shows max 5 avatars + "+N more" overflow
- Connection status shows in bottom-left status bar area
- All components must handle rapid updates efficiently (throttle renders)

## Rules

- NEVER block the grid render loop with presence updates
- Throttle cursor position updates to max 10fps outgoing
- Use `React.memo` on all presence components — they re-render frequently
- Colors come from `realtimeStore.connectedUsers[].color` — never random
- Handle disconnected users gracefully (remove cursor after 30s timeout)
