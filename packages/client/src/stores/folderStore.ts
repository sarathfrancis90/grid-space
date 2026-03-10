import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { api } from "../services/api";

interface FolderSummary {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { children: number; spreadsheets: number };
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
  fetchBreadcrumbs: (folderId: string) => Promise<void>;
  navigateToFolder: (folderId: string | null) => void;
  createFolder: (name: string) => Promise<FolderSummary>;
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
        const resolvedParentId =
          parentId !== undefined ? parentId : get().currentFolderId;
        const params = new URLSearchParams();
        if (resolvedParentId) {
          params.set("parentId", resolvedParentId);
        }

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

    fetchBreadcrumbs: async (folderId: string) => {
      try {
        const breadcrumbs = await api.get<Breadcrumb[]>(
          `/folders/${folderId}/breadcrumbs`,
        );
        set((state) => {
          state.breadcrumbs = breadcrumbs;
        });
      } catch {
        // Non-critical — breadcrumbs are supplementary
        set((state) => {
          state.breadcrumbs = [];
        });
      }
    },

    navigateToFolder: (folderId: string | null) => {
      set((state) => {
        state.currentFolderId = folderId;
        if (!folderId) {
          state.breadcrumbs = [];
        }
      });

      const { fetchFolders, fetchBreadcrumbs } = get();
      fetchFolders(folderId);
      if (folderId) {
        fetchBreadcrumbs(folderId);
      }
    },

    createFolder: async (name: string) => {
      const { currentFolderId } = get();
      const folder = await api.post<FolderSummary>("/folders", {
        name,
        parentId: currentFolderId,
      });

      set((state) => {
        state.folders.push(folder);
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
      await api.post("/folders/move-spreadsheet", {
        spreadsheetId,
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
