import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  SortCriterion,
  ColumnFilter,
  FilterCondition,
  CellData,
} from "../types/grid";
import { getCellKey } from "../utils/coordinates";
import { api } from "../services/api";

/** Serializable filter criterion for saved filter views */
export interface FilterViewCriterion {
  col: number;
  allowedValues?: string[];
  condition?: { op: string; value: string };
}

/** A saved filter view (per-user, per-sheet) */
export interface FilterView {
  id: string;
  spreadsheetId: string;
  sheetId: string;
  userId: string;
  name: string;
  criteria: FilterViewCriterion[];
  createdAt: string;
  updatedAt: string;
}

interface FilterState {
  filtersEnabled: Map<string, boolean>;
  columnFilters: Map<string, ColumnFilter[]>;
  sortCriteria: Map<string, SortCriterion[]>;
  filteredRows: Map<string, Set<number>>;

  // Filter views
  filterViews: FilterView[];
  activeFilterViewId: string | null;
  filterViewsLoading: boolean;

  toggleFilters: (sheetId: string) => void;
  isFilterEnabled: (sheetId: string) => boolean;

  setColumnFilter: (sheetId: string, filter: ColumnFilter) => void;
  removeColumnFilter: (sheetId: string, col: number) => void;
  clearFilters: (sheetId: string) => void;

  setSortCriteria: (sheetId: string, criteria: SortCriterion[]) => void;
  clearSort: (sheetId: string) => void;

  computeFilteredRows: (
    sheetId: string,
    cells: Map<string, CellData>,
    totalRows: number,
  ) => void;
  isRowVisible: (sheetId: string, row: number) => boolean;

  sortRows: (
    sheetId: string,
    cells: Map<string, CellData>,
    totalRows: number,
    totalCols: number,
  ) => Map<string, CellData>;

  // Filter view actions
  loadFilterViews: (spreadsheetId: string, sheetId: string) => Promise<void>;
  createFilterView: (
    spreadsheetId: string,
    sheetId: string,
    name: string,
  ) => Promise<void>;
  applyFilterView: (filterView: FilterView, sheetId: string) => void;
  deactivateFilterView: (sheetId: string) => void;
  updateFilterView: (
    spreadsheetId: string,
    sheetId: string,
    filterViewId: string,
    data: { name?: string; criteria?: FilterViewCriterion[] },
  ) => Promise<void>;
  deleteFilterView: (
    spreadsheetId: string,
    sheetId: string,
    filterViewId: string,
  ) => Promise<void>;
  saveCurrentAsFilterView: (
    spreadsheetId: string,
    sheetId: string,
    name: string,
  ) => Promise<void>;
}

function matchesCondition(
  cellValue: string | number | boolean | null,
  condition: FilterCondition,
): boolean {
  const strVal = cellValue != null ? String(cellValue) : "";
  const numVal = cellValue != null ? Number(cellValue) : NaN;
  const condNum = Number(condition.value);

  switch (condition.op) {
    case "equals":
      return strVal === condition.value;
    case "not-equals":
      return strVal !== condition.value;
    case "greater-than":
      return !isNaN(numVal) && !isNaN(condNum) && numVal > condNum;
    case "less-than":
      return !isNaN(numVal) && !isNaN(condNum) && numVal < condNum;
    case "greater-equal":
      return !isNaN(numVal) && !isNaN(condNum) && numVal >= condNum;
    case "less-equal":
      return !isNaN(numVal) && !isNaN(condNum) && numVal <= condNum;
    case "contains":
      return strVal.toLowerCase().includes(condition.value.toLowerCase());
    case "not-contains":
      return !strVal.toLowerCase().includes(condition.value.toLowerCase());
    case "starts-with":
      return strVal.toLowerCase().startsWith(condition.value.toLowerCase());
    case "ends-with":
      return strVal.toLowerCase().endsWith(condition.value.toLowerCase());
    case "is-empty":
      return cellValue == null || strVal === "";
    case "not-empty":
      return cellValue != null && strVal !== "";
    default:
      return true;
  }
}

/** Convert current column filters to serializable criteria */
function columnFiltersToViewCriteria(
  filters: ColumnFilter[],
): FilterViewCriterion[] {
  return filters.map((f) => ({
    col: f.col,
    allowedValues: f.allowedValues ? Array.from(f.allowedValues) : undefined,
    condition: f.condition
      ? { op: f.condition.op, value: f.condition.value }
      : undefined,
  }));
}

