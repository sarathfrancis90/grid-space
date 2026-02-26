import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { CellPosition, SelectionRange } from "../types/grid";

interface UIState {
  selectedCell: CellPosition | null;
  selections: SelectionRange[];
  isEditing: boolean;
  editValue: string;
  editingCell: CellPosition | null;
  setSelectedCell: (pos: CellPosition | null) => void;
  addSelection: (range: SelectionRange) => void;
  clearSelections: () => void;
  setSelections: (ranges: SelectionRange[]) => void;
  startEditing: (cell: CellPosition, initialValue: string) => void;
  setEditValue: (value: string) => void;
  commitEdit: () => void;
  cancelEdit: () => void;
}

export const useUIStore = create<UIState>()(
  immer((set) => ({
    selectedCell: null,
    selections: [],
    isEditing: false,
    editValue: "",
    editingCell: null,

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
      });
    },

    setEditValue: (value: string) => {
      set((state) => {
        state.editValue = value;
      });
    },

    commitEdit: () => {
      set((state) => {
        state.isEditing = false;
        state.editingCell = null;
        state.editValue = "";
      });
    },

    cancelEdit: () => {
      set((state) => {
        state.isEditing = false;
        state.editingCell = null;
        state.editValue = "";
      });
    },
  })),
);
