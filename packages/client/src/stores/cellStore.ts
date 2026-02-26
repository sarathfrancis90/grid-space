import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { CellData } from "../types/grid";
import { getCellKey } from "../utils/coordinates";

interface CellState {
  cells: Map<string, Map<string, CellData>>;
  getCell: (sheetId: string, row: number, col: number) => CellData | undefined;
  setCell: (sheetId: string, row: number, col: number, data: CellData) => void;
  deleteCell: (sheetId: string, row: number, col: number) => void;
  getCellsInRange: (
    sheetId: string,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
  ) => CellData[];
  ensureSheet: (sheetId: string) => void;
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

    ensureSheet: (sheetId: string) => {
      set((state) => {
        if (!state.cells.has(sheetId)) {
          state.cells.set(sheetId, new Map<string, CellData>());
        }
      });
    },
  })),
);
