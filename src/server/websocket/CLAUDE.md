# src/server/websocket/

## What's Here
Socket.io server setup, Yjs provider, room management, presence broadcasting, cursor sync. See agent_docs/collaboration.md.

## Patterns to Follow
- Authenticate on connection (verify JWT in handshake)
- Use rooms (spreadsheet ID) for message routing
- Rate limit events per client
- Clean up on disconnect (remove from room, broadcast leave)

## Do NOT
- Import from src/ (frontend code) — shared types go in shared/types/
- Expose raw Prisma errors to API responses
- Skip input validation on any endpoint
- Store secrets in code — use process.env
