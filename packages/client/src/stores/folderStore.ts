import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { api } from "../services/api";

export interface FolderSummary {
  id: string;
  name: string;
  color: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Breadcrumb {
  id: string;
  name: string;
}

interface FolderState {
  folders: FolderSummary[];
  currentFolderId: string | null;
  breadcrumbs: Breadcrumb[];
  isLoading: boolean;
  error: string | null;
}

interface FolderActions {
  fetchFolders: (parentId?: string | null) => Promise<void>;
  navigateToFolder: (folderId: string | null) => Promise<void>;
  createFolder: (
    name: string,
    parentId?: string | null,
  ) => Promise<FolderSummary>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  moveSpreadsheetToFolder: (
    spreadsheetId: string,
    folderId: string | null,
  ) => Promise<void>;
  clearError: () => void;
}

type FolderStore = FolderState & FolderActions;

export const useFolderStore = create<FolderStore>()(
  immer((set, get) => ({
    folders: [],
    currentFolderId: null,
    breadcrumbs: [],
    isLoading: false,
    error: null,

    fetchFolders: async (parentId?: string | null) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const params = new URLSearchParams();
        if (parentId) params.set("parentId", parentId);

        const folders = await api.get<FolderSummary[]>(
          `/folders?${params.toString()}`,
        );

        set((state) => {
          state.folders = folders;
          state.isLoading = false;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load folders";
        set((state) => {
          state.isLoading = false;
          state.error = message;
        });
      }
    },

    navigateToFolder: async (folderId: string | null) => {
      set((state) => {
        state.currentFolderId = folderId;
      });

      if (folderId) {
        try {
          const breadcrumbs = await api.get<Breadcrumb[]>(
            `/folders/${folderId}/breadcrumbs`,
          );
          set((state) => {
            state.breadcrumbs = breadcrumbs;
          });
        } catch {
          set((state) => {
            state.breadcrumbs = [];
          });
        }
      } else {
        set((state) => {
          state.breadcrumbs = [];
        });
      }

      await get().fetchFolders(folderId);
    },

    createFolder: async (name: string, parentId?: string | null) => {
      const folder = await api.post<FolderSummary>("/folders", {
        name,
        parentId: parentId ?? undefined,
      });

      set((state) => {
        state.folders.push(folder);
        state.folders.sort((a, b) => a.name.localeCompare(b.name));
      });

      return folder;
    },

    renameFolder: async (id: string, name: string) => {
      await api.put(`/folders/${id}`, { name });

      set((state) => {
        const idx = state.folders.findIndex((f) => f.id === id);
        if (idx !== -1) {
          state.folders[idx].name = name;
        }
        const bcIdx = state.breadcrumbs.findIndex((b) => b.id === id);
        if (bcIdx !== -1) {
          state.breadcrumbs[bcIdx].name = name;
        }
      });
    },

    deleteFolder: async (id: string) => {
      await api.delete(`/folders/${id}`);

      set((state) => {
        state.folders = state.folders.filter((f) => f.id !== id);
      });
    },

    moveSpreadsheetToFolder: async (
      spreadsheetId: string,
      folderId: string | null,
    ) => {
      await api.post(`/folders/move-spreadsheet/${spreadsheetId}`, {
        folderId,
      });
    },

    clearError: () => {
      set((state) => {
        state.error = null;
      });
    },
  })),
);
