import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { CellData } from "../types/grid";
import { getCellKey } from "../utils/coordinates";

interface CellState {
  cells: Map<string, Map<string, CellData>>;
  getCell: (sheetId: string, row: number, col: number) => CellData | undefined;
  setCell: (sheetId: string, row: number, col: number, data: CellData) => void;
  setCellBatch: (
    sheetId: string,
    updates: Array<{ row: number; col: number; data: CellData }>,
  ) => void;
  deleteCell: (sheetId: string, row: number, col: number) => void;
  getCellsInRange: (
    sheetId: string,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
  ) => CellData[];
  getCellsInRangeWithKeys: (
    sheetId: string,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
  ) => Map<string, CellData>;
  clearRange: (
    sheetId: string,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
  ) => void;
  insertRows: (
    sheetId: string,
    atRow: number,
    count: number,
    totalRows: number,
  ) => void;
  deleteRows: (sheetId: string, rows: number[], totalRows: number) => void;
  insertCols: (
    sheetId: string,
    atCol: number,
    count: number,
    totalCols: number,
  ) => void;
  deleteCols: (sheetId: string, cols: number[], totalCols: number) => void;
  moveRow: (
    sheetId: string,
    fromRow: number,
    toRow: number,
    totalCols: number,
  ) => void;
  moveCol: (
    sheetId: string,
    fromCol: number,
    toCol: number,
    totalRows: number,
  ) => void;
  clearValues: (
    sheetId: string,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
  ) => void;
  ensureSheet: (sheetId: string) => void;
  getLastDataPosition: (sheetId: string) => { row: number; col: number };
}

