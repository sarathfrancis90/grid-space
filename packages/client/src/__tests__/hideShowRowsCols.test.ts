import { describe, it, expect, beforeEach } from "vitest";
import { useGridStore } from "../stores/gridStore";

describe("hide/show rows and columns", () => {
  beforeEach(() => {
    useGridStore.setState({
      totalRows: 100,
      totalCols: 26,
      columnWidths: new Map(),
      rowHeights: new Map(),
      hiddenRows: new Set(),
      hiddenCols: new Set(),
      scrollTop: 0,
      scrollLeft: 0,
    });
  });

  describe("hideRows", () => {
    it("hides specified rows", () => {
      const gs = useGridStore.getState();
      gs.hideRows([2, 5, 8]);
      const state = useGridStore.getState();
      expect(state.hiddenRows.has(2)).toBe(true);
      expect(state.hiddenRows.has(5)).toBe(true);
      expect(state.hiddenRows.has(8)).toBe(true);
      expect(state.hiddenRows.size).toBe(3);
    });

    it("accumulates hidden rows across multiple calls", () => {
      const gs = useGridStore.getState();
      gs.hideRows([1]);
      gs.hideRows([3]);
      const state = useGridStore.getState();
      expect(state.hiddenRows.has(1)).toBe(true);
      expect(state.hiddenRows.has(3)).toBe(true);
      expect(state.hiddenRows.size).toBe(2);
    });

    it("hidden rows have zero effective height in getRowY", () => {
      useGridStore.getState().hideRows([1, 2]);
      const gs = useGridStore.getState();
      // Row 0 = 21px, rows 1-2 hidden, row 3 starts at 21px
      expect(gs.getRowY(3)).toBe(21);
    });
  });

  describe("unhideRows", () => {
    it("unhides specified rows", () => {
      useGridStore.getState().hideRows([1, 2, 3]);
      useGridStore.getState().unhideRows([2]);
      const state = useGridStore.getState();
      expect(state.hiddenRows.has(1)).toBe(true);
      expect(state.hiddenRows.has(2)).toBe(false);
      expect(state.hiddenRows.has(3)).toBe(true);
    });

    it("unhide all rows clears the set", () => {
      useGridStore.getState().hideRows([0, 1, 2, 3, 4]);
      const gs = useGridStore.getState();
      gs.unhideRows(Array.from(gs.hiddenRows));
      expect(useGridStore.getState().hiddenRows.size).toBe(0);
    });
  });

  describe("hideCols", () => {
    it("hides specified columns", () => {
      useGridStore.getState().hideCols([0, 3]);
      const state = useGridStore.getState();
      expect(state.hiddenCols.has(0)).toBe(true);
      expect(state.hiddenCols.has(3)).toBe(true);
      expect(state.hiddenCols.size).toBe(2);
    });

    it("hidden columns have zero effective width in getColumnX", () => {
      useGridStore.getState().hideCols([0]); // col 0 hidden (100px default)
      const gs = useGridStore.getState();
      // Col 1 should start at 0 since col 0 is hidden
      expect(gs.getColumnX(1)).toBe(0);
    });
  });

  describe("unhideCols", () => {
    it("unhides specified columns", () => {
      useGridStore.getState().hideCols([1, 2, 3]);
      useGridStore.getState().unhideCols([2]);
      const state = useGridStore.getState();
      expect(state.hiddenCols.has(1)).toBe(true);
      expect(state.hiddenCols.has(2)).toBe(false);
      expect(state.hiddenCols.has(3)).toBe(true);
    });

    it("unhide all columns clears the set", () => {
      useGridStore.getState().hideCols([0, 1, 2]);
      const gs = useGridStore.getState();
      gs.unhideCols(Array.from(gs.hiddenCols));
      expect(useGridStore.getState().hiddenCols.size).toBe(0);
    });
  });

  describe("getRowAtY with hidden rows", () => {
    it("skips hidden rows when mapping Y to row index", () => {
      useGridStore.getState().hideRows([1, 2]);
      const gs = useGridStore.getState();
      // Y=0 → row 0, Y=21 → row 3 (rows 1,2 skipped)
      expect(gs.getRowAtY(0)).toBe(0);
      expect(gs.getRowAtY(22)).toBe(3);
    });
  });

  describe("getColAtX with hidden columns", () => {
    it("skips hidden columns when mapping X to col index", () => {
      useGridStore.getState().hideCols([0]);
      const gs = useGridStore.getState();
      // X=0 → col 1 (col 0 hidden)
      expect(gs.getColAtX(0)).toBe(1);
    });
  });
});
