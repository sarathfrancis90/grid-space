import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { TableConfig, TableStylePreset, CellData } from "../types/grid";
import { getCellKey } from "../utils/coordinates";

interface TableState {
  tables: Map<string, TableConfig>;

  // CRUD
  createTable: (config: TableConfig) => void;
  deleteTable: (tableId: string) => void;
  renameTable: (tableId: string, name: string) => void;
  resizeTable: (tableId: string, newEndRow: number, newEndCol: number) => void;

  // Query
  getTable: (tableId: string) => TableConfig | undefined;
  getTableByName: (name: string) => TableConfig | undefined;
  getTablesForSheet: (sheetId: string) => TableConfig[];
  getAllTables: () => TableConfig[];
  getTableAtCell: (
    sheetId: string,
    row: number,
    col: number,
  ) => TableConfig | undefined;

  // Column management
  addColumn: (tableId: string, headerName: string) => void;
  removeColumn: (tableId: string, columnId: string) => void;
  renameColumn: (tableId: string, columnId: string, newName: string) => void;
  getColumnIndex: (tableId: string, headerName: string) => number;

  // Table options
  setShowHeaderRow: (tableId: string, show: boolean) => void;
  setShowTotalRow: (tableId: string, show: boolean) => void;
  setShowBandedRows: (tableId: string, show: boolean) => void;
  setShowBandedCols: (tableId: string, show: boolean) => void;
  setStylePreset: (tableId: string, preset: TableStylePreset) => void;

  // Structured reference resolution
  resolveStructuredRef: (
    tableName: string,
    specifier: string,
    currentRow?: number,
  ) => {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  } | null;

  // Header-aware sort/filter
  getTableHeaders: (tableId: string) => string[];
  sortTableByColumn: (
    tableId: string,
    headerName: string,
    direction: "asc" | "desc",
    cells: Map<string, CellData>,
  ) => Map<string, CellData>;
  filterTableByColumn: (
    tableId: string,
    headerName: string,
    cells: Map<string, CellData>,
    predicate: (value: string | number | boolean | null) => boolean,
  ) => Set<number>;
}

