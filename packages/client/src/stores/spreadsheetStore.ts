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
  duplicateSheet: (sheetId: string) => void;
  reorderSheet: (fromIndex: number, toIndex: number) => void;
  setTabColor: (sheetId: string, color: string | undefined) => void;
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

    duplicateSheet: (sheetId: string) => {
      set((state) => {
        const source = state.sheets.find((s) => s.id === sheetId);
        if (!source) return;
        const newId = `sheet-${Date.now()}`;
        const newSheet = createDefaultSheet(newId, `${source.name} (Copy)`);
        newSheet.tabColor = source.tabColor;
        newSheet.frozenRows = source.frozenRows;
        newSheet.frozenCols = source.frozenCols;
        const idx = state.sheets.findIndex((s) => s.id === sheetId);
        state.sheets.splice(idx + 1, 0, newSheet);
      });
    },

    reorderSheet: (fromIndex: number, toIndex: number) => {
      set((state) => {
        if (
          fromIndex < 0 ||
          fromIndex >= state.sheets.length ||
          toIndex < 0 ||
          toIndex >= state.sheets.length
        )
          return;
        const [sheet] = state.sheets.splice(fromIndex, 1);
        state.sheets.splice(toIndex, 0, sheet);
      });
    },

    setTabColor: (sheetId: string, color: string | undefined) => {
      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (sheet) {
          sheet.tabColor = color;
        }
      });
    },
  })),
);
