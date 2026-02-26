import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

/** Color palette for collaborator cursors — deterministic by userId */
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

export function assignColor(userId: string): string {
  const hash = userId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
}

export type ConnectionStatus = "connected" | "connecting" | "disconnected";

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

export interface CursorPosition {
  userId: string;
  sheetId: string;
  cell: string;
  range: string | null;
  color: string;
  name: string;
  tabId: string;
}

export interface TypingIndicator {
  userId: string;
  sheetId: string;
  cell: string;
}

interface RealtimeState {
  connectionStatus: ConnectionStatus;
  connectedUsers: PresenceUser[];
  activeCursors: CursorPosition[];
  lockedCells: Record<string, string>; // "sheetId:cell" → userId
  typingCells: TypingIndicator[];
  currentSpreadsheetId: string | null;
  tabId: string;
}

interface RealtimeActions {
  setConnectionStatus: (status: ConnectionStatus) => void;
  setPresenceList: (users: PresenceUser[]) => void;
  addUser: (user: PresenceUser) => void;
  removeUser: (userId: string, tabId: string) => void;
  updateCursor: (cursor: CursorPosition) => void;
  removeCursor: (userId: string, tabId: string) => void;
  lockCell: (key: string, userId: string) => void;
  unlockCell: (key: string) => void;
  setLockedCells: (cells: Record<string, string>) => void;
  addTyping: (indicator: TypingIndicator) => void;
  removeTyping: (userId: string, cell: string) => void;
  setCurrentSpreadsheet: (id: string | null) => void;
  updateUserSheet: (userId: string, sheetId: string) => void;
  reset: () => void;
}

type RealtimeStore = RealtimeState & RealtimeActions;

function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useRealtimeStore = create<RealtimeStore>()(
  immer((set) => ({
    connectionStatus: "disconnected",
    connectedUsers: [],
    activeCursors: [],
    lockedCells: {},
    typingCells: [],
    currentSpreadsheetId: null,
    tabId: generateTabId(),

    setConnectionStatus: (status: ConnectionStatus) => {
      set((state) => {
        state.connectionStatus = status;
      });
    },

    setPresenceList: (users: PresenceUser[]) => {
      set((state) => {
        state.connectedUsers = users;
      });
    },

    addUser: (user: PresenceUser) => {
      set((state) => {
        // Avoid duplicates by userId+tabId
        const idx = state.connectedUsers.findIndex(
          (u) => u.userId === user.userId && u.tabId === user.tabId,
        );
        if (idx >= 0) {
          state.connectedUsers[idx] = user;
        } else {
          state.connectedUsers.push(user);
        }
      });
    },

    removeUser: (userId: string, tabId: string) => {
      set((state) => {
        state.connectedUsers = state.connectedUsers.filter(
          (u) => !(u.userId === userId && u.tabId === tabId),
        );
        state.activeCursors = state.activeCursors.filter(
          (c) => !(c.userId === userId && c.tabId === tabId),
        );
      });
    },

    updateCursor: (cursor: CursorPosition) => {
      set((state) => {
        const idx = state.activeCursors.findIndex(
          (c) => c.userId === cursor.userId && c.tabId === cursor.tabId,
        );
        if (idx >= 0) {
          state.activeCursors[idx] = cursor;
        } else {
          state.activeCursors.push(cursor);
        }
      });
    },

    removeCursor: (userId: string, tabId: string) => {
      set((state) => {
        state.activeCursors = state.activeCursors.filter(
          (c) => !(c.userId === userId && c.tabId === tabId),
        );
      });
    },

    lockCell: (key: string, userId: string) => {
      set((state) => {
        state.lockedCells[key] = userId;
      });
    },

    unlockCell: (key: string) => {
      set((state) => {
        delete state.lockedCells[key];
      });
    },

    setLockedCells: (cells: Record<string, string>) => {
      set((state) => {
        state.lockedCells = cells;
      });
    },

    addTyping: (indicator: TypingIndicator) => {
      set((state) => {
        const exists = state.typingCells.some(
          (t) => t.userId === indicator.userId && t.cell === indicator.cell,
        );
        if (!exists) {
          state.typingCells.push(indicator);
        }
      });
    },

    removeTyping: (userId: string, cell: string) => {
      set((state) => {
        state.typingCells = state.typingCells.filter(
          (t) => !(t.userId === userId && t.cell === cell),
        );
      });
    },

    setCurrentSpreadsheet: (id: string | null) => {
      set((state) => {
        state.currentSpreadsheetId = id;
      });
    },

    updateUserSheet: (userId: string, sheetId: string) => {
      set((state) => {
        for (const user of state.connectedUsers) {
          if (user.userId === userId) {
            user.activeSheet = sheetId;
          }
        }
      });
    },

    reset: () => {
      set((state) => {
        state.connectionStatus = "disconnected";
        state.connectedUsers = [];
        state.activeCursors = [];
        state.lockedCells = {};
        state.typingCells = [];
        state.currentSpreadsheetId = null;
      });
    },
  })),
);