/** Convert saved criteria back to ColumnFilter objects */
function viewCriteriaToColumnFilters(
  criteria: FilterViewCriterion[],
): ColumnFilter[] {
  return criteria.map((c) => ({
    col: c.col,
    allowedValues: c.allowedValues ? new Set(c.allowedValues) : undefined,
    condition: c.condition
      ? {
          op: c.condition.op as FilterCondition["op"],
          value: c.condition.value,
        }
      : undefined,
  }));
}

export const useFilterStore = create<FilterState>()(
  immer((set, get) => ({
    filtersEnabled: new Map<string, boolean>(),
    columnFilters: new Map<string, ColumnFilter[]>(),
    sortCriteria: new Map<string, SortCriterion[]>(),
    filteredRows: new Map<string, Set<number>>(),

    // Filter views
    filterViews: [],
    activeFilterViewId: null,
    filterViewsLoading: false,

    toggleFilters: (sheetId: string) => {
      set((state) => {
        const current = state.filtersEnabled.get(sheetId) ?? false;
        state.filtersEnabled.set(sheetId, !current);
        if (current) {
          state.columnFilters.delete(sheetId);
          state.filteredRows.delete(sheetId);
        }
      });
    },

    isFilterEnabled: (sheetId: string) => {
      return get().filtersEnabled.get(sheetId) ?? false;
    },

    setColumnFilter: (sheetId: string, filter: ColumnFilter) => {
      set((state) => {
        if (!state.columnFilters.has(sheetId)) {
          state.columnFilters.set(sheetId, []);
        }
        const filters = state.columnFilters.get(sheetId)!;
        const idx = filters.findIndex((f) => f.col === filter.col);
        if (idx >= 0) {
          filters[idx] = filter;
        } else {
          filters.push(filter);
        }
      });
    },

    removeColumnFilter: (sheetId: string, col: number) => {
      set((state) => {
        const filters = state.columnFilters.get(sheetId);
        if (!filters) return;
        const idx = filters.findIndex((f) => f.col === col);
        if (idx >= 0) {
          filters.splice(idx, 1);
        }
      });
    },

    clearFilters: (sheetId: string) => {
      set((state) => {
        state.columnFilters.delete(sheetId);
        state.filteredRows.delete(sheetId);
      });
    },

    setSortCriteria: (sheetId: string, criteria: SortCriterion[]) => {
      set((state) => {
        state.sortCriteria.set(sheetId, criteria);
      });
    },

    clearSort: (sheetId: string) => {
      set((state) => {
        state.sortCriteria.delete(sheetId);
      });
    },

    computeFilteredRows: (
      sheetId: string,
      cells: Map<string, CellData>,
      totalRows: number,
    ) => {
      const filters = get().columnFilters.get(sheetId);
      if (!filters || filters.length === 0) {
        set((state) => {
          state.filteredRows.delete(sheetId);
        });
        return;
      }

      const hiddenRows = new Set<number>();
      for (let r = 0; r < totalRows; r++) {
        let visible = true;
        for (const filter of filters) {
          const cellData = cells.get(getCellKey(r, filter.col));
          const cellValue = cellData?.value ?? null;
          const strVal = cellValue != null ? String(cellValue) : "";

          if (filter.allowedValues) {
            if (!filter.allowedValues.has(strVal)) {
              visible = false;
              break;
            }
          }

          if (filter.condition) {
            if (!matchesCondition(cellValue, filter.condition)) {
              visible = false;
              break;
            }
          }

          if (filter.filterByColor) {
            const bgColor = cellData?.format?.backgroundColor ?? "";
            if (bgColor !== filter.filterByColor) {
              visible = false;
              break;
            }
          }
        }
        if (!visible) {
          hiddenRows.add(r);
        }
      }

      set((state) => {
        state.filteredRows.set(sheetId, hiddenRows);
      });
    },

    isRowVisible: (sheetId: string, row: number) => {
      const hidden = get().filteredRows.get(sheetId);
      if (!hidden) return true;
      return !hidden.has(row);
    },

    sortRows: (
      sheetId: string,
      cells: Map<string, CellData>,
      totalRows: number,
      totalCols: number,
    ) => {
      const criteria = get().sortCriteria.get(sheetId);
      if (!criteria || criteria.length === 0) return cells;

      // Build row data
      const rows: { rowIdx: number; data: Map<number, CellData> }[] = [];
      for (let r = 0; r < totalRows; r++) {
        const rowData = new Map<number, CellData>();
        for (let c = 0; c < totalCols; c++) {
          const cell = cells.get(getCellKey(r, c));
          if (cell) {
            rowData.set(c, cell);
          }
        }
        rows.push({ rowIdx: r, data: rowData });
      }

      // Sort
      rows.sort((a, b) => {
        for (const crit of criteria) {
          const aCell = a.data.get(crit.col);
          const bCell = b.data.get(crit.col);
          const aVal = aCell?.value ?? null;
          const bVal = bCell?.value ?? null;

          let cmp = 0;
          if (aVal == null && bVal == null) cmp = 0;
          else if (aVal == null) cmp = -1;
          else if (bVal == null) cmp = 1;
          else if (typeof aVal === "number" && typeof bVal === "number") {
            cmp = aVal - bVal;
          } else {
            cmp = String(aVal).localeCompare(String(bVal));
          }

          if (crit.direction === "desc") cmp = -cmp;
          if (cmp !== 0) return cmp;
        }
        return 0;
      });

      // Rebuild cell map
      const newCells = new Map<string, CellData>();
      for (let r = 0; r < rows.length; r++) {
        for (const [c, data] of rows[r].data) {
          newCells.set(getCellKey(r, c), data);
        }
      }
      return newCells;
    },

    // ─── FILTER VIEW ACTIONS ──────────────────────────────

    loadFilterViews: async (spreadsheetId: string, sheetId: string) => {
      set((state) => {
        state.filterViewsLoading = true;
      });
      try {
        const views = await api.get<FilterView[]>(
          `/spreadsheets/${spreadsheetId}/sheets/${sheetId}/filter-views`,
        );
        set((state) => {
          state.filterViews = views;
          state.filterViewsLoading = false;
        });
      } catch {
        set((state) => {
          state.filterViewsLoading = false;
        });
      }
    },

    createFilterView: async (
      spreadsheetId: string,
      sheetId: string,
      name: string,
    ) => {
      const currentFilters = get().columnFilters.get(sheetId) ?? [];
      const criteria = columnFiltersToViewCriteria(currentFilters);

      const view = await api.post<FilterView>(
        `/spreadsheets/${spreadsheetId}/sheets/${sheetId}/filter-views`,
        { name, criteria },
      );
      set((state) => {
        state.filterViews.push(view);
        state.activeFilterViewId = view.id;
      });
    },

    applyFilterView: (filterView: FilterView, sheetId: string) => {
      const columnFilters = viewCriteriaToColumnFilters(filterView.criteria);
      set((state) => {
        state.activeFilterViewId = filterView.id;
        state.filtersEnabled.set(sheetId, true);
        state.columnFilters.set(sheetId, columnFilters);
      });
    },

    deactivateFilterView: (sheetId: string) => {
      set((state) => {
        state.activeFilterViewId = null;
        state.columnFilters.delete(sheetId);
        state.filteredRows.delete(sheetId);
        state.filtersEnabled.set(sheetId, false);
      });
    },

    updateFilterView: async (
      spreadsheetId: string,
      sheetId: string,
      filterViewId: string,
      data: { name?: string; criteria?: FilterViewCriterion[] },
    ) => {
      const updated = await api.put<FilterView>(
        `/spreadsheets/${spreadsheetId}/sheets/${sheetId}/filter-views/${filterViewId}`,
        data,
      );
      set((state) => {
        const idx = state.filterViews.findIndex((v) => v.id === filterViewId);
        if (idx >= 0) {
          state.filterViews[idx] = updated;
        }
      });
    },

    deleteFilterView: async (
      spreadsheetId: string,
      sheetId: string,
      filterViewId: string,
    ) => {
      await api.delete(
        `/spreadsheets/${spreadsheetId}/sheets/${sheetId}/filter-views/${filterViewId}`,
      );
      set((state) => {
        state.filterViews = state.filterViews.filter(
          (v) => v.id !== filterViewId,
        );
        if (state.activeFilterViewId === filterViewId) {
          state.activeFilterViewId = null;
        }
      });
    },

    saveCurrentAsFilterView: async (
      spreadsheetId: string,
      sheetId: string,
      name: string,
    ) => {
      const currentFilters = get().columnFilters.get(sheetId) ?? [];
      const criteria = columnFiltersToViewCriteria(currentFilters);

      const view = await api.post<FilterView>(
        `/spreadsheets/${spreadsheetId}/sheets/${sheetId}/filter-views`,
        { name, criteria },
      );
      set((state) => {
        state.filterViews.push(view);
        state.activeFilterViewId = view.id;
      });
    },
  })),
);
