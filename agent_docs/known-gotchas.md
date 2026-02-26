# Known Gotchas & Common Mistakes

## Canvas
- Canvas text rendering: set font BEFORE measureText
- Canvas is NOT retina-aware by default — scale by devicePixelRatio
- fillRect(x, y, w, h) — coordinates must be integers for crisp lines
- Clear before redraw: ctx.clearRect(0, 0, width, height)
- Avoid creating new Path2D objects in hot loops

## Formula Engine
- formulajs throws on invalid input — always wrap in try/catch
- formulajs.DATE returns a JS Date, not a number — convert for display
- Empty cells should be treated as 0 in SUM, not NaN
- String comparison is case-insensitive in Google Sheets
- Circular reference detection must handle A1→B1→A1 AND A1→A1

## React + Canvas
- Canvas ref: use useRef<HTMLCanvasElement>(null)
- Redraw on state change: useEffect with dependency on visible data
- Don't put canvas in React's render cycle — it should draw imperatively
- Keyboard events: document.addEventListener, not on canvas element

## Zustand + Immer
- NEVER use spread (...) inside set() — Immer handles immutability
- NEVER return a new object from set() — just mutate the draft
- For Maps: use draft.cells.set(key, value), not assignment
- Subscriptions: use shallow equality selectors to prevent over-rendering

## SheetJS (XLSX)
- Import: const workbook = XLSX.read(data, { type: 'array' })
- Dates: use { cellDates: true } option to get proper dates
- Styles: use xlsx-style fork if you need formatting (SheetJS community edition has limited style support)

## Chart.js
- Destroy chart before recreating: chart.destroy() in useEffect cleanup
- Update data: chart.data = newData; chart.update() — don't recreate
- Responsive: set responsive: true, maintainAspectRatio: false

## Prisma
- ALWAYS use select/include to limit data — don't fetch entire relations
- Use transactions for multi-write operations
- Connection pooling: set connection_limit in DATABASE_URL
- Migration: npx prisma migrate dev --name description
- Client: import { PrismaClient } from '@prisma/client' — singleton pattern

## Socket.io
- Client reconnects automatically but Yjs needs re-sync
- Room cleanup: remove from room on disconnect
- Binary data is more efficient than JSON for Yjs updates
- Rate limit WebSocket events — 100 events/sec per client max

## JWT
- Access token in memory ONLY — never localStorage
- Refresh token in httpOnly secure cookie
- Token rotation: issue new refresh token on each refresh
- Increment tokenVersion in DB to invalidate all refresh tokens

## OAuth
- Callback URL must match exactly (including trailing slash)
- State parameter for CSRF protection
- Handle case where OAuth email matches existing account

## Docker
- PostgreSQL data: mount volume for persistence
- Redis: mount volume or accept data loss on restart
- Environment variables: use .env file with docker-compose

## Common Mistakes to Avoid
- Don't use any or @ts-ignore — fix the types properly
- Don't skip input validation on API endpoints — use Zod
- Don't expose Prisma errors to clients — map to AppError
- Don't store secrets in code — always use .env
- Don't skip permission checks — EVERY endpoint must verify access
- Don't use synchronous operations in Express handlers
- Don't forget to clean up WebSocket listeners on component unmount

## Backend Gotchas (Sprints 9-16)

### Prisma
- **Always run `npx prisma generate`** after changing schema.prisma
- **Use `npx prisma migrate dev --name description`** for schema changes in development
- **Never use `prisma.$queryRaw`** unless absolutely necessary — always prefer Prisma Client
- **PrismaClient is NOT thread-safe** for connection limits — use a singleton (`new PrismaClient()` once)
- **JSON/JSONB fields** come back as plain objects — no need to JSON.parse()
- **`onDelete: Cascade`** must be explicit — Prisma doesn't cascade by default
- **DateTime fields** return JS Date objects — use `.toISOString()` for API responses
- **`.findUnique()` returns null** if not found — always check before accessing

### JWT / Auth
- **NEVER store JWT in localStorage** — use in-memory (Zustand) + httpOnly cookie for refresh
- **JWT `expiresIn` is a string** ('15m', '7d') — NOT a number
- **`jwt.verify()` throws** on expired tokens — wrap in try/catch
- **bcrypt.compare() is async** — always await it
- **Passport serialize/deserialize** only needed for session-based auth — skip with JWT

### Socket.io
- **Socket.io v4 does NOT auto-reconnect** to rooms after disconnect — must rejoin
- **Binary data** not supported well in JSON mode — use base64 for any binary
- **Room names must be strings** — use `spreadsheet:${id}` pattern
- **`socket.to(room).emit()`** excludes sender — `io.to(room).emit()` includes everyone
- **Redis adapter required** for multi-server deployment — `@socket.io/redis-adapter`
- **Connection drops** are normal — always implement reconnection logic on client

### Yjs
- **Y.Doc must be created fresh** for each spreadsheet — don't reuse
- **Y.Map.set() triggers observe callbacks** — avoid infinite loops
- **Yjs updates are binary** (Uint8Array) — use y-websocket provider to handle transport
- **Merging Yjs docs** only works if they share the same document ID
- **Y.Doc.destroy()** must be called on cleanup — memory leak otherwise
- **Don't store Yjs Y.Doc in React state** — use a ref or module-level variable

### Redis
- **Redis connection must be separate** for pub and sub — can't reuse same connection
- **Key expiry** for sessions: `SET key value EX 604800` (7 days in seconds)
- **FLUSHDB** in tests — always use a separate Redis DB number for tests

### Docker Compose
- **PostgreSQL takes ~5s to start** — use health checks before running migrations
- **Volume mounts** persist data between restarts — use `docker compose down -v` to reset
- **Port conflicts** — check nothing else is running on 5432 or 6379
