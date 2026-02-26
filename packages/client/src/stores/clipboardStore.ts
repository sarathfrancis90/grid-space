import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { CellData, CellPosition, SelectionRange } from "../types/grid";
import { getCellKey } from "../utils/coordinates";

interface ClipboardState {
  mode: "copy" | "cut" | null;
  cells: Map<string, CellData>;
  sourceRange: SelectionRange | null;
  copy: (cells: Map<string, CellData>, range: SelectionRange) => void;
  cut: (cells: Map<string, CellData>, range: SelectionRange) => void;
  paste: (targetPos: CellPosition) => {
    cells: Map<string, CellData>;
    mode: "copy" | "cut" | null;
    sourceRange: SelectionRange | null;
  };
  clear: () => void;
}

export const useClipboardStore = create<ClipboardState>()(
  immer((set, get) => ({
    mode: null,
    cells: new Map<string, CellData>(),
    sourceRange: null,

    copy: (cells: Map<string, CellData>, range: SelectionRange) => {
      set((state) => {
        state.mode = "copy";
        state.cells = cells;
        state.sourceRange = range;
      });
    },

    cut: (cells: Map<string, CellData>, range: SelectionRange) => {
      set((state) => {
        state.mode = "cut";
        state.cells = cells;
        state.sourceRange = range;
      });
    },

    paste: (targetPos: CellPosition) => {
      const state = get();
      if (!state.sourceRange || state.mode === null) {
        return { cells: new Map(), mode: null, sourceRange: null };
      }
      const minRow = Math.min(
        state.sourceRange.start.row,
        state.sourceRange.end.row,
      );
      const minCol = Math.min(
        state.sourceRange.start.col,
        state.sourceRange.end.col,
      );

      const result = new Map<string, CellData>();
      for (const [key, cellData] of state.cells) {
        const [r, c] = key.split(",").map(Number);
        const newRow = r - minRow + targetPos.row;
        const newCol = c - minCol + targetPos.col;
        result.set(getCellKey(newRow, newCol), cellData);
      }
      return {
        cells: result,
        mode: state.mode,
        sourceRange: state.sourceRange,
      };
    },

    clear: () => {
      set((state) => {
        state.mode = null;
        state.cells = new Map();
        state.sourceRange = null;
      });
    },
  })),
);
