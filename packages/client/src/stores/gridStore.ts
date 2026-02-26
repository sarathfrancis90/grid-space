import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const DEFAULT_COL_WIDTH = 100;
const DEFAULT_ROW_HEIGHT = 25;
const ROW_HEADER_WIDTH = 50;
const COL_HEADER_HEIGHT = 25;

interface GridState {
  scrollTop: number;
  scrollLeft: number;
  viewportWidth: number;
  viewportHeight: number;
  frozenRows: number;
  frozenCols: number;
  columnWidths: Map<number, number>;
  rowHeights: Map<number, number>;
  totalRows: number;
  totalCols: number;
  rowHeaderWidth: number;
  colHeaderHeight: number;
  defaultColWidth: number;
  defaultRowHeight: number;
  getColumnWidth: (col: number) => number;
  getRowHeight: (row: number) => number;
  setColumnWidth: (col: number, width: number) => void;
  setRowHeight: (row: number, height: number) => void;
  setScroll: (top: number, left: number) => void;
  setViewportSize: (width: number, height: number) => void;
  getColumnX: (col: number) => number;
  getRowY: (row: number) => number;
  getColAtX: (x: number) => number;
  getRowAtY: (y: number) => number;
}

export const useGridStore = create<GridState>()(
  immer((set, get) => ({
    scrollTop: 0,
    scrollLeft: 0,
    viewportWidth: 0,
    viewportHeight: 0,
    frozenRows: 0,
    frozenCols: 0,
    columnWidths: new Map<number, number>(),
    rowHeights: new Map<number, number>(),
    totalRows: 1000,
    totalCols: 26,
    rowHeaderWidth: ROW_HEADER_WIDTH,
    colHeaderHeight: COL_HEADER_HEIGHT,
    defaultColWidth: DEFAULT_COL_WIDTH,
    defaultRowHeight: DEFAULT_ROW_HEIGHT,

    getColumnWidth: (col: number) => {
      return get().columnWidths.get(col) ?? DEFAULT_COL_WIDTH;
    },

    getRowHeight: (row: number) => {
      return get().rowHeights.get(row) ?? DEFAULT_ROW_HEIGHT;
    },

    setColumnWidth: (col: number, width: number) => {
      set((state) => {
        state.columnWidths.set(col, width);
      });
    },

    setRowHeight: (row: number, height: number) => {
      set((state) => {
        state.rowHeights.set(row, height);
      });
    },

    setScroll: (top: number, left: number) => {
      set((state) => {
        state.scrollTop = top;
        state.scrollLeft = left;
      });
    },

    setViewportSize: (width: number, height: number) => {
      set((state) => {
        state.viewportWidth = width;
        state.viewportHeight = height;
      });
    },

    getColumnX: (col: number) => {
      const state = get();
      let x = 0;
      for (let c = 0; c < col; c++) {
        x += state.columnWidths.get(c) ?? DEFAULT_COL_WIDTH;
      }
      return x;
    },

    getRowY: (row: number) => {
      const state = get();
      let y = 0;
      for (let r = 0; r < row; r++) {
        y += state.rowHeights.get(r) ?? DEFAULT_ROW_HEIGHT;
      }
      return y;
    },

    getColAtX: (x: number) => {
      const state = get();
      let accum = 0;
      for (let c = 0; c < state.totalCols; c++) {
        accum += state.columnWidths.get(c) ?? DEFAULT_COL_WIDTH;
        if (accum > x) return c;
      }
      return state.totalCols - 1;
    },

    getRowAtY: (y: number) => {
      const state = get();
      let accum = 0;
      for (let r = 0; r < state.totalRows; r++) {
        accum += state.rowHeights.get(r) ?? DEFAULT_ROW_HEIGHT;
        if (accum > y) return r;
      }
      return state.totalRows - 1;
    },
  })),
);
