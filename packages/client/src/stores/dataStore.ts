import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { GroupRange, ProtectedRange, SlicerConfig } from "../types/grid";

interface DataState {
  // Row/Column grouping: Map<sheetId, GroupRange[]>
  rowGroups: Map<string, GroupRange[]>;
  colGroups: Map<string, GroupRange[]>;

  // Protected ranges: Map<sheetId, ProtectedRange[]>
  protectedRanges: Map<string, ProtectedRange[]>;

  // Slicers
  slicers: Map<string, SlicerConfig>;

  // Row grouping
  addRowGroup: (sheetId: string, start: number, end: number) => void;
  removeRowGroup: (sheetId: string, start: number) => void;
  toggleRowGroup: (sheetId: string, start: number) => void;
  getRowGroups: (sheetId: string) => GroupRange[];

  // Column grouping
  addColGroup: (sheetId: string, start: number, end: number) => void;
  removeColGroup: (sheetId: string, start: number) => void;
  toggleColGroup: (sheetId: string, start: number) => void;
  getColGroups: (sheetId: string) => GroupRange[];

  // Protected ranges
  addProtectedRange: (range: ProtectedRange) => void;
  removeProtectedRange: (sheetId: string, id: string) => void;
  getProtectedRanges: (sheetId: string) => ProtectedRange[];
  isCellProtected: (sheetId: string, row: number, col: number) => boolean;

  // Slicers
  addSlicer: (slicer: SlicerConfig) => void;
  removeSlicer: (id: string) => void;
  updateSlicerSelection: (id: string, selectedValues: Set<string>) => void;
  getSlicer: (id: string) => SlicerConfig | undefined;
  getSlicersForSheet: (sheetId: string) => SlicerConfig[];
}

export const useDataStore = create<DataState>()(
  immer((set, get) => ({
    rowGroups: new Map<string, GroupRange[]>(),
    colGroups: new Map<string, GroupRange[]>(),
    protectedRanges: new Map<string, ProtectedRange[]>(),
    slicers: new Map<string, SlicerConfig>(),

    // Row grouping
    addRowGroup: (sheetId: string, start: number, end: number) => {
      set((state) => {
        if (!state.rowGroups.has(sheetId)) {
          state.rowGroups.set(sheetId, []);
        }
        state.rowGroups.get(sheetId)!.push({ start, end, collapsed: false });
      });
    },

    removeRowGroup: (sheetId: string, start: number) => {
      set((state) => {
        const groups = state.rowGroups.get(sheetId);
        if (!groups) return;
        const idx = groups.findIndex((g) => g.start === start);
        if (idx >= 0) groups.splice(idx, 1);
      });
    },

    toggleRowGroup: (sheetId: string, start: number) => {
      set((state) => {
        const groups = state.rowGroups.get(sheetId);
        if (!groups) return;
        const group = groups.find((g) => g.start === start);
        if (group) group.collapsed = !group.collapsed;
      });
    },

    getRowGroups: (sheetId: string) => {
      return get().rowGroups.get(sheetId) ?? [];
    },

    // Column grouping
    addColGroup: (sheetId: string, start: number, end: number) => {
      set((state) => {
        if (!state.colGroups.has(sheetId)) {
          state.colGroups.set(sheetId, []);
        }
        state.colGroups.get(sheetId)!.push({ start, end, collapsed: false });
      });
    },

    removeColGroup: (sheetId: string, start: number) => {
      set((state) => {
        const groups = state.colGroups.get(sheetId);
        if (!groups) return;
        const idx = groups.findIndex((g) => g.start === start);
        if (idx >= 0) groups.splice(idx, 1);
      });
    },

    toggleColGroup: (sheetId: string, start: number) => {
      set((state) => {
        const groups = state.colGroups.get(sheetId);
        if (!groups) return;
        const group = groups.find((g) => g.start === start);
        if (group) group.collapsed = !group.collapsed;
      });
    },

    getColGroups: (sheetId: string) => {
      return get().colGroups.get(sheetId) ?? [];
    },

    // Protected ranges
    addProtectedRange: (range: ProtectedRange) => {
      set((state) => {
        if (!state.protectedRanges.has(range.sheetId)) {
          state.protectedRanges.set(range.sheetId, []);
        }
        state.protectedRanges.get(range.sheetId)!.push(range);
      });
    },

    removeProtectedRange: (sheetId: string, id: string) => {
      set((state) => {
        const ranges = state.protectedRanges.get(sheetId);
        if (!ranges) return;
        const idx = ranges.findIndex((r) => r.id === id);
        if (idx >= 0) ranges.splice(idx, 1);
      });
    },

    getProtectedRanges: (sheetId: string) => {
      return get().protectedRanges.get(sheetId) ?? [];
    },

    isCellProtected: (sheetId: string, row: number, col: number) => {
      const ranges = get().protectedRanges.get(sheetId);
      if (!ranges) return false;
      return ranges.some(
        (r) =>
          row >= r.startRow &&
          row <= r.endRow &&
          col >= r.startCol &&
          col <= r.endCol,
      );
    },

    // Slicers
    addSlicer: (slicer: SlicerConfig) => {
      set((state) => {
        state.slicers.set(slicer.id, slicer);
      });
    },

    removeSlicer: (id: string) => {
      set((state) => {
        state.slicers.delete(id);
      });
    },

    updateSlicerSelection: (id: string, selectedValues: Set<string>) => {
      set((state) => {
        const slicer = state.slicers.get(id);
        if (slicer) slicer.selectedValues = selectedValues;
      });
    },

    getSlicer: (id: string) => {
      return get().slicers.get(id);
    },

    getSlicersForSheet: (sheetId: string) => {
      return Array.from(get().slicers.values()).filter(
        (s) => s.sheetId === sheetId,
      );
    },
  })),
);
