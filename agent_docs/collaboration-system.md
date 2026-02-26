# Real-Time Collaboration Guide

> Read this before working on Sprint 14 (Real-Time Collaboration)

## Architecture Overview

```
Client A                    Server                     Client B
┌──────────┐               ┌──────────────┐           ┌──────────┐
│ Yjs Doc  │◄─ WebSocket ─►│ Socket.io    │◄─ WS ────►│ Yjs Doc  │
│ (local)  │               │              │           │ (local)  │
│          │               │ ┌──────────┐ │           │          │
│ y-websocket              │ │  Redis   │ │           │          │
│ provider │               │ │  PubSub  │ │           │          │
└──────────┘               │ └──────────┘ │           └──────────┘
                           │              │
                           │ ┌──────────┐ │
                           │ │PostgreSQL│ │ ← periodic persistence
                           │ │  (JSONB) │ │
                           │ └──────────┘ │
                           └──────────────┘
```

## Why Yjs (CRDT) over Operational Transform?

|                     | Yjs (CRDT)                 | OT                        |
| ------------------- | -------------------------- | ------------------------- |
| Complexity          | Library handles it         | Must implement yourself   |
| Server role         | Can be dumb relay          | Must transform operations |
| Offline             | Works naturally            | Very hard                 |
| Conflict resolution | Automatic, deterministic   | Complex server logic      |
| Adoption            | Google Docs moving to CRDT | Legacy approach           |

**Use Yjs.** It handles all the hard parts. We just need to:

1. Create a Yjs document per spreadsheet
2. Wire it to Socket.io transport
3. Persist snapshots to PostgreSQL periodically

## Yjs Data Model

```typescript
import * as Y from "yjs";

// One Y.Doc per spreadsheet (shared across all connected clients)
const ydoc = new Y.Doc();

// Cell data as a Y.Map of Y.Maps
// Structure: sheetId → cellRef → cellData
const sheets = ydoc.getMap("sheets");

// Each sheet's cells
const sheet1Cells = new Y.Map();
sheets.set("sheet1-id", sheet1Cells);

// Set a cell value (automatically syncs to all clients)
sheet1Cells.set("A1", { value: "Hello", formula: null, format: {} });

// Observe changes from other clients
sheet1Cells.observe((event) => {
  event.changes.keys.forEach((change, key) => {
    if (change.action === "add" || change.action === "update") {
      const cellData = sheet1Cells.get(key);
      // Update local Zustand store → re-render grid
      cellStore.getState().setCellFromRemote(key, cellData);
    }
  });
});
```

## WebSocket Setup

### Server Side (Socket.io + Yjs)

```typescript
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import * as Y from "yjs";

const io = new Server(httpServer, {
  cors: { origin: env.CLIENT_URL, credentials: true },
  adapter: createAdapter(pubClient, subClient), // Redis for multi-server scaling
});

// Auth middleware — verify JWT on connection
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (!user) return next(new Error("User not found"));
    socket.data.user = user;
    next();
  } catch {
    next(new Error("Authentication failed"));
  }
});

// Room management — one room per spreadsheet
io.on("connection", (socket) => {
  socket.on("join-spreadsheet", async (spreadsheetId: string) => {
    // Verify access permission
    const access = await checkAccess(spreadsheetId, socket.data.user.id);
    if (!access) return socket.emit("error", "Access denied");

    socket.join(`spreadsheet:${spreadsheetId}`);

    // Broadcast presence
    socket.to(`spreadsheet:${spreadsheetId}`).emit("user-joined", {
      userId: socket.data.user.id,
      name: socket.data.user.name,
      avatarUrl: socket.data.user.avatarUrl,
      color: assignColor(socket.data.user.id),
    });

    // Send current presence list
    const room = io.sockets.adapter.rooms.get(`spreadsheet:${spreadsheetId}`);
    // ... send list of connected users
  });
});
```

### Client Side (Socket.io + Yjs)

```typescript
import { io } from "socket.io-client";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

// Connect with JWT
const socket = io(env.VITE_WS_URL, {
  auth: { token: authStore.getState().accessToken },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
});

// Yjs provider syncs document over WebSocket
const ydoc = new Y.Doc();
const provider = new WebsocketProvider(env.VITE_WS_URL, spreadsheetId, ydoc);

// Connection status
provider.on("status", ({ status }) => {
  realtimeStore.getState().setConnectionStatus(status); // 'connected' | 'connecting' | 'disconnected'
});
```

## Presence System

### Data Structure

```typescript
interface PresenceUser {
  userId: string;
  name: string;
  avatarUrl: string | null;
  color: string; // unique color per user (#FF5733, #33FF57, etc.)
  activeSheet: string; // which sheet tab they're on
  cursorCell: string | null; // "B5" or null if not selecting
  selectionRange: string | null; // "B5:D10" or null
}
```

