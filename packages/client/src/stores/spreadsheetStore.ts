import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { SheetData } from "../types/grid";

const DEFAULT_SHEET_ID = "sheet-1";

function createDefaultSheet(id: string, name: string): SheetData {
  return {
    id,
    name,
    cells: new Map(),
    columnWidths: new Map(),
    rowHeights: new Map(),
    frozenRows: 0,
    frozenCols: 0,
    hiddenRows: new Set(),
    hiddenCols: new Set(),
  };
}

interface SpreadsheetState {
  id: string;
  title: string;
  sheets: SheetData[];
  activeSheetId: string;
  addSheet: (name?: string) => void;
  removeSheet: (sheetId: string) => void;
  renameSheet: (sheetId: string, name: string) => void;
  setActiveSheet: (sheetId: string) => void;
  getActiveSheet: () => SheetData | undefined;
}

export const useSpreadsheetStore = create<SpreadsheetState>()(
  immer((set, get) => ({
    id: "spreadsheet-1",
    title: "Untitled Spreadsheet",
    sheets: [createDefaultSheet(DEFAULT_SHEET_ID, "Sheet 1")],
    activeSheetId: DEFAULT_SHEET_ID,

    addSheet: (name?: string) => {
      set((state) => {
        const sheetNum = state.sheets.length + 1;
        const sheetName = name ?? `Sheet ${sheetNum}`;
        const sheetId = `sheet-${Date.now()}`;
        state.sheets.push(createDefaultSheet(sheetId, sheetName));
      });
    },

    removeSheet: (sheetId: string) => {
      set((state) => {
        if (state.sheets.length <= 1) return;
        const idx = state.sheets.findIndex((s) => s.id === sheetId);
        if (idx === -1) return;
        state.sheets.splice(idx, 1);
        if (state.activeSheetId === sheetId) {
          state.activeSheetId = state.sheets[0].id;
        }
      });
    },

    renameSheet: (sheetId: string, name: string) => {
      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (sheet) {
          sheet.name = name;
        }
      });
    },

    setActiveSheet: (sheetId: string) => {
      set((state) => {
        state.activeSheetId = sheetId;
      });
    },

    getActiveSheet: () => {
      const state = get();
      return state.sheets.find((s) => s.id === state.activeSheetId);
    },
  })),
);
