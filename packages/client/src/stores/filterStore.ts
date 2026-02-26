import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  SortCriterion,
  ColumnFilter,
  FilterCondition,
  CellData,
} from "../types/grid";
import { getCellKey } from "../utils/coordinates";

interface FilterState {
  filtersEnabled: Map<string, boolean>;
  columnFilters: Map<string, ColumnFilter[]>;
  sortCriteria: Map<string, SortCriterion[]>;
  filteredRows: Map<string, Set<number>>;

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
  })),
);
