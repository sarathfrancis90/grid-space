/**
 * S16-022/023/024: Zustand store for offline state management.
 * Tracks online/offline status, pending edit count, and sync state.
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  enqueueEdit,
  getAllEdits,
  clearAllEdits,
  getEditCount,
} from "../utils/offlineQueue";
import type { OfflineEdit } from "../utils/offlineQueue";

export type SyncStatus = "idle" | "syncing" | "error";

interface OfflineState {
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  pendingEditsCount: number;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
}

interface OfflineActions {
  setOnline: (online: boolean) => void;
  setServiceWorkerReady: (ready: boolean) => void;
  setPendingEditsCount: (count: number) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (at: string | null) => void;
  addOfflineEdit: (
    edit: Omit<OfflineEdit, "id" | "timestamp">,
  ) => Promise<void>;
  syncEdits: (sender: (edit: OfflineEdit) => Promise<void>) => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

type OfflineStore = OfflineState & OfflineActions;

export const useOfflineStore = create<OfflineStore>()(
  immer((set, get) => ({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isServiceWorkerReady: false,
    pendingEditsCount: 0,
    syncStatus: "idle" as SyncStatus,
    lastSyncedAt: null,

    setOnline: (online: boolean) => {
      set((state) => {
        state.isOnline = online;
      });
    },

    setServiceWorkerReady: (ready: boolean) => {
      set((state) => {
        state.isServiceWorkerReady = ready;
      });
    },

    setPendingEditsCount: (count: number) => {
      set((state) => {
        state.pendingEditsCount = count;
      });
    },

    setSyncStatus: (status: SyncStatus) => {
      set((state) => {
        state.syncStatus = status;
      });
    },

    setLastSyncedAt: (at: string | null) => {
      set((state) => {
        state.lastSyncedAt = at;
      });
    },

    addOfflineEdit: async (edit) => {
      await enqueueEdit(edit);
      const count = await getEditCount();
      set((state) => {
        state.pendingEditsCount = count;
      });
    },

    syncEdits: async (sender) => {
      const current = get();
      if (!current.isOnline || current.syncStatus === "syncing") return;

      set((state) => {
        state.syncStatus = "syncing";
      });

      try {
        const edits = await getAllEdits();
        for (const edit of edits) {
          await sender(edit);
        }
        await clearAllEdits();
        set((state) => {
          state.pendingEditsCount = 0;
          state.syncStatus = "idle";
          state.lastSyncedAt = new Date().toISOString();
        });
      } catch {
        set((state) => {
          state.syncStatus = "error";
        });
      }
    },

    refreshPendingCount: async () => {
      try {
        const count = await getEditCount();
        set((state) => {
          state.pendingEditsCount = count;
        });
      } catch {
        // IndexedDB not available, keep count at 0
      }
    },
  })),
);
