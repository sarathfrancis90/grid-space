# src/services/ — API Client & External Services

## What Lives Here
- `api.ts` — Axios instance with JWT interceptor, base URL config
- `authApi.ts` — Login, register, refresh, OAuth endpoints
- `spreadsheetApi.ts` — CRUD operations for spreadsheets
- `sharingApi.ts` — Share, revoke, permissions endpoints
- `commentApi.ts` — CRUD for comments
- `versionApi.ts` — Version history endpoints
- `notificationApi.ts` — Notification endpoints
- `websocketClient.ts` — Socket.io connection, Yjs provider setup

## Patterns
- All API functions return typed responses using generics
- Use the standard ApiResponse<T> wrapper type
- API client auto-refreshes JWT on 401 (see auth-system.md)
- WebSocket client handles reconnection automatically
- Export named functions, not default exports

## Rules
- NEVER store API base URL in code — use `import.meta.env.VITE_API_URL`
- ALWAYS type API responses — no `any`
- NEVER call fetch() directly — always use the configured Axios instance
- Handle errors at the call site, not in the service layer
- WebSocket connection must verify auth before joining rooms
