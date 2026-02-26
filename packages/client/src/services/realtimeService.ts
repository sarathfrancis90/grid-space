import { io, Socket } from "socket.io-client";
import { getAccessToken } from "./api";
import { useRealtimeStore, assignColor } from "../stores/realtimeStore";
import type { PresenceUser, CursorPosition } from "../stores/realtimeStore";

/** WebSocket event constants — must match server */
const WS_EVENTS = {
  JOIN_SPREADSHEET: "join-spreadsheet",
  LEAVE_SPREADSHEET: "leave-spreadsheet",
  USER_JOINED: "user-joined",
  USER_LEFT: "user-left",
  PRESENCE_LIST: "presence-list",
  CURSOR_MOVE: "cursor-move",
  CURSOR_UPDATE: "cursor-update",
  CELL_EDIT_START: "cell-edit-start",
  CELL_EDIT_END: "cell-edit-end",
  CELL_LOCKED: "cell-locked",
  CELL_UNLOCKED: "cell-unlocked",
  CELL_UPDATE: "cell-update",
  CELL_REMOTE_UPDATE: "cell-remote-update",
  SHEET_SWITCH: "sheet-switch",
  SHEET_SWITCH_BROADCAST: "sheet-switch-broadcast",
  SHEET_ADD: "sheet-add",
  SHEET_DELETE: "sheet-delete",
  SHEET_RENAME: "sheet-rename",
  SHEET_SYNC: "sheet-sync",
  ROW_INSERT: "row-insert",
  ROW_DELETE: "row-delete",
  COL_INSERT: "col-insert",
  COL_DELETE: "col-delete",
  STRUCTURE_SYNC: "structure-sync",
  FORMAT_UPDATE: "format-update",
  FORMAT_SYNC: "format-sync",
  CHART_UPDATE: "chart-update",
  CHART_SYNC: "chart-sync",
  YJS_SYNC: "yjs-sync",
  YJS_UPDATE: "yjs-update",
  CONNECTION_ERROR: "connection-error",
  TYPING_START: "typing-start",
  TYPING_END: "typing-end",
  TYPING_INDICATOR: "typing-indicator",
} as const;

const WS_URL = import.meta.env.VITE_WS_URL || "";

let socket: Socket | null = null;
let currentSpreadsheetId: string | null = null;

/** Debounce helper for batching rapid edits */
const pendingUpdates = new Map<string, ReturnType<typeof setTimeout>>();
const BATCH_DELAY_MS = 50;