export const useCellStore = create<CellState>()(
  immer((set, get) => ({
    cells: new Map<string, Map<string, CellData>>(),

    getCell: (sheetId: string, row: number, col: number) => {
      const sheetCells = get().cells.get(sheetId);
      if (!sheetCells) return undefined;
      return sheetCells.get(getCellKey(row, col));
    },

    setCell: (sheetId: string, row: number, col: number, data: CellData) => {
      set((state) => {
        if (!state.cells.has(sheetId)) {
          state.cells.set(sheetId, new Map<string, CellData>());
        }
        state.cells.get(sheetId)!.set(getCellKey(row, col), data);
      });
    },

    setCellBatch: (
      sheetId: string,
      updates: Array<{ row: number; col: number; data: CellData }>,
    ) => {
      if (updates.length === 0) return;
      set((state) => {
        if (!state.cells.has(sheetId)) {
          state.cells.set(sheetId, new Map<string, CellData>());
        }
        const sheetCells = state.cells.get(sheetId)!;
        for (const { row, col, data } of updates) {
          sheetCells.set(getCellKey(row, col), data);
        }
      });
    },

    deleteCell: (sheetId: string, row: number, col: number) => {
      set((state) => {
        const sheetCells = state.cells.get(sheetId);
        if (sheetCells) {
          sheetCells.delete(getCellKey(row, col));
        }
      });
    },

    getCellsInRange: (
      sheetId: string,
      startRow: number,
      startCol: number,
      endRow: number,
      endCol: number,
    ) => {
      const sheetCells = get().cells.get(sheetId);
      if (!sheetCells) return [];
      const result: CellData[] = [];
      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      const minCol = Math.min(startCol, endCol);
      const maxCol = Math.max(startCol, endCol);
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          const cell = sheetCells.get(getCellKey(r, c));
          if (cell) {
            result.push(cell);
          }
        }
      }
      return result;
    },

    getCellsInRangeWithKeys: (
      sheetId: string,
      startRow: number,
      startCol: number,
      endRow: number,
      endCol: number,
    ) => {
      const sheetCells = get().cells.get(sheetId);
      const result = new Map<string, CellData>();
      if (!sheetCells) return result;
      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      const minCol = Math.min(startCol, endCol);
      const maxCol = Math.max(startCol, endCol);
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          const key = getCellKey(r, c);
          const cell = sheetCells.get(key);
          if (cell) {
            result.set(key, cell);
          }
        }
      }
      return result;
    },

    clearRange: (
      sheetId: string,
      startRow: number,
      startCol: number,
      endRow: number,
      endCol: number,
    ) => {
      set((state) => {
        const sheetCells = state.cells.get(sheetId);
        if (!sheetCells) return;
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            sheetCells.delete(getCellKey(r, c));
          }
        }
      });
    },

    clearValues: (
      sheetId: string,
      startRow: number,
      startCol: number,
      endRow: number,
      endCol: number,
    ) => {
      set((state) => {
        const sheetCells = state.cells.get(sheetId);
        if (!sheetCells) return;
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            const key = getCellKey(r, c);
            const cell = sheetCells.get(key);
            if (cell) {
              if (cell.format && Object.keys(cell.format).length > 0) {
                sheetCells.set(key, { value: null, format: cell.format });
              } else {
                sheetCells.delete(key);
              }
            }
          }
        }
      });
    },

    insertRows: (
      sheetId: string,
      atRow: number,
      count: number,
      totalRows: number,
    ) => {
      set((state) => {
        const sheetCells = state.cells.get(sheetId);
        if (!sheetCells) return;
        const newMap = new Map<string, CellData>();
        for (const [key, data] of sheetCells) {
          const [r, c] = key.split(",").map(Number);
          if (r >= atRow) {
            newMap.set(getCellKey(Math.min(r + count, totalRows - 1), c), data);
          } else {
            newMap.set(key, data);
          }
        }
        state.cells.set(sheetId, newMap);
      });
    },

    deleteRows: (sheetId: string, rows: number[], totalRows: number) => {
      set((state) => {
        const sheetCells = state.cells.get(sheetId);
        if (!sheetCells) return;
        const sortedRows = [...rows].sort((a, b) => a - b);
        const rowSet = new Set(sortedRows);
        const newMap = new Map<string, CellData>();
        for (const [key, data] of sheetCells) {
          const [r, c] = key.split(",").map(Number);
          if (rowSet.has(r)) continue;
          let offset = 0;
          for (const dr of sortedRows) {
            if (dr < r) offset++;
          }
          newMap.set(
            getCellKey(Math.max(0, Math.min(r - offset, totalRows - 1)), c),
            data,
          );
        }
        state.cells.set(sheetId, newMap);
      });
    },

    insertCols: (
      sheetId: string,
      atCol: number,
      count: number,
      totalCols: number,
    ) => {
      set((state) => {
        const sheetCells = state.cells.get(sheetId);
        if (!sheetCells) return;
        const newMap = new Map<string, CellData>();
        for (const [key, data] of sheetCells) {
          const [r, c] = key.split(",").map(Number);
          if (c >= atCol) {
            newMap.set(getCellKey(r, Math.min(c + count, totalCols - 1)), data);
          } else {
            newMap.set(key, data);
          }
        }
        state.cells.set(sheetId, newMap);
      });
    },

    deleteCols: (sheetId: string, cols: number[], totalCols: number) => {
      set((state) => {
        const sheetCells = state.cells.get(sheetId);
        if (!sheetCells) return;
        const sortedCols = [...cols].sort((a, b) => a - b);
        const colSet = new Set(sortedCols);
        const newMap = new Map<string, CellData>();
        for (const [key, data] of sheetCells) {
          const [r, c] = key.split(",").map(Number);
          if (colSet.has(c)) continue;
          let offset = 0;
          for (const dc of sortedCols) {
            if (dc < c) offset++;
          }
          newMap.set(
            getCellKey(r, Math.max(0, Math.min(c - offset, totalCols - 1))),
            data,
          );
        }
        state.cells.set(sheetId, newMap);
      });
    },

    moveRow: (
      sheetId: string,
      fromRow: number,
      toRow: number,
      totalCols: number,
    ) => {
      if (fromRow === toRow) return;
      set((state) => {
        const sheetCells = state.cells.get(sheetId);
        if (!sheetCells) return;
        // Collect cells in the source row
        const fromCells = new Map<number, CellData>();
        const toCells = new Map<number, CellData>();
        for (let c = 0; c < totalCols; c++) {
          const fKey = getCellKey(fromRow, c);
          const tKey = getCellKey(toRow, c);
          const fCell = sheetCells.get(fKey);
          const tCell = sheetCells.get(tKey);
          if (fCell) fromCells.set(c, fCell);
          if (tCell) toCells.set(c, tCell);
          sheetCells.delete(fKey);
          sheetCells.delete(tKey);
        }
        // Swap: put fromCells into toRow and toCells into fromRow
        for (const [c, data] of fromCells) {
          sheetCells.set(getCellKey(toRow, c), data);
        }
        for (const [c, data] of toCells) {
          sheetCells.set(getCellKey(fromRow, c), data);
        }
      });
    },

    moveCol: (
      sheetId: string,
      fromCol: number,
      toCol: number,
      totalRows: number,
    ) => {
      if (fromCol === toCol) return;
      set((state) => {
        const sheetCells = state.cells.get(sheetId);
        if (!sheetCells) return;
        const fromCells = new Map<number, CellData>();
        const toCells = new Map<number, CellData>();
        for (let r = 0; r < totalRows; r++) {
          const fKey = getCellKey(r, fromCol);
          const tKey = getCellKey(r, toCol);
          const fCell = sheetCells.get(fKey);
          const tCell = sheetCells.get(tKey);
          if (fCell) fromCells.set(r, fCell);
          if (tCell) toCells.set(r, tCell);
          sheetCells.delete(fKey);
          sheetCells.delete(tKey);
        }
        for (const [r, data] of fromCells) {
          sheetCells.set(getCellKey(r, toCol), data);
        }
        for (const [r, data] of toCells) {
          sheetCells.set(getCellKey(r, fromCol), data);
        }
      });
    },

    ensureSheet: (sheetId: string) => {
      set((state) => {
        if (!state.cells.has(sheetId)) {
          state.cells.set(sheetId, new Map<string, CellData>());
        }
      });
    },

    getLastDataPosition: (sheetId: string) => {
      const sheetCells = get().cells.get(sheetId);
      if (!sheetCells || sheetCells.size === 0) {
        return { row: 0, col: 0 };
      }
      let maxRow = 0;
      let maxCol = 0;
      for (const key of sheetCells.keys()) {
        const [r, c] = key.split(",").map(Number);
        if (r > maxRow) maxRow = r;
        if (c > maxCol) maxCol = c;
      }
      return { row: maxRow, col: maxCol };
    },
  })),
);
