/**
 * History store — undo/redo system with 100-entry stack.
 * Captures cell state snapshots for the active sheet.
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { CellData } from "../types/grid";
import { useCellStore } from "./cellStore";
import { useSpreadsheetStore } from "./spreadsheetStore";

const MAX_HISTORY = 100;

interface HistoryEntry {
  sheetId: string;
  cells: Map<string, CellData>;
}

interface HistoryState {
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  /** Capture current state before a mutation */
  pushUndo: () => void;
  /** Undo last change */
  undo: () => void;
  /** Redo last undone change */
  redo: () => void;
  /** Check if undo/redo available */
  canUndo: () => boolean;
  canRedo: () => boolean;
  /** Clear all history */
  clear: () => void;
}

function captureSheet(sheetId: string): HistoryEntry {
  const sheetCells = useCellStore.getState().cells.get(sheetId);
  const snapshot = new Map<string, CellData>();
  if (sheetCells) {
    for (const [key, data] of sheetCells) {
      snapshot.set(key, {
        value: data.value,
        formula: data.formula,
        format: data.format ? { ...data.format } : undefined,
        comment: data.comment,
      });
    }
  }
  return { sheetId, cells: snapshot };
}

function restoreSheet(entry: HistoryEntry): void {
  const cellStore = useCellStore.getState();
  cellStore.ensureSheet(entry.sheetId);
  // We need to directly replace the sheet's cell map
  useCellStore.setState((state) => {
    state.cells.set(entry.sheetId, new Map(entry.cells));
  });
}

export const useHistoryStore = create<HistoryState>()(
  immer((set, get) => ({
    undoStack: [] as HistoryEntry[],
    redoStack: [] as HistoryEntry[],

    pushUndo: () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      if (!sheetId) return;
      const entry = captureSheet(sheetId);
      set((state) => {
        state.undoStack.push(entry);
        if (state.undoStack.length > MAX_HISTORY) {
          state.undoStack.shift();
        }
        // New action clears redo stack
        state.redoStack = [];
      });
    },

    undo: () => {
      const state = get();
      if (state.undoStack.length === 0) return;

      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      if (!sheetId) return;

      // Save current state to redo stack
      const currentEntry = captureSheet(sheetId);

      set((s) => {
        s.redoStack.push(currentEntry);
      });

      // Pop and restore from undo stack
      const entry = state.undoStack[state.undoStack.length - 1];
      set((s) => {
        s.undoStack.pop();
      });

      restoreSheet(entry);
    },

    redo: () => {
      const state = get();
      if (state.redoStack.length === 0) return;

      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      if (!sheetId) return;

      // Save current state to undo stack
      const currentEntry = captureSheet(sheetId);
      set((s) => {
        s.undoStack.push(currentEntry);
      });

      // Pop and restore from redo stack
      const entry = state.redoStack[state.redoStack.length - 1];
      set((s) => {
        s.redoStack.pop();
      });

      restoreSheet(entry);
    },

    canUndo: () => get().undoStack.length > 0,
    canRedo: () => get().redoStack.length > 0,

    clear: () => {
      set((state) => {
        state.undoStack = [];
        state.redoStack = [];
      });
    },
  })),
);