### Color Assignment

Pre-defined palette of 20 distinct colors. Assign based on hash of userId to be deterministic:

```typescript
const COLORS = [
  "#4285F4",
  "#EA4335",
  "#FBBC04",
  "#34A853",
  "#FF6D01",
  "#46BDC6",
  "#7B1FA2",
  "#C2185B",
  "#00897B",
  "#6D4C41",
  "#1565C0",
  "#2E7D32",
  "#E65100",
  "#4527A0",
  "#AD1457",
  "#00838F",
  "#558B2F",
  "#BF360C",
  "#283593",
  "#1B5E20",
];

const assignColor = (userId: string): string => {
  const hash = userId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
};
```

### Cursor Broadcasting

```typescript
// Client sends cursor position on every selection change
socket.emit("cursor-move", {
  spreadsheetId,
  sheetId: currentSheetId,
  cell: "B5",
  range: "B5:D10", // null if single cell
});

// Server broadcasts to room (except sender)
socket.on("cursor-move", (data) => {
  socket.to(`spreadsheet:${data.spreadsheetId}`).emit("cursor-update", {
    userId: socket.data.user.id,
    ...data,
  });
});

// Client renders colored cursor overlay on grid
// See grid-rendering.md for Canvas overlay approach
```

## Cell Lock / Edit Indicator

When a user starts editing a cell:

```typescript
// Client
socket.emit("cell-edit-start", { spreadsheetId, sheetId, cell: "A1" });

// Server tracks active edits
const activeEdits = new Map<string, string>(); // cellKey → userId
socket.on("cell-edit-start", (data) => {
  const key = `${data.sheetId}:${data.cell}`;
  activeEdits.set(key, socket.data.user.id);
  socket.to(`spreadsheet:${data.spreadsheetId}`).emit("cell-locked", {
    cell: data.cell,
    sheetId: data.sheetId,
    userId: socket.data.user.id,
  });
});

// Client shows lock icon and user name on locked cells
// Other users can still see the cell but get a visual indicator
```

## Persistence Strategy

Yjs documents live in memory while clients are connected. Persist to PostgreSQL:

1. **On every Yjs update**: debounce 5 seconds, then save Yjs state to Sheet.cellData
2. **On last client disconnect**: immediately save final state
3. **On server restart**: load from PostgreSQL, reconstruct Yjs doc

```typescript
// Debounced persistence
const saveYjsState = debounce(async (spreadsheetId: string, ydoc: Y.Doc) => {
  const sheets = ydoc.getMap("sheets");
  for (const [sheetId, cellMap] of sheets.entries()) {
    await prisma.sheet.update({
      where: { id: sheetId },
      data: { cellData: cellMap.toJSON() },
    });
  }
}, 5000);

ydoc.on("update", () => saveYjsState(spreadsheetId, ydoc));
```

## Synchronization Flow

```
1. Client A types "Hello" in A1
2. Yjs creates local update + applies immediately (no lag)
3. Update sent to server via WebSocket
4. Server relays to all other clients in room
5. Client B receives update, Yjs merges automatically
6. Client B's grid re-renders with new value
7. Server debounce-saves to PostgreSQL
```

## Handling Edge Cases

### User goes offline

- Yjs buffers local changes
- On reconnect, Yjs syncs all buffered changes automatically
- CRDT guarantees convergence — no conflicts

### Two users edit same cell simultaneously

- Both edits apply locally instantly
- Yjs CRDT resolves: last-write-wins for simple values
- Both users see the resolved state within ~100ms

### Row/column insert shifts references

- Broadcast structural changes as separate events
- All clients adjust their Yjs maps accordingly
- Formula references need re-mapping (coordinate transform)

## Realtime Zustand Store

```typescript
interface RealtimeStore {
  connectionStatus: "connected" | "connecting" | "disconnected";
  connectedUsers: PresenceUser[];
  activeCursors: Map<string, CursorPosition>;
  lockedCells: Map<string, string>; // cellRef → userId

  setConnectionStatus: (status: string) => void;
  addUser: (user: PresenceUser) => void;
  removeUser: (userId: string) => void;
  updateCursor: (userId: string, cursor: CursorPosition) => void;
  lockCell: (cellRef: string, userId: string) => void;
  unlockCell: (cellRef: string) => void;
}
```

## Rules

1. **Never block the UI** waiting for server confirmation — apply locally first (optimistic)
2. **Always verify permissions** on server for every WebSocket event
3. **Debounce persistence** — don't save to DB on every keystroke
4. **Use Redis PubSub** for multi-server Socket.io scaling
5. **Clean up on disconnect** — remove presence, unlock cells, save state
6. **Rate limit WebSocket messages** — max 50 events/second per client
7. **Test with multiple browser tabs** — same user in multiple tabs must work
8. **Cursor rendering goes on Canvas overlay** — separate layer from cells