function generateColumnId(): string {
  return `col-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useTableStore = create<TableState>()(
  immer((set, get) => ({
    tables: new Map<string, TableConfig>(),

    createTable: (config: TableConfig) => {
      set((state) => {
        state.tables.set(config.id, config);
      });
    },

    deleteTable: (tableId: string) => {
      set((state) => {
        state.tables.delete(tableId);
      });
    },

    renameTable: (tableId: string, name: string) => {
      set((state) => {
        const table = state.tables.get(tableId);
        if (table) {
          table.name = name;
        }
      });
    },

    resizeTable: (tableId: string, newEndRow: number, newEndCol: number) => {
      set((state) => {
        const table = state.tables.get(tableId);
        if (!table) return;

        const oldColCount = table.endCol - table.startCol + 1;
        const newColCount = newEndCol - table.startCol + 1;

        // Add new columns if expanding
        if (newColCount > oldColCount) {
          for (let i = oldColCount; i < newColCount; i++) {
            table.columns.push({
              id: generateColumnId(),
              headerName: `Column ${i + 1}`,
            });
          }
        }
        // Remove columns if shrinking
        if (newColCount < oldColCount) {
          table.columns.splice(newColCount);
        }

        table.endRow = newEndRow;
        table.endCol = newEndCol;
      });
    },

    getTable: (tableId: string) => {
      return get().tables.get(tableId);
    },

    getTableByName: (name: string) => {
      const normalized = name.toLowerCase();
      for (const table of get().tables.values()) {
        if (table.name.toLowerCase() === normalized) {
          return table;
        }
      }
      return undefined;
    },

    getTablesForSheet: (sheetId: string) => {
      return Array.from(get().tables.values()).filter(
        (t) => t.sheetId === sheetId,
      );
    },

    getAllTables: () => {
      return Array.from(get().tables.values());
    },

    getTableAtCell: (sheetId: string, row: number, col: number) => {
      for (const table of get().tables.values()) {
        if (
          table.sheetId === sheetId &&
          row >= table.startRow &&
          row <= table.endRow &&
          col >= table.startCol &&
          col <= table.endCol
        ) {
          return table;
        }
      }
      return undefined;
    },

    addColumn: (tableId: string, headerName: string) => {
      set((state) => {
        const table = state.tables.get(tableId);
        if (!table) return;
        table.columns.push({
          id: generateColumnId(),
          headerName,
        });
        table.endCol += 1;
      });
    },

    removeColumn: (tableId: string, columnId: string) => {
      set((state) => {
        const table = state.tables.get(tableId);
        if (!table) return;
        if (table.columns.length <= 1) return; // Must have at least 1 column
        const idx = table.columns.findIndex((c) => c.id === columnId);
        if (idx >= 0) {
          table.columns.splice(idx, 1);
          table.endCol -= 1;
        }
      });
    },

    renameColumn: (tableId: string, columnId: string, newName: string) => {
      set((state) => {
        const table = state.tables.get(tableId);
        if (!table) return;
        const col = table.columns.find((c) => c.id === columnId);
        if (col) {
          col.headerName = newName;
        }
      });
    },

    getColumnIndex: (tableId: string, headerName: string) => {
      const table = get().tables.get(tableId);
      if (!table) return -1;
      const normalized = headerName.toLowerCase();
      return table.columns.findIndex(
        (c) => c.headerName.toLowerCase() === normalized,
      );
    },

    setShowHeaderRow: (tableId: string, show: boolean) => {
      set((state) => {
        const table = state.tables.get(tableId);
        if (table) table.showHeaderRow = show;
      });
    },

    setShowTotalRow: (tableId: string, show: boolean) => {
      set((state) => {
        const table = state.tables.get(tableId);
        if (table) table.showTotalRow = show;
      });
    },

    setShowBandedRows: (tableId: string, show: boolean) => {
      set((state) => {
        const table = state.tables.get(tableId);
        if (table) table.showBandedRows = show;
      });
    },

    setShowBandedCols: (tableId: string, show: boolean) => {
      set((state) => {
        const table = state.tables.get(tableId);
        if (table) table.showBandedCols = show;
      });
    },

    setStylePreset: (tableId: string, preset: TableStylePreset) => {
      set((state) => {
        const table = state.tables.get(tableId);
        if (table) table.stylePreset = preset;
      });
    },

    resolveStructuredRef: (
      tableName: string,
      specifier: string,
      currentRow?: number,
    ) => {
      const table = get().getTableByName(tableName);
      if (!table) return null;

      const dataStartRow = table.showHeaderRow
        ? table.startRow + 1
        : table.startRow;
      const dataEndRow = table.showTotalRow ? table.endRow - 1 : table.endRow;

      const normalized = specifier.trim().toLowerCase();

      // [#All] — entire table including headers and totals
      if (normalized === "#all") {
        return {
          startRow: table.startRow,
          startCol: table.startCol,
          endRow: table.endRow,
          endCol: table.endCol,
        };
      }

      // [#Data] — data rows only (no headers, no totals)
      if (normalized === "#data") {
        return {
          startRow: dataStartRow,
          startCol: table.startCol,
          endRow: dataEndRow,
          endCol: table.endCol,
        };
      }

      // [#Headers] — header row only
      if (normalized === "#headers") {
        if (!table.showHeaderRow) return null;
        return {
          startRow: table.startRow,
          startCol: table.startCol,
          endRow: table.startRow,
          endCol: table.endCol,
        };
      }

      // [#Totals] — total row only
      if (normalized === "#totals") {
        if (!table.showTotalRow) return null;
        return {
          startRow: table.endRow,
          startCol: table.startCol,
          endRow: table.endRow,
          endCol: table.endCol,
        };
      }

      // [#This Row] or [@] — current row intersection with table
      if (normalized === "#this row" || normalized === "@") {
        if (currentRow === undefined) return null;
        if (currentRow < dataStartRow || currentRow > dataEndRow) return null;
        return {
          startRow: currentRow,
          startCol: table.startCol,
          endRow: currentRow,
          endCol: table.endCol,
        };
      }

      // [@ColumnName] — current row intersected with specific column
      if (normalized.startsWith("@") && normalized.length > 1) {
        if (currentRow === undefined) return null;
        if (currentRow < dataStartRow || currentRow > dataEndRow) return null;
        const colName = specifier.trim().slice(1).trim().toLowerCase();
        const atColIdx = table.columns.findIndex(
          (c) => c.headerName.toLowerCase() === colName,
        );
        if (atColIdx >= 0) {
          const col = table.startCol + atColIdx;
          return {
            startRow: currentRow,
            startCol: col,
            endRow: currentRow,
            endCol: col,
          };
        }
        return null;
      }

      // Column reference: [ColumnName] — data column only
      const colIdx = table.columns.findIndex(
        (c) => c.headerName.toLowerCase() === normalized,
      );
      if (colIdx >= 0) {
        const col = table.startCol + colIdx;
        return {
          startRow: dataStartRow,
          startCol: col,
          endRow: dataEndRow,
          endCol: col,
        };
      }

      return null;
    },

    getTableHeaders: (tableId: string) => {
      const table = get().tables.get(tableId);
      if (!table) return [];
      return table.columns.map((c) => c.headerName);
    },

    sortTableByColumn: (
      tableId: string,
      headerName: string,
      direction: "asc" | "desc",
      cells: Map<string, CellData>,
    ) => {
      const table = get().tables.get(tableId);
      if (!table) return cells;

      const colIdx = get().getColumnIndex(tableId, headerName);
      if (colIdx < 0) return cells;

      const sortCol = table.startCol + colIdx;
      const dataStartRow = table.showHeaderRow
        ? table.startRow + 1
        : table.startRow;
      const dataEndRow = table.showTotalRow ? table.endRow - 1 : table.endRow;

      // Collect data rows
      const rows: { data: Map<number, CellData> }[] = [];
      for (let r = dataStartRow; r <= dataEndRow; r++) {
        const rowData = new Map<number, CellData>();
        for (let c = table.startCol; c <= table.endCol; c++) {
          const cell = cells.get(getCellKey(r, c));
          if (cell) rowData.set(c, cell);
        }
        rows.push({ data: rowData });
      }

      // Sort rows
      rows.sort((a, b) => {
        const aCell = a.data.get(sortCol);
        const bCell = b.data.get(sortCol);
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

        return direction === "desc" ? -cmp : cmp;
      });

      // Rebuild cells map with sorted data
      const newCells = new Map(cells);
      for (let r = dataStartRow; r <= dataEndRow; r++) {
        for (let c = table.startCol; c <= table.endCol; c++) {
          newCells.delete(getCellKey(r, c));
        }
      }
      for (let i = 0; i < rows.length; i++) {
        const r = dataStartRow + i;
        for (const [c, data] of rows[i].data) {
          newCells.set(getCellKey(r, c), data);
        }
      }

      return newCells;
    },

    filterTableByColumn: (
      tableId: string,
      headerName: string,
      cells: Map<string, CellData>,
      predicate: (value: string | number | boolean | null) => boolean,
    ) => {
      const table = get().tables.get(tableId);
      if (!table) return new Set<number>();

      const colIdx = get().getColumnIndex(tableId, headerName);
      if (colIdx < 0) return new Set<number>();

      const filterCol = table.startCol + colIdx;
      const dataStartRow = table.showHeaderRow
        ? table.startRow + 1
        : table.startRow;
      const dataEndRow = table.showTotalRow ? table.endRow - 1 : table.endRow;

      const hiddenRows = new Set<number>();
      for (let r = dataStartRow; r <= dataEndRow; r++) {
        const cell = cells.get(getCellKey(r, filterCol));
        const value = cell?.value ?? null;
        if (!predicate(value)) {
          hiddenRows.add(r);
        }
      }

      return hiddenRows;
    },
  })),
);
