/** WebSocket event types and payload interfaces for real-time collaboration */

export const WS_EVENTS = {
  // Connection
  JOIN_SPREADSHEET: "join-spreadsheet",
  LEAVE_SPREADSHEET: "leave-spreadsheet",

  // Presence
  USER_JOINED: "user-joined",
  USER_LEFT: "user-left",
  PRESENCE_LIST: "presence-list",

  // Cursors
  CURSOR_MOVE: "cursor-move",
  CURSOR_UPDATE: "cursor-update",

  // Cell editing
  CELL_EDIT_START: "cell-edit-start",
  CELL_EDIT_END: "cell-edit-end",
  CELL_LOCKED: "cell-locked",
  CELL_UNLOCKED: "cell-unlocked",
  CELL_UPDATE: "cell-update",
  CELL_REMOTE_UPDATE: "cell-remote-update",

  // Sheet sync
  SHEET_SWITCH: "sheet-switch",
  SHEET_SWITCH_BROADCAST: "sheet-switch-broadcast",
  SHEET_ADD: "sheet-add",
  SHEET_DELETE: "sheet-delete",
  SHEET_RENAME: "sheet-rename",
  SHEET_SYNC: "sheet-sync",

  // Structural changes
  ROW_INSERT: "row-insert",
  ROW_DELETE: "row-delete",
  COL_INSERT: "col-insert",
  COL_DELETE: "col-delete",
  STRUCTURE_SYNC: "structure-sync",

  // Format & chart sync
  FORMAT_UPDATE: "format-update",
  FORMAT_SYNC: "format-sync",
  CHART_UPDATE: "chart-update",
  CHART_SYNC: "chart-sync",

  // Yjs sync
  YJS_SYNC: "yjs-sync",
  YJS_UPDATE: "yjs-update",

  // Connection status
  CONNECTION_ERROR: "connection-error",

  // Typing indicator
  TYPING_START: "typing-start",
  TYPING_END: "typing-end",
  TYPING_INDICATOR: "typing-indicator",
} as const;

export interface PresenceUser {
  userId: string;
  name: string;
  avatarUrl: string | null;
  color: string;
  activeSheet: string;
  cursorCell: string | null;
  selectionRange: string | null;
  tabId: string;
}

export interface CursorMovePayload {
  spreadsheetId: string;
  sheetId: string;
  cell: string;
  range: string | null;
}

export interface CellEditStartPayload {
  spreadsheetId: string;
  sheetId: string;
  cell: string;
}

export interface CellEditEndPayload {
  spreadsheetId: string;
  sheetId: string;
  cell: string;
}

export interface CellUpdatePayload {
  spreadsheetId: string;
  sheetId: string;
  cell: string;
  value: string | number | boolean | null;
  formula?: string;
}

export interface SheetSwitchPayload {
  spreadsheetId: string;
  sheetId: string;
}

export interface SheetAddPayload {
  spreadsheetId: string;
  sheetId: string;
  name: string;
}

export interface SheetDeletePayload {
  spreadsheetId: string;
  sheetId: string;
}

export interface SheetRenamePayload {
  spreadsheetId: string;
  sheetId: string;
  name: string;
}

export interface StructureChangePayload {
  spreadsheetId: string;
  sheetId: string;
  type: "row-insert" | "row-delete" | "col-insert" | "col-delete";
  index: number;
  count: number;
}

export interface FormatUpdatePayload {
  spreadsheetId: string;
  sheetId: string;
  cells: Record<string, Record<string, unknown>>;
}

export interface ChartUpdatePayload {
  spreadsheetId: string;
  sheetId: string;
  chartId: string;
  action: "add" | "update" | "delete";
  data?: Record<string, unknown>;
}

export interface TypingPayload {
  spreadsheetId: string;
  sheetId: string;
  cell: string;
}

export interface JoinPayload {
  spreadsheetId: string;
  sheetId: string;
  tabId: string;
}

/** Socket data augmented by auth middleware */
export interface SocketData {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
  tabId: string;
  spreadsheetId: string | null;
}
