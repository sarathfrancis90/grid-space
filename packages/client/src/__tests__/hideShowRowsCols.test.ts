import { describe, it, expect, beforeEach } from "vitest";
import { useGridStore } from "../stores/gridStore";
import { useUIStore } from "../stores/uiStore";

describe("Hide/Show Rows and Columns", () => {
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
    useUIStore.setState({
      selectedCell: { row: 0, col: 0 },
      selections: [{ start: { row: 0, col: 0 }, end: { row: 0, col: 0 } }],
    });
  });

  describe("hideRows", () => {
    it("hides a single row", () => {
      const gs = useGridStore.getState();
      gs.hideRows([2]);
      expect(useGridStore.getState().hiddenRows.has(2)).toBe(true);
      expect(useGridStore.getState().hiddenRows.size).toBe(1);
    });

    it("hides multiple rows", () => {
      const gs = useGridStore.getState();
      gs.hideRows([1, 2, 3]);
      const state = useGridStore.getState();
      expect(state.hiddenRows.has(1)).toBe(true);
      expect(state.hiddenRows.has(2)).toBe(true);
      expect(state.hiddenRows.has(3)).toBe(true);
      expect(state.hiddenRows.size).toBe(3);
    });

    it("hidden rows are excluded from Y coordinate calculation", () => {
      const gs = useGridStore.getState();
      const defaultHeight = gs.defaultRowHeight;
      gs.hideRows([1, 2]);
      const updated = useGridStore.getState();
      // Row 3 should appear at position of row 1 (rows 1,2 hidden)
      expect(updated.getRowY(3)).toBe(defaultHeight); // only row 0 counted
    });
  });

  describe("unhideRows", () => {
    it("unhides a single row", () => {
      const gs = useGridStore.getState();
      gs.hideRows([2, 3]);
      gs.unhideRows([2]);
      const state = useGridStore.getState();
      expect(state.hiddenRows.has(2)).toBe(false);
      expect(state.hiddenRows.has(3)).toBe(true);
    });

    it("unhides all rows", () => {
      const gs = useGridStore.getState();
      gs.hideRows([0, 1, 2, 3, 4]);
      gs.unhideRows([0, 1, 2, 3, 4]);
      expect(useGridStore.getState().hiddenRows.size).toBe(0);
    });
  });

  describe("hideCols", () => {
    it("hides a single column", () => {
      const gs = useGridStore.getState();
      gs.hideCols([1]);
      expect(useGridStore.getState().hiddenCols.has(1)).toBe(true);
      expect(useGridStore.getState().hiddenCols.size).toBe(1);
    });

    it("hides multiple columns", () => {
      const gs = useGridStore.getState();
      gs.hideCols([0, 1, 2]);
      const state = useGridStore.getState();
      expect(state.hiddenCols.has(0)).toBe(true);
      expect(state.hiddenCols.has(1)).toBe(true);
      expect(state.hiddenCols.has(2)).toBe(true);
      expect(state.hiddenCols.size).toBe(3);
    });

    it("hidden cols are excluded from X coordinate calculation", () => {
      const gs = useGridStore.getState();
      const defaultWidth = gs.defaultColWidth;
      gs.hideCols([1, 2]);
      const updated = useGridStore.getState();
      // Col 3 should appear at position of col 1 (cols 1,2 hidden)
      expect(updated.getColumnX(3)).toBe(defaultWidth); // only col 0 counted
    });
  });

  describe("unhideCols", () => {
    it("unhides a single column", () => {
      const gs = useGridStore.getState();
      gs.hideCols([1, 2]);
      gs.unhideCols([1]);
      const state = useGridStore.getState();
      expect(state.hiddenCols.has(1)).toBe(false);
      expect(state.hiddenCols.has(2)).toBe(true);
    });

    it("unhides all columns", () => {
      const gs = useGridStore.getState();
      gs.hideCols([0, 1, 2]);
      gs.unhideCols([0, 1, 2]);
      expect(useGridStore.getState().hiddenCols.size).toBe(0);
    });
  });

  describe("getRowAtY with hidden rows", () => {
    it("maps Y position correctly when rows are hidden", () => {
      const gs = useGridStore.getState();
      const defaultHeight = gs.defaultRowHeight;
      gs.hideRows([1]);
      const updated = useGridStore.getState();
      // Y at defaultHeight * 0.5 should be row 0
      expect(updated.getRowAtY(defaultHeight * 0.5)).toBe(0);
      // Y at defaultHeight * 1.5 should be row 2 (row 1 is hidden)
      expect(updated.getRowAtY(defaultHeight * 1.5)).toBe(2);
    });
  });

  describe("getColAtX with hidden cols", () => {
    it("maps X position correctly when cols are hidden", () => {
      const gs = useGridStore.getState();
      const defaultWidth = gs.defaultColWidth;
      gs.hideCols([1]);
      const updated = useGridStore.getState();
      // X at defaultWidth * 0.5 should be col 0
      expect(updated.getColAtX(defaultWidth * 0.5)).toBe(0);
      // X at defaultWidth * 1.5 should be col 2 (col 1 is hidden)
      expect(updated.getColAtX(defaultWidth * 1.5)).toBe(2);
    });
  });

  describe("scroll dimensions with hidden rows/cols", () => {
    it("does not count hidden rows in total height", () => {
      const gs = useGridStore.getState();
      const totalVisibleBefore = gs.getRowY(gs.totalRows);
      gs.hideRows([0, 1, 2]);
      const updated = useGridStore.getState();
      const totalVisibleAfter = updated.getRowY(updated.totalRows);
      expect(totalVisibleAfter).toBe(
        totalVisibleBefore - 3 * gs.defaultRowHeight,
      );
    });

    it("does not count hidden cols in total width", () => {
      const gs = useGridStore.getState();
      const totalVisibleBefore = gs.getColumnX(gs.totalCols);
      gs.hideCols([0, 1]);
      const updated = useGridStore.getState();
      const totalVisibleAfter = updated.getColumnX(updated.totalCols);
      expect(totalVisibleAfter).toBe(
        totalVisibleBefore - 2 * gs.defaultColWidth,
      );
    });
  });
});
