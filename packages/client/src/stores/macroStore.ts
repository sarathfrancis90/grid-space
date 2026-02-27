/**
 * Macro store — records, saves, replays, and manages user macros.
 * Uses Zustand + Immer following the project pattern.
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { CellFormat, CellPosition } from "../types/grid";
import { useCellStore } from "./cellStore";
import { useFormatStore } from "./formatStore";
import { useGridStore } from "./gridStore";
import { useUIStore } from "./uiStore";
import { useSpreadsheetStore } from "./spreadsheetStore";
import { useHistoryStore } from "./historyStore";
import { positionToCellRef } from "../utils/coordinates";

// --- Types ---

export type MacroAction =
  | {
      type: "setCellValue";
      row: number;
      col: number;
      sheetId: string;
      value: string | number | boolean | null;
    }
  | {
      type: "setFormat";
      row: number;
      col: number;
      sheetId: string;
      format: Partial<CellFormat>;
    }
  | { type: "selectRange"; start: CellPosition; end: CellPosition }
  | { type: "insertRow"; row: number; count: number }
  | { type: "deleteRow"; rows: number[] }
  | { type: "insertCol"; col: number; count: number }
  | { type: "deleteCol"; cols: number[] }
  | { type: "sort"; col: number; direction: "asc" | "desc" }
  | { type: "navigate"; row: number; col: number };

export interface MacroDefinition {
  id: string;
  name: string;
  description: string;
  actions: MacroAction[];
  createdAt: number;
  shortcut: string;
}

interface MacroState {
  macros: MacroDefinition[];
  isRecording: boolean;
  recordingName: string;
  recordedActions: MacroAction[];
  selectedMacroId: string | null;

  startRecording: (name: string) => void;
  stopRecording: () => void;
  recordAction: (action: MacroAction) => void;
  runMacro: (id: string) => void;
  deleteMacro: (id: string) => void;
  renameMacro: (id: string, name: string) => void;
  setMacroShortcut: (id: string, shortcut: string) => void;
  setSelectedMacro: (id: string | null) => void;
  getMacroScript: (id: string) => string;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatValue(val: string | number | boolean | null): string {
  if (val === null) return "null";
  if (typeof val === "string") return `"${val.replace(/"/g, '\\"')}"`;
  return String(val);
}

function formatFormatObj(fmt: Partial<CellFormat>): string {
  const entries = Object.entries(fmt)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => {
      if (typeof v === "string") return `${k}: "${v}"`;
      return `${k}: ${String(v)}`;
    });
  return `{ ${entries.join(", ")} }`;
}

function actionToScript(action: MacroAction): string {
  switch (action.type) {
    case "setCellValue": {
      const ref = positionToCellRef({ row: action.row, col: action.col });
      return `cell("${ref}").value = ${formatValue(action.value)};`;
    }
    case "setFormat": {
      const ref = positionToCellRef({ row: action.row, col: action.col });
      return `cell("${ref}").format(${formatFormatObj(action.format)});`;
    }
    case "selectRange": {
      const s = positionToCellRef(action.start);
      const e = positionToCellRef(action.end);
      return `selectRange("${s}:${e}");`;
    }
    case "insertRow":
      return `insertRows(${action.row + 1}, ${action.count});`;
    case "deleteRow":
      return `deleteRows([${action.rows.map((r) => r + 1).join(", ")}]);`;
    case "insertCol":
      return `insertCols(${action.col + 1}, ${action.count});`;
    case "deleteCol":
      return `deleteCols([${action.cols.map((c) => c + 1).join(", ")}]);`;
    case "sort":
      return `sortColumn(${action.col + 1}, "${action.direction}");`;
    case "navigate": {
      const ref = positionToCellRef({ row: action.row, col: action.col });
      return `goto("${ref}");`;
    }
  }
}

function replayAction(action: MacroAction): void {
  const sheetId = useSpreadsheetStore.getState().activeSheetId;
  const cellStore = useCellStore.getState();
  const formatStore = useFormatStore.getState();
  const gridStore = useGridStore.getState();
  const uiStore = useUIStore.getState();

  switch (action.type) {
    case "setCellValue": {
      const existing = cellStore.getCell(sheetId, action.row, action.col);
      cellStore.setCell(sheetId, action.row, action.col, {
        value: action.value,
        formula: existing?.formula,
        format: existing?.format,
        comment: existing?.comment,
      });
      break;
    }
    case "setFormat":
      formatStore.setFormat(sheetId, action.row, action.col, action.format);
      break;
    case "selectRange":
      uiStore.setSelectedCell(action.start);
      uiStore.setSelections([{ start: action.start, end: action.end }]);
      break;
    case "insertRow":
      cellStore.insertRows(
        sheetId,
        action.row,
        action.count,
        gridStore.totalRows,
      );
      gridStore.setTotalRows(gridStore.totalRows + action.count);
      break;
    case "deleteRow":
      cellStore.deleteRows(sheetId, action.rows, gridStore.totalRows);
      gridStore.setTotalRows(
        Math.max(1, gridStore.totalRows - action.rows.length),
      );
      break;
    case "insertCol":
      cellStore.insertCols(
        sheetId,
        action.col,
        action.count,
        gridStore.totalCols,
      );
      gridStore.setTotalCols(gridStore.totalCols + action.count);
      break;
    case "deleteCol":
      cellStore.deleteCols(sheetId, action.cols, gridStore.totalCols);
      gridStore.setTotalCols(
        Math.max(1, gridStore.totalCols - action.cols.length),
      );
      break;
    case "sort":
      // Sort is complex — just navigate to the column for now
      break;
    case "navigate":
      uiStore.setSelectedCell({ row: action.row, col: action.col });
      break;
  }
}

export const useMacroStore = create<MacroState>()(
  immer((set, get) => ({
    macros: [],
    isRecording: false,
    recordingName: "",
    recordedActions: [],
    selectedMacroId: null,

    startRecording: (name: string) => {
      set((state) => {
        state.isRecording = true;
        state.recordingName = name;
        state.recordedActions = [];
      });
    },

    stopRecording: () => {
      const state = get();
      if (!state.isRecording) return;

      const macro: MacroDefinition = {
        id: generateId(),
        name: state.recordingName || "Untitled Macro",
        description: "",
        actions: [...state.recordedActions],
        createdAt: Date.now(),
        shortcut: "",
      };

      set((s) => {
        s.isRecording = false;
        s.recordingName = "";
        s.recordedActions = [];
        if (macro.actions.length > 0) {
          s.macros.push(macro);
        }
      });
    },

    recordAction: (action: MacroAction) => {
      set((state) => {
        if (state.isRecording) {
          state.recordedActions.push(action);
        }
      });
    },

    runMacro: (id: string) => {
      const macro = get().macros.find((m) => m.id === id);
      if (!macro) return;

      useHistoryStore.getState().pushUndo();

      for (const action of macro.actions) {
        replayAction(action);
      }
    },

    deleteMacro: (id: string) => {
      set((state) => {
        state.macros = state.macros.filter((m) => m.id !== id);
        if (state.selectedMacroId === id) {
          state.selectedMacroId = null;
        }
      });
    },

    renameMacro: (id: string, name: string) => {
      set((state) => {
        const macro = state.macros.find((m) => m.id === id);
        if (macro) {
          macro.name = name;
        }
      });
    },

    setMacroShortcut: (id: string, shortcut: string) => {
      set((state) => {
        const macro = state.macros.find((m) => m.id === id);
        if (macro) {
          // Remove shortcut from any other macro using the same one
          if (shortcut) {
            for (const m of state.macros) {
              if (m.id !== id && m.shortcut === shortcut) {
                m.shortcut = "";
              }
            }
          }
          macro.shortcut = shortcut;
        }
      });
    },

    setSelectedMacro: (id: string | null) => {
      set((state) => {
        state.selectedMacroId = id;
      });
    },

    getMacroScript: (id: string) => {
      const macro = get().macros.find((m) => m.id === id);
      if (!macro) return "";

      const date = new Date(macro.createdAt);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      const lines: string[] = [
        `// Macro: "${macro.name}"`,
        `// Created: ${dateStr}`,
        `// Actions: ${macro.actions.length}`,
        "",
      ];

      for (const action of macro.actions) {
        lines.push(actionToScript(action));
      }

      return lines.join("\n");
    },
  })),
);
