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
  hiddenRows: Set<number>;
  hiddenCols: Set<number>;
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
  setFrozenRows: (count: number) => void;
  setFrozenCols: (count: number) => void;
  hideRows: (rows: number[]) => void;
  unhideRows: (rows: number[]) => void;
  hideCols: (cols: number[]) => void;
  unhideCols: (cols: number[]) => void;
  setTotalRows: (count: number) => void;
  setTotalCols: (count: number) => void;
  insertRowHeights: (atRow: number, count: number) => void;
  deleteRowHeights: (rows: number[]) => void;
  insertColWidths: (atCol: number, count: number) => void;
  deleteColWidths: (cols: number[]) => void;
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
    hiddenRows: new Set<number>(),
    hiddenCols: new Set<number>(),
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

    setFrozenRows: (count: number) => {
      set((state) => {
        state.frozenRows = count;
      });
    },

    setFrozenCols: (count: number) => {
      set((state) => {
        state.frozenCols = count;
      });
    },

    hideRows: (rows: number[]) => {
      set((state) => {
        for (const r of rows) {
          state.hiddenRows.add(r);
        }
      });
    },

    unhideRows: (rows: number[]) => {
      set((state) => {
        for (const r of rows) {
          state.hiddenRows.delete(r);
        }
      });
    },

    hideCols: (cols: number[]) => {
      set((state) => {
        for (const c of cols) {
          state.hiddenCols.add(c);
        }
      });
    },

    unhideCols: (cols: number[]) => {
      set((state) => {
        for (const c of cols) {
          state.hiddenCols.delete(c);
        }
      });
    },

    setTotalRows: (count: number) => {
      set((state) => {
        state.totalRows = count;
      });
    },

    setTotalCols: (count: number) => {
      set((state) => {
        state.totalCols = count;
      });
    },

    insertRowHeights: (atRow: number, count: number) => {
      set((state) => {
        const newMap = new Map<number, number>();
        for (const [r, h] of state.rowHeights) {
          if (r >= atRow) {
            newMap.set(r + count, h);
          } else {
            newMap.set(r, h);
          }
        }
        state.rowHeights = newMap;
      });
    },

    deleteRowHeights: (rows: number[]) => {
      set((state) => {
        const sorted = [...rows].sort((a, b) => a - b);
        const rowSet = new Set(sorted);
        const newMap = new Map<number, number>();
        for (const [r, h] of state.rowHeights) {
          if (rowSet.has(r)) continue;
          let offset = 0;
          for (const dr of sorted) {
            if (dr < r) offset++;
          }
          newMap.set(r - offset, h);
        }
        state.rowHeights = newMap;
      });
    },

    insertColWidths: (atCol: number, count: number) => {
      set((state) => {
        const newMap = new Map<number, number>();
        for (const [c, w] of state.columnWidths) {
          if (c >= atCol) {
            newMap.set(c + count, w);
          } else {
            newMap.set(c, w);
          }
        }
        state.columnWidths = newMap;
      });
    },

    deleteColWidths: (cols: number[]) => {
      set((state) => {
        const sorted = [...cols].sort((a, b) => a - b);
        const colSet = new Set(sorted);
        const newMap = new Map<number, number>();
        for (const [c, w] of state.columnWidths) {
          if (colSet.has(c)) continue;
          let offset = 0;
          for (const dc of sorted) {
            if (dc < c) offset++;
          }
          newMap.set(c - offset, w);
        }
        state.columnWidths = newMap;
      });
    },
  })),
);
