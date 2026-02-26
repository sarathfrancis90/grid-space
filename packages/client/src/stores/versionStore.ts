import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { api } from "../services/api";

interface VersionUser {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface VersionSummary {
  id: string;
  name: string | null;
  createdAt: string;
  createdBy: VersionUser;
  hasChangeset: boolean;
}

interface VersionGroup {
  period: string;
  versions: VersionSummary[];
}

interface VersionDetail {
  id: string;
  name: string | null;
  snapshot: VersionSnapshot;
  changeset: unknown;
  createdAt: string;
  createdBy: VersionUser;
}

interface VersionSheetSnapshot {
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

interface VersionSnapshot {
  title?: string;
  sheets: VersionSheetSnapshot[];
}

export interface VersionDiffChange {
  cellKey: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface VersionDiff {
  sheetId: string;
  sheetName: string;
  changes: VersionDiffChange[];
}

interface PaginatedVersionsResponse {
  data: VersionSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface VersionState {
  isOpen: boolean;
  versions: VersionSummary[];
  groupedVersions: VersionGroup[];
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  selectedVersionId: string | null;
  previewVersion: VersionDetail | null;
  isPreviewLoading: boolean;
  diffs: VersionDiff[];
  isDiffLoading: boolean;
  isRestoring: boolean;
  useGrouped: boolean;
}

interface VersionActions {
  open: (spreadsheetId: string) => void;
  close: () => void;
  fetchVersions: (spreadsheetId: string, page?: number) => Promise<void>;
  fetchGroupedVersions: (spreadsheetId: string) => Promise<void>;
  selectVersion: (spreadsheetId: string, versionId: string) => Promise<void>;
  clearPreview: () => void;
  restoreVersion: (spreadsheetId: string, versionId: string) => Promise<void>;
  nameVersion: (
    spreadsheetId: string,
    versionId: string,
    name: string,
  ) => Promise<void>;
  fetchDiff: (
    spreadsheetId: string,
    versionId: string,
    compareToId?: string,
  ) => Promise<void>;
  copyAsSpreadsheet: (
    spreadsheetId: string,
    versionId: string,
  ) => Promise<{ id: string; title: string }>;
  setUseGrouped: (grouped: boolean) => void;
}

type VersionStore = VersionState & VersionActions;

export const useVersionStore = create<VersionStore>()(
  immer((set, get) => ({
    isOpen: false,
    versions: [],
    groupedVersions: [],
    isLoading: false,
    error: null,
    page: 1,
    totalPages: 1,
    total: 0,
    selectedVersionId: null,
    previewVersion: null,
    isPreviewLoading: false,
    diffs: [],
    isDiffLoading: false,
    isRestoring: false,
    useGrouped: true,

    open: (spreadsheetId: string) => {
      set((state) => {
        state.isOpen = true;
        state.selectedVersionId = null;
        state.previewVersion = null;
        state.diffs = [];
        state.error = null;
      });
      const { useGrouped } = get();
      if (useGrouped) {
        get().fetchGroupedVersions(spreadsheetId);
      } else {
        get().fetchVersions(spreadsheetId);
      }
    },

    close: () => {
      set((state) => {
        state.isOpen = false;
        state.selectedVersionId = null;
        state.previewVersion = null;
        state.diffs = [];
        state.error = null;
      });
    },

    fetchVersions: async (spreadsheetId: string, page?: number) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const p = page ?? get().page;
        const result = await api.getAll<PaginatedVersionsResponse>(
          `/spreadsheets/${spreadsheetId}/versions?page=${p}&limit=50`,
        );

        set((state) => {
          state.versions = result.data;
          state.page = result.pagination.page;
          state.totalPages = result.pagination.totalPages;
          state.total = result.pagination.total;
          state.isLoading = false;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load versions";
        set((state) => {
          state.isLoading = false;
          state.error = message;
        });
      }
    },

    fetchGroupedVersions: async (spreadsheetId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const groups = await api.get<VersionGroup[]>(
          `/spreadsheets/${spreadsheetId}/versions/grouped`,
        );

        set((state) => {
          state.groupedVersions = groups;
          state.isLoading = false;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load versions";
        set((state) => {
          state.isLoading = false;
          state.error = message;
        });
      }
    },

    selectVersion: async (spreadsheetId: string, versionId: string) => {
      set((state) => {
        state.selectedVersionId = versionId;
        state.isPreviewLoading = true;
        state.diffs = [];
      });

      try {
        const [version, diffs] = await Promise.all([
          api.get<VersionDetail>(
            `/spreadsheets/${spreadsheetId}/versions/${versionId}`,
          ),
          api.get<VersionDiff[]>(
            `/spreadsheets/${spreadsheetId}/versions/${versionId}/diff`,
          ),
        ]);

        set((state) => {
          state.previewVersion = version;
          state.diffs = diffs;
          state.isPreviewLoading = false;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load version";
        set((state) => {
          state.isPreviewLoading = false;
          state.error = message;
        });
      }
    },

    clearPreview: () => {
      set((state) => {
        state.selectedVersionId = null;
        state.previewVersion = null;
        state.diffs = [];
      });
    },

    restoreVersion: async (spreadsheetId: string, versionId: string) => {
      set((state) => {
        state.isRestoring = true;
        state.error = null;
      });

      try {
        await api.post(
          `/spreadsheets/${spreadsheetId}/versions/${versionId}/restore`,
        );

        set((state) => {
          state.isRestoring = false;
          state.selectedVersionId = null;
          state.previewVersion = null;
          state.diffs = [];
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to restore version";
        set((state) => {
          state.isRestoring = false;
          state.error = message;
        });
      }
    },

    nameVersion: async (
      spreadsheetId: string,
      versionId: string,
      name: string,
    ) => {
      try {
        const updated = await api.put<VersionSummary>(
          `/spreadsheets/${spreadsheetId}/versions/${versionId}/name`,
          { name },
        );

        set((state) => {
          const idx = state.versions.findIndex((v) => v.id === versionId);
          if (idx !== -1) {
            state.versions[idx].name = updated.name;
          }
          for (const group of state.groupedVersions) {
            const gIdx = group.versions.findIndex((v) => v.id === versionId);
            if (gIdx !== -1) {
              group.versions[gIdx].name = updated.name;
            }
          }
          if (state.previewVersion?.id === versionId) {
            state.previewVersion.name = updated.name;
          }
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to name version";
        set((state) => {
          state.error = message;
        });
      }
    },

    fetchDiff: async (
      spreadsheetId: string,
      versionId: string,
      compareToId?: string,
    ) => {
      set((state) => {
        state.isDiffLoading = true;
      });

      try {
        const qs = compareToId ? `?compareToId=${compareToId}` : "";
        const diffs = await api.get<VersionDiff[]>(
          `/spreadsheets/${spreadsheetId}/versions/${versionId}/diff${qs}`,
        );

        set((state) => {
          state.diffs = diffs;
          state.isDiffLoading = false;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load diff";
        set((state) => {
          state.isDiffLoading = false;
          state.error = message;
        });
      }
    },

    copyAsSpreadsheet: async (spreadsheetId: string, versionId: string) => {
      const result = await api.post<{ id: string; title: string }>(
        `/spreadsheets/${spreadsheetId}/versions/${versionId}/copy`,
      );
      return result;
    },

    setUseGrouped: (grouped: boolean) => {
      set((state) => {
        state.useGrouped = grouped;
      });
    },
  })),
);
