import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  SortCriterion,
  ColumnFilter,
  FilterCondition,
  CellData,
  FilterView,
  SerializedColumnFilter,
} from "../types/grid";
import { getCellKey } from "../utils/coordinates";

function serializeFilters(filters: ColumnFilter[]): SerializedColumnFilter[] {
  return filters.map((f) => ({
    col: f.col,
    allowedValues: f.allowedValues ? [...f.allowedValues] : undefined,
    condition: f.condition,
    filterByColor: f.filterByColor,
  }));
}

function deserializeFilters(filters: SerializedColumnFilter[]): ColumnFilter[] {
  return filters.map((f) => ({
    col: f.col,
    allowedValues: f.allowedValues ? new Set(f.allowedValues) : undefined,
    condition: f.condition,
    filterByColor: f.filterByColor,
  }));
}

interface FilterState {
  filtersEnabled: Map<string, boolean>;
  columnFilters: Map<string, ColumnFilter[]>;
  sortCriteria: Map<string, SortCriterion[]>;
  filteredRows: Map<string, Set<number>>;

  // Filter Views
  filterViews: Map<string, FilterView[]>;
  activeFilterViewId: Map<string, string | null>;

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

  // Filter View actions
  setFilterViews: (sheetId: string, views: FilterView[]) => void;
  createFilterView: (sheetId: string, name: string) => FilterView;
  updateFilterView: (sheetId: string, viewId: string, name: string) => void;
  deleteFilterView: (sheetId: string, viewId: string) => void;
  activateFilterView: (sheetId: string, viewId: string) => void;
  deactivateFilterView: (sheetId: string) => void;
  saveActiveFilterView: (sheetId: string) => void;
  getActiveFilterView: (sheetId: string) => FilterView | null;
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

export const useFilterStore = create<FilterState>()(
  immer((set, get) => ({
    filtersEnabled: new Map<string, boolean>(),
    columnFilters: new Map<string, ColumnFilter[]>(),
    sortCriteria: new Map<string, SortCriterion[]>(),
    filteredRows: new Map<string, Set<number>>(),
    filterViews: new Map<string, FilterView[]>(),
    activeFilterViewId: new Map<string, string | null>(),

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

    // Filter View actions
    setFilterViews: (sheetId: string, views: FilterView[]) => {
      set((state) => {
        state.filterViews.set(sheetId, views);
      });
    },

    createFilterView: (sheetId: string, name: string) => {
      const currentFilters = get().columnFilters.get(sheetId) ?? [];
      const newView: FilterView = {
        id: `fv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        name,
        sheetId,
        filters: serializeFilters(currentFilters),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((state) => {
        const views = state.filterViews.get(sheetId) ?? [];
        views.push(newView);
        state.filterViews.set(sheetId, views);
        state.activeFilterViewId.set(sheetId, newView.id);
        // Enable filters when creating a view
        state.filtersEnabled.set(sheetId, true);
      });
      return newView;
    },

    updateFilterView: (sheetId: string, viewId: string, name: string) => {
      set((state) => {
        const views = state.filterViews.get(sheetId);
        if (!views) return;
        const view = views.find((v) => v.id === viewId);
        if (view) {
          view.name = name;
          view.updatedAt = new Date().toISOString();
        }
      });
    },

    deleteFilterView: (sheetId: string, viewId: string) => {
      set((state) => {
        const views = state.filterViews.get(sheetId);
        if (!views) return;
        const idx = views.findIndex((v) => v.id === viewId);
        if (idx >= 0) {
          views.splice(idx, 1);
        }
        if (state.activeFilterViewId.get(sheetId) === viewId) {
          state.activeFilterViewId.set(sheetId, null);
          state.columnFilters.delete(sheetId);
          state.filteredRows.delete(sheetId);
        }
      });
    },

    activateFilterView: (sheetId: string, viewId: string) => {
      const views = get().filterViews.get(sheetId);
      const view = views?.find((v) => v.id === viewId);
      if (!view) return;

      set((state) => {
        state.activeFilterViewId.set(sheetId, viewId);
        state.filtersEnabled.set(sheetId, true);
        state.columnFilters.set(sheetId, deserializeFilters(view.filters));
      });
    },

    deactivateFilterView: (sheetId: string) => {
      set((state) => {
        state.activeFilterViewId.set(sheetId, null);
        state.columnFilters.delete(sheetId);
        state.filteredRows.delete(sheetId);
      });
    },

    saveActiveFilterView: (sheetId: string) => {
      const activeId = get().activeFilterViewId.get(sheetId);
      if (!activeId) return;
      const currentFilters = get().columnFilters.get(sheetId) ?? [];

      set((state) => {
        const views = state.filterViews.get(sheetId);
        if (!views) return;
        const view = views.find((v) => v.id === activeId);
        if (view) {
          view.filters = serializeFilters(currentFilters);
          view.updatedAt = new Date().toISOString();
        }
      });
    },

    getActiveFilterView: (sheetId: string) => {
      const activeId = get().activeFilterViewId.get(sheetId);
      if (!activeId) return null;
      const views = get().filterViews.get(sheetId);
      return views?.find((v) => v.id === activeId) ?? null;
    },
  })),
);
