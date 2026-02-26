import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { NamedRange, CellPosition } from "../types/grid";

interface NamedRangeState {
  ranges: Map<string, NamedRange>;

  addRange: (range: NamedRange) => void;
  removeRange: (name: string) => void;
  updateRange: (
    name: string,
    updates: Partial<Omit<NamedRange, "name">>,
  ) => void;
  getRange: (name: string) => NamedRange | undefined;
  getAllRanges: () => NamedRange[];
  getRangesForSheet: (sheetId: string) => NamedRange[];
  resolveRange: (name: string) => {
    sheetId: string;
    start: CellPosition;
    end: CellPosition;
  } | null;
}

export const useNamedRangeStore = create<NamedRangeState>()(
  immer((set, get) => ({
    ranges: new Map<string, NamedRange>(),

    addRange: (range: NamedRange) => {
      set((state) => {
        state.ranges.set(range.name, range);
      });
    },

    removeRange: (name: string) => {
      set((state) => {
        state.ranges.delete(name);
      });
    },

    updateRange: (name: string, updates: Partial<Omit<NamedRange, "name">>) => {
      set((state) => {
        const existing = state.ranges.get(name);
        if (!existing) return;
        if (updates.sheetId !== undefined) existing.sheetId = updates.sheetId;
        if (updates.startRow !== undefined)
          existing.startRow = updates.startRow;
        if (updates.startCol !== undefined)
          existing.startCol = updates.startCol;
        if (updates.endRow !== undefined) existing.endRow = updates.endRow;
        if (updates.endCol !== undefined) existing.endCol = updates.endCol;
      });
    },

    getRange: (name: string) => {
      return get().ranges.get(name);
    },

    getAllRanges: () => {
      return Array.from(get().ranges.values());
    },

    getRangesForSheet: (sheetId: string) => {
      return Array.from(get().ranges.values()).filter(
        (r) => r.sheetId === sheetId,
      );
    },

    resolveRange: (name: string) => {
      const range = get().ranges.get(name);
      if (!range) return null;
      return {
        sheetId: range.sheetId,
        start: { row: range.startRow, col: range.startCol },
        end: { row: range.endRow, col: range.endCol },
      };
    },
  })),
);