function getStore() {
  return useRealtimeStore.getState();
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  const token = getAccessToken();
  const tabId = getStore().tabId;

  socket = io(WS_URL, {
    auth: { token, tabId },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: Infinity,
    transports: ["websocket", "polling"],
  });

  getStore().setConnectionStatus("connecting");

  socket.on("connect", () => {
    getStore().setConnectionStatus("connected");

    // Rejoin room on reconnect
    if (currentSpreadsheetId) {
      joinSpreadsheet(
        currentSpreadsheetId,
        getStore().connectedUsers[0]?.activeSheet || "",
      );
    }
  });

  socket.on("disconnect", () => {
    getStore().setConnectionStatus("disconnected");
  });

  socket.on("reconnect_attempt", () => {
    getStore().setConnectionStatus("connecting");
  });

  // ─── PRESENCE ─────────────────────────────────────────
  socket.on(WS_EVENTS.PRESENCE_LIST, (users: PresenceUser[]) => {
    getStore().setPresenceList(users);
  });

  socket.on(WS_EVENTS.USER_JOINED, (user: PresenceUser) => {
    getStore().addUser(user);
  });

  socket.on(WS_EVENTS.USER_LEFT, (data: { userId: string; tabId: string }) => {
    getStore().removeUser(data.userId, data.tabId);
  });

  // ─── CURSORS ──────────────────────────────────────────
  socket.on(
    WS_EVENTS.CURSOR_UPDATE,
    (data: {
      userId: string;
      sheetId: string;
      cell: string;
      range: string | null;
      tabId: string;
    }) => {
      // Find user info for color/name
      const users = getStore().connectedUsers;
      const user = users.find(
        (u) => u.userId === data.userId && u.tabId === data.tabId,
      );
      const cursor: CursorPosition = {
        userId: data.userId,
        sheetId: data.sheetId,
        cell: data.cell,
        range: data.range,
        color: user?.color ?? assignColor(data.userId),
        name: user?.name ?? "Unknown",
        tabId: data.tabId,
      };
      getStore().updateCursor(cursor);
    },
  );

  // ─── CELL LOCKS ───────────────────────────────────────
  socket.on(
    WS_EVENTS.CELL_LOCKED,
    (data: { sheetId: string; cell: string; userId: string }) => {
      getStore().lockCell(`${data.sheetId}:${data.cell}`, data.userId);
    },
  );

  socket.on(
    WS_EVENTS.CELL_UNLOCKED,
    (data: { sheetId: string; cell: string }) => {
      getStore().unlockCell(`${data.sheetId}:${data.cell}`);
    },
  );

  socket.on("locked-cells", (cells: Record<string, string>) => {
    getStore().setLockedCells(cells);
  });

  // ─── CELL REMOTE UPDATES ─────────────────────────────
  socket.on(
    WS_EVENTS.CELL_REMOTE_UPDATE,
    (data: {
      userId: string;
      sheetId: string;
      cell: string;
      value: string | number | boolean | null;
      formula?: string;
    }) => {
      // Dispatch to listeners
      remoteCellUpdateListeners.forEach((cb) => cb(data));
    },
  );

  // ─── TYPING INDICATORS ───────────────────────────────
  socket.on(
    WS_EVENTS.TYPING_INDICATOR,
    (data: {
      userId: string;
      sheetId: string;
      cell: string;
      typing: boolean;
    }) => {
      if (data.typing) {
        getStore().addTyping({
          userId: data.userId,
          sheetId: data.sheetId,
          cell: data.cell,
        });
      } else {
        getStore().removeTyping(data.userId, data.cell);
      }
    },
  );

  // ─── SHEET SYNC ───────────────────────────────────────
  socket.on(
    WS_EVENTS.SHEET_SWITCH_BROADCAST,
    (data: { userId: string; sheetId: string }) => {
      getStore().updateUserSheet(data.userId, data.sheetId);
    },
  );

  socket.on(WS_EVENTS.SHEET_SYNC, (data: Record<string, unknown>) => {
    sheetSyncListeners.forEach((cb) => cb(data));
  });

  // ─── STRUCTURE SYNC ───────────────────────────────────
  socket.on(WS_EVENTS.STRUCTURE_SYNC, (data: Record<string, unknown>) => {
    structureSyncListeners.forEach((cb) => cb(data));
  });

  // ─── FORMAT SYNC ──────────────────────────────────────
  socket.on(WS_EVENTS.FORMAT_SYNC, (data: Record<string, unknown>) => {
    formatSyncListeners.forEach((cb) => cb(data));
  });

  // ─── CHART SYNC ───────────────────────────────────────
  socket.on(WS_EVENTS.CHART_SYNC, (data: Record<string, unknown>) => {
    chartSyncListeners.forEach((cb) => cb(data));
  });

  // ─── CONNECTION ERRORS ────────────────────────────────
  socket.on(WS_EVENTS.CONNECTION_ERROR, (message: string) => {
    errorListeners.forEach((cb) => cb(message));
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  currentSpreadsheetId = null;
  getStore().reset();
}

export function getSocket(): Socket | null {
  return socket;
}

// ─── EMIT HELPERS ───────────────────────────────────────

export function joinSpreadsheet(spreadsheetId: string, sheetId: string): void {
  if (!socket) return;
  currentSpreadsheetId = spreadsheetId;
  getStore().setCurrentSpreadsheet(spreadsheetId);
  socket.emit(WS_EVENTS.JOIN_SPREADSHEET, {
    spreadsheetId,
    sheetId,
    tabId: getStore().tabId,
  });
}

export function leaveSpreadsheet(): void {
  if (!socket) return;
  socket.emit(WS_EVENTS.LEAVE_SPREADSHEET);
  currentSpreadsheetId = null;
  getStore().reset();
}

export function emitCursorMove(
  spreadsheetId: string,
  sheetId: string,
  cell: string,
  range: string | null,
): void {
  socket?.emit(WS_EVENTS.CURSOR_MOVE, {
    spreadsheetId,
    sheetId,
    cell,
    range,
  });
}

export function emitCellEditStart(
  spreadsheetId: string,
  sheetId: string,
  cell: string,
): void {
  socket?.emit(WS_EVENTS.CELL_EDIT_START, { spreadsheetId, sheetId, cell });
}

export function emitCellEditEnd(
  spreadsheetId: string,
  sheetId: string,
  cell: string,
): void {
  socket?.emit(WS_EVENTS.CELL_EDIT_END, { spreadsheetId, sheetId, cell });
}

export function emitCellUpdate(
  spreadsheetId: string,
  sheetId: string,
  cell: string,
  value: string | number | boolean | null,
  formula?: string,
): void {
  // Debounce rapid updates for the same cell
  const key = `${sheetId}:${cell}`;
  const existing = pendingUpdates.get(key);
  if (existing) clearTimeout(existing);

  pendingUpdates.set(
    key,
    setTimeout(() => {
      socket?.emit(WS_EVENTS.CELL_UPDATE, {
        spreadsheetId,
        sheetId,
        cell,
        value,
        formula,
      });
      pendingUpdates.delete(key);
    }, BATCH_DELAY_MS),
  );
}

export function emitTypingStart(
  spreadsheetId: string,
  sheetId: string,
  cell: string,
): void {
  socket?.emit(WS_EVENTS.TYPING_START, { spreadsheetId, sheetId, cell });
}

export function emitTypingEnd(
  spreadsheetId: string,
  sheetId: string,
  cell: string,
): void {
  socket?.emit(WS_EVENTS.TYPING_END, { spreadsheetId, sheetId, cell });
}

export function emitSheetSwitch(spreadsheetId: string, sheetId: string): void {
  socket?.emit(WS_EVENTS.SHEET_SWITCH, { spreadsheetId, sheetId });
}

export function emitSheetAdd(
  spreadsheetId: string,
  sheetId: string,
  name: string,
): void {
  socket?.emit(WS_EVENTS.SHEET_ADD, { spreadsheetId, sheetId, name });
}

export function emitSheetDelete(spreadsheetId: string, sheetId: string): void {
  socket?.emit(WS_EVENTS.SHEET_DELETE, { spreadsheetId, sheetId });
}

export function emitSheetRename(
  spreadsheetId: string,
  sheetId: string,
  name: string,
): void {
  socket?.emit(WS_EVENTS.SHEET_RENAME, { spreadsheetId, sheetId, name });
}

export function emitRowInsert(
  spreadsheetId: string,
  sheetId: string,
  index: number,
  count: number,
): void {
  socket?.emit(WS_EVENTS.ROW_INSERT, {
    spreadsheetId,
    sheetId,
    type: "row-insert",
    index,
    count,
  });
}

export function emitRowDelete(
  spreadsheetId: string,
  sheetId: string,
  index: number,
  count: number,
): void {
  socket?.emit(WS_EVENTS.ROW_DELETE, {
    spreadsheetId,
    sheetId,
    type: "row-delete",
    index,
    count,
  });
}

export function emitColInsert(
  spreadsheetId: string,
  sheetId: string,
  index: number,
  count: number,
): void {
  socket?.emit(WS_EVENTS.COL_INSERT, {
    spreadsheetId,
    sheetId,
    type: "col-insert",
    index,
    count,
  });
}

export function emitColDelete(
  spreadsheetId: string,
  sheetId: string,
  index: number,
  count: number,
): void {
  socket?.emit(WS_EVENTS.COL_DELETE, {
    spreadsheetId,
    sheetId,
    type: "col-delete",
    index,
    count,
  });
}

export function emitFormatUpdate(
  spreadsheetId: string,
  sheetId: string,
  cells: Record<string, Record<string, unknown>>,
): void {
  socket?.emit(WS_EVENTS.FORMAT_UPDATE, { spreadsheetId, sheetId, cells });
}

export function emitChartUpdate(
  spreadsheetId: string,
  sheetId: string,
  chartId: string,
  action: "add" | "update" | "delete",
  data?: Record<string, unknown>,
): void {
  socket?.emit(WS_EVENTS.CHART_UPDATE, {
    spreadsheetId,
    sheetId,
    chartId,
    action,
    data,
  });
}

// ─── LISTENER REGISTRATIONS ────────────────────────────

type CellUpdateCallback = (data: {
  userId: string;
  sheetId: string;
  cell: string;
  value: string | number | boolean | null;
  formula?: string;
}) => void;

type SyncCallback = (data: Record<string, unknown>) => void;
type ErrorCallback = (message: string) => void;

const remoteCellUpdateListeners = new Set<CellUpdateCallback>();
const sheetSyncListeners = new Set<SyncCallback>();
const structureSyncListeners = new Set<SyncCallback>();
const formatSyncListeners = new Set<SyncCallback>();
const chartSyncListeners = new Set<SyncCallback>();
const errorListeners = new Set<ErrorCallback>();

export function onRemoteCellUpdate(cb: CellUpdateCallback): () => void {
  remoteCellUpdateListeners.add(cb);
  return () => remoteCellUpdateListeners.delete(cb);
}

export function onSheetSync(cb: SyncCallback): () => void {
  sheetSyncListeners.add(cb);
  return () => sheetSyncListeners.delete(cb);
}

export function onStructureSync(cb: SyncCallback): () => void {
  structureSyncListeners.add(cb);
  return () => structureSyncListeners.delete(cb);
}

export function onFormatSync(cb: SyncCallback): () => void {
  formatSyncListeners.add(cb);
  return () => formatSyncListeners.delete(cb);
}

export function onChartSync(cb: SyncCallback): () => void {
  chartSyncListeners.add(cb);
  return () => chartSyncListeners.delete(cb);
}

export function onConnectionError(cb: ErrorCallback): () => void {
  errorListeners.add(cb);
  return () => errorListeners.delete(cb);
}
