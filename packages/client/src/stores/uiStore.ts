import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { CellPosition, SelectionRange } from "../types/grid";

/** Color used to highlight a formula reference in the formula bar and on the grid */
export interface FormulaReference {
  cellKey: string;
  color: string;
  range?: SelectionRange;
}

const REFERENCE_COLORS = [
  "#4285f4",
  "#ea4335",
  "#fbbc04",
  "#34a853",
  "#ff6d01",
  "#46bdc6",
  "#9334e6",
  "#e8710a",
];

/** Parse cell references from a formula string and assign colors */
function parseFormulaRefs(formula: string): FormulaReference[] {
  const refs: FormulaReference[] = [];
  // Match cell references like A1, $A$1, A1:B5, Sheet1!A1, Sheet2!A1, etc.
  // Sheet names can contain letters and digits (but must start with a letter)
  const refPattern =
    /(?:[A-Za-z][A-Za-z0-9]*!)?\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?/gi;
  const matches = formula.match(refPattern);
  if (!matches) return refs;

  const seen = new Set<string>();
  for (const m of matches) {
    const key = m.toUpperCase().replace(/\$/g, "");
    if (seen.has(key)) continue;
    seen.add(key);
    const colorIdx = refs.length % REFERENCE_COLORS.length;
    refs.push({ cellKey: m, color: REFERENCE_COLORS[colorIdx] });
  }
  return refs;
}

interface UIState {
  selectedCell: CellPosition | null;
  selections: SelectionRange[];
  isEditing: boolean;
  editValue: string;
  editingCell: CellPosition | null;
  zoom: number;
  isPrintDialogOpen: boolean;
  isFormatCellsDialogOpen: boolean;
  isPasteSpecialOpen: boolean;
  isCommandPaletteOpen: boolean;
  showGridlines: boolean;
  showFormulaBar: boolean;
  isHyperlinkDialogOpen: boolean;
  isImageDialogOpen: boolean;
  /** S2-001: whether user is in formula editing mode (started typing "=") */
  isFormulaMode: boolean;
  /** S2-004: colored references parsed from the current formula */
  formulaReferences: FormulaReference[];
  setSelectedCell: (pos: CellPosition | null) => void;
  addSelection: (range: SelectionRange) => void;
  clearSelections: () => void;
  setSelections: (ranges: SelectionRange[]) => void;
  startEditing: (cell: CellPosition, initialValue: string) => void;
  setEditValue: (value: string) => void;
  commitEdit: () => void;
  cancelEdit: () => void;
  setZoom: (zoom: number) => void;
  setPrintDialogOpen: (open: boolean) => void;
  setFormatCellsDialogOpen: (open: boolean) => void;
  setPasteSpecialOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setShowGridlines: (show: boolean) => void;
  setShowFormulaBar: (show: boolean) => void;
  setHyperlinkDialogOpen: (open: boolean) => void;
  setImageDialogOpen: (open: boolean) => void;
  /** S2-001: enter/exit formula mode */
  setFormulaMode: (active: boolean) => void;
  /** S2-003: insert a cell reference at the cursor in the formula */
  insertCellReference: (ref: string) => void;
  /** S2-004: parse formula references and assign colors */
  updateFormulaReferences: (formula: string) => void;
}

export const useUIStore = create<UIState>()(
  immer((set) => ({
    selectedCell: null,
    selections: [],
    isEditing: false,
    editValue: "",
    editingCell: null,
    zoom: 100,
    isPrintDialogOpen: false,
    isFormatCellsDialogOpen: false,
    isPasteSpecialOpen: false,
    isCommandPaletteOpen: false,
    showGridlines: true,
    showFormulaBar: true,
    isHyperlinkDialogOpen: false,
    isImageDialogOpen: false,
    isFormulaMode: false,
    formulaReferences: [],

    setSelectedCell: (pos: CellPosition | null) => {
      set((state) => {
        state.selectedCell = pos;
        if (pos) {
          state.selections = [{ start: pos, end: pos }];
        }
      });
    },

    addSelection: (range: SelectionRange) => {
      set((state) => {
        state.selections.push(range);
      });
    },

    clearSelections: () => {
      set((state) => {
        state.selections = [];
      });
    },

    setSelections: (ranges: SelectionRange[]) => {
      set((state) => {
        state.selections = ranges;
      });
    },

    startEditing: (cell: CellPosition, initialValue: string) => {
      set((state) => {
        state.isEditing = true;
        state.editingCell = cell;
        state.editValue = initialValue;
        // S2-001: if the value starts with "=", activate formula mode
        state.isFormulaMode = initialValue.startsWith("=");
        if (initialValue.startsWith("=")) {
          state.formulaReferences = parseFormulaRefs(initialValue);
        } else {
          state.formulaReferences = [];
        }
      });
    },

    setEditValue: (value: string) => {
      set((state) => {
        state.editValue = value;
        // S2-001: toggle formula mode based on "=" prefix
        const wasFormula = state.isFormulaMode;
        state.isFormulaMode = value.startsWith("=");
        if (value.startsWith("=")) {
          state.formulaReferences = parseFormulaRefs(value);
        } else if (wasFormula) {
          state.formulaReferences = [];
        }
      });
    },

    commitEdit: () => {
      set((state) => {
        state.isEditing = false;
        state.editingCell = null;
        state.editValue = "";
        state.isFormulaMode = false;
        state.formulaReferences = [];
      });
    },

    cancelEdit: () => {
      set((state) => {
        state.isEditing = false;
        state.editingCell = null;
        state.editValue = "";
        state.isFormulaMode = false;
        state.formulaReferences = [];
      });
    },

    setZoom: (zoom: number) => {
      set((state) => {
        state.zoom = Math.max(50, Math.min(200, zoom));
      });
    },

    setPrintDialogOpen: (open: boolean) => {
      set((state) => {
        state.isPrintDialogOpen = open;
      });
    },

    setFormatCellsDialogOpen: (open: boolean) => {
      set((state) => {
        state.isFormatCellsDialogOpen = open;
      });
    },

    setPasteSpecialOpen: (open: boolean) => {
      set((state) => {
        state.isPasteSpecialOpen = open;
      });
    },

    setCommandPaletteOpen: (open: boolean) => {
      set((state) => {
        state.isCommandPaletteOpen = open;
      });
    },

    setShowGridlines: (show: boolean) => {
      set((state) => {
        state.showGridlines = show;
      });
    },

    setShowFormulaBar: (show: boolean) => {
      set((state) => {
        state.showFormulaBar = show;
      });
    },

    setHyperlinkDialogOpen: (open: boolean) => {
      set((state) => {
        state.isHyperlinkDialogOpen = open;
      });
    },

    setImageDialogOpen: (open: boolean) => {
      set((state) => {
        state.isImageDialogOpen = open;
      });
    },

    setFormulaMode: (active: boolean) => {
      set((state) => {
        state.isFormulaMode = active;
        if (!active) {
          state.formulaReferences = [];
        }
      });
    },

    insertCellReference: (ref: string) => {
      set((state) => {
        if (!state.isFormulaMode || !state.isEditing) return;
        state.editValue = state.editValue + ref;
        state.formulaReferences = parseFormulaRefs(state.editValue);
      });
    },

    updateFormulaReferences: (formula: string) => {
      set((state) => {
        state.formulaReferences = parseFormulaRefs(formula);
      });
    },
  })),
);

export { REFERENCE_COLORS, parseFormulaRefs };
