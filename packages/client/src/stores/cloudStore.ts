import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { api } from "../services/api";

interface SpreadsheetSummary {
  id: string;
  title: string;
  isStarred: boolean;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string | null; avatarUrl: string | null };
  role: string;
}

interface SheetData {
  id: string;
  name: string;
  index: number;
  color: string | null;
  isHidden: boolean;
  cellData: Record<string, unknown>;
  columnMeta: Record<string, unknown>;
  rowMeta: Record<string, unknown>;
  frozenRows: number;
  frozenCols: number;
  filterState: unknown;
  sortState: unknown;
}

interface SpreadsheetDetail {
  id: string;
  title: string;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  sheets: SheetData[];
}

interface TrashItem {
  id: string;
  title: string;
  deletedAt: string;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string | null; avatarUrl: string | null };
}

interface PaginatedResponse {
  data: SpreadsheetSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TrashPaginatedResponse {
  data: TrashItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type FilterType = "all" | "owned" | "shared" | "starred";
type SortByType = "title" | "updatedAt" | "createdAt";
type ViewMode = "grid" | "list";

interface CloudState {
  spreadsheets: SpreadsheetSummary[];
  currentSpreadsheet: SpreadsheetDetail | null;
  isLoading: boolean;
  isListLoading: boolean;
  isSaving: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  error: string | null;
  filter: FilterType;
  search: string;
  sortBy: SortByType;
  sortDir: "asc" | "desc";
  viewMode: ViewMode;
  page: number;
  totalPages: number;
  total: number;
  trashItems: TrashItem[];
  isTrashLoading: boolean;
  trashPage: number;
  trashTotalPages: number;
  trashTotal: number;
}

interface CloudActions {
  fetchSpreadsheets: () => Promise<void>;
  fetchSpreadsheet: (id: string) => Promise<void>;
  createSpreadsheet: (title?: string) => Promise<SpreadsheetDetail>;
  updateSpreadsheet: (
    id: string,
    data: { title?: string; isStarred?: boolean },
  ) => Promise<void>;
  deleteSpreadsheet: (id: string) => Promise<void>;
  duplicateSpreadsheet: (id: string) => Promise<SpreadsheetDetail>;
  toggleStar: (id: string) => Promise<void>;
  saveSheetData: (
    spreadsheetId: string,
    sheetId: string,
    cellData: Record<string, unknown>,
    columnMeta?: Record<string, unknown>,
    rowMeta?: Record<string, unknown>,
  ) => Promise<void>;
  setFilter: (filter: FilterType) => void;
  setSearch: (search: string) => void;
  setSortBy: (sortBy: SortByType) => void;
  toggleSortDir: () => void;
  setViewMode: (mode: ViewMode) => void;
  setPage: (page: number) => void;
  fetchTrash: () => Promise<void>;
  restoreSpreadsheet: (id: string) => Promise<void>;
  permanentDeleteSpreadsheet: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  setTrashPage: (page: number) => void;
  clearError: () => void;
  clearCurrent: () => void;
}

type CloudStore = CloudState & CloudActions;

export const useCloudStore = create<CloudStore>()(
  immer((set, get) => ({
    spreadsheets: [],
    currentSpreadsheet: null,
    isLoading: false,
    isListLoading: false,
    isSaving: false,
    saveStatus: "idle",
    error: null,
    filter: "all",
    search: "",
    sortBy: "updatedAt",
    sortDir: "desc",
    viewMode: "grid",
    page: 1,
    totalPages: 1,
    total: 0,
    trashItems: [],
    isTrashLoading: false,
    trashPage: 1,
    trashTotalPages: 1,
    trashTotal: 0,

    fetchSpreadsheets: async () => {
      set((state) => {
        state.isListLoading = true;
        state.error = null;
      });

      try {
        const { filter, search, sortBy, sortDir, page } = get();
        const params = new URLSearchParams();
        params.set("filter", filter);
        params.set("sortBy", sortBy);
        params.set("sortDir", sortDir);
        params.set("page", String(page));
        params.set("limit", "20");
        if (search) params.set("search", search);

        const result = await api.getAll<PaginatedResponse>(
          `/spreadsheets?${params.toString()}`,
        );

        set((state) => {
          state.spreadsheets = result.data;
          state.totalPages = result.pagination.totalPages;
          state.total = result.pagination.total;
          state.isListLoading = false;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load spreadsheets";
        set((state) => {
          state.isListLoading = false;
          state.error = message;
        });
      }
    },

    fetchSpreadsheet: async (id: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const spreadsheet = await api.get<SpreadsheetDetail>(
          `/spreadsheets/${id}`,
        );

        set((state) => {
          state.currentSpreadsheet = spreadsheet;
          state.isLoading = false;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load spreadsheet";
        set((state) => {
          state.isLoading = false;
          state.error = message;
        });
        throw err;
      }
    },

    createSpreadsheet: async (title?: string) => {
      const spreadsheet = await api.post<SpreadsheetDetail>("/spreadsheets", {
        title,
      });

      set((state) => {
        state.spreadsheets.unshift({
          id: spreadsheet.id,
          title: spreadsheet.title,
          isStarred: spreadsheet.isStarred,
          isTemplate: false,
          createdAt: spreadsheet.createdAt,
          updatedAt: spreadsheet.updatedAt,
          owner: spreadsheet.owner,
          role: "owner",
        });
        state.total += 1;
      });

      return spreadsheet;
    },

    updateSpreadsheet: async (
      id: string,
      data: { title?: string; isStarred?: boolean },
    ) => {
      await api.put(`/spreadsheets/${id}`, data);

      set((state) => {
        const idx = state.spreadsheets.findIndex((s) => s.id === id);
        if (idx !== -1) {
          if (data.title !== undefined)
            state.spreadsheets[idx].title = data.title;
          if (data.isStarred !== undefined)
            state.spreadsheets[idx].isStarred = data.isStarred;
        }
        if (state.currentSpreadsheet?.id === id) {
          if (data.title !== undefined)
            state.currentSpreadsheet.title = data.title;
          if (data.isStarred !== undefined)
            state.currentSpreadsheet.isStarred = data.isStarred;
        }
      });
    },

    deleteSpreadsheet: async (id: string) => {
      await api.delete(`/spreadsheets/${id}`);

      set((state) => {
        state.spreadsheets = state.spreadsheets.filter((s) => s.id !== id);
        state.total = Math.max(0, state.total - 1);
        if (state.currentSpreadsheet?.id === id) {
          state.currentSpreadsheet = null;
        }
      });
    },

    duplicateSpreadsheet: async (id: string) => {
      const copy = await api.post<SpreadsheetDetail>(
        `/spreadsheets/${id}/duplicate`,
      );

      set((state) => {
        state.spreadsheets.unshift({
          id: copy.id,
          title: copy.title,
          isStarred: copy.isStarred,
          isTemplate: false,
          createdAt: copy.createdAt,
          updatedAt: copy.updatedAt,
          owner: copy.owner,
          role: "owner",
        });
        state.total += 1;
      });

      return copy;
    },

    toggleStar: async (id: string) => {
      const result = await api.post<{ isStarred: boolean }>(
        `/spreadsheets/${id}/star`,
      );

      set((state) => {
        const idx = state.spreadsheets.findIndex((s) => s.id === id);
        if (idx !== -1) {
          state.spreadsheets[idx].isStarred = result.isStarred;
        }
        if (state.currentSpreadsheet?.id === id) {
          state.currentSpreadsheet.isStarred = result.isStarred;
        }
      });
    },

    saveSheetData: async (
      spreadsheetId: string,
      sheetId: string,
      cellData: Record<string, unknown>,
      columnMeta?: Record<string, unknown>,
      rowMeta?: Record<string, unknown>,
    ) => {
      set((state) => {
        state.isSaving = true;
        state.saveStatus = "saving";
      });

      try {
        const result = await api.put<{ updatedAt: string }>(
          `/spreadsheets/${spreadsheetId}/sheets/${sheetId}/save`,
          {
            cellData,
            columnMeta,
            rowMeta,
          },
        );

        set((state) => {
          state.isSaving = false;
          state.saveStatus = "saved";
          if (
            state.currentSpreadsheet?.id === spreadsheetId &&
            result?.updatedAt
          ) {
            state.currentSpreadsheet.updatedAt = result.updatedAt;
          }
        });
      } catch {
        set((state) => {
          state.isSaving = false;
          state.saveStatus = "error";
        });
      }
    },

    setFilter: (filter: FilterType) => {
      set((state) => {
        state.filter = filter;
        state.page = 1;
      });
    },

    setSearch: (search: string) => {
      set((state) => {
        state.search = search;
        state.page = 1;
      });
    },

    setSortBy: (sortBy: SortByType) => {
      set((state) => {
        state.sortBy = sortBy;
        state.page = 1;
      });
    },

    toggleSortDir: () => {
      set((state) => {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      });
    },

    setViewMode: (mode: ViewMode) => {
      set((state) => {
        state.viewMode = mode;
      });
    },

    setPage: (page: number) => {
      set((state) => {
        state.page = page;
      });
    },

    fetchTrash: async () => {
      set((state) => {
        state.isTrashLoading = true;
        state.error = null;
      });

      try {
        const { trashPage } = get();
        const params = new URLSearchParams();
        params.set("page", String(trashPage));
        params.set("limit", "20");

        const result = await api.getAll<TrashPaginatedResponse>(
          `/spreadsheets/trash?${params.toString()}`,
        );

        set((state) => {
          state.trashItems = result.data;
          state.trashTotalPages = result.pagination.totalPages;
          state.trashTotal = result.pagination.total;
          state.isTrashLoading = false;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load trash";
        set((state) => {
          state.isTrashLoading = false;
          state.error = message;
        });
      }
    },

    restoreSpreadsheet: async (id: string) => {
      await api.post(`/spreadsheets/${id}/restore`);

      set((state) => {
        state.trashItems = state.trashItems.filter((s) => s.id !== id);
        state.trashTotal = Math.max(0, state.trashTotal - 1);
      });
    },

    permanentDeleteSpreadsheet: async (id: string) => {
      await api.delete(`/spreadsheets/${id}/permanent`);

      set((state) => {
        state.trashItems = state.trashItems.filter((s) => s.id !== id);
        state.trashTotal = Math.max(0, state.trashTotal - 1);
      });
    },

    emptyTrash: async () => {
      await api.delete(`/spreadsheets/trash`);

      set((state) => {
        state.trashItems = [];
        state.trashTotal = 0;
        state.trashTotalPages = 1;
        state.trashPage = 1;
      });
    },

    setTrashPage: (page: number) => {
      set((state) => {
        state.trashPage = page;
      });
    },

    clearError: () => {
      set((state) => {
        state.error = null;
      });
    },

    clearCurrent: () => {
      set((state) => {
        state.currentSpreadsheet = null;
      });
    },
  })),
);
