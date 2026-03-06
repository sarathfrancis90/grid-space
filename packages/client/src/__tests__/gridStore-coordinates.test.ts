import { describe, it, expect, beforeEach } from "vitest";
import { useGridStore } from "../stores/gridStore";

describe("gridStore coordinate functions with hidden rows/cols", () => {
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

  describe("getRowY", () => {
    it("returns correct Y for visible rows with no hidden rows", () => {
      const gs = useGridStore.getState();
      // Default row height is 25
      expect(gs.getRowY(0)).toBe(0);
      expect(gs.getRowY(1)).toBe(25);
      expect(gs.getRowY(5)).toBe(125);
    });

    it("skips hidden rows when calculating Y position", () => {
      useGridStore.setState({ hiddenRows: new Set([1, 2]) });
      const gs = useGridStore.getState();
      // Row 0: 25px, rows 1-2 hidden
      // getRowY(3) should be 25 (only row 0 counts)
      expect(gs.getRowY(0)).toBe(0);
      expect(gs.getRowY(1)).toBe(25); // row 0 height
      expect(gs.getRowY(2)).toBe(25); // row 0 height (row 1 skipped)
      expect(gs.getRowY(3)).toBe(25); // rows 1,2 both hidden, only row 0 counted
      expect(gs.getRowY(4)).toBe(50); // row 0 + row 3
    });

    it("handles custom row heights with hidden rows", () => {
      useGridStore.setState({
        hiddenRows: new Set([1]),
        rowHeights: new Map([
          [0, 40],
          [1, 30],
          [2, 50],
        ]),
      });
      const gs = useGridStore.getState();
      expect(gs.getRowY(0)).toBe(0);
      expect(gs.getRowY(1)).toBe(40); // row 0 = 40px
      expect(gs.getRowY(2)).toBe(40); // row 1 hidden, still 40px
      expect(gs.getRowY(3)).toBe(90); // row 0 (40) + row 2 (50)
    });
  });

  describe("getColumnX", () => {
    it("returns correct X for visible columns with no hidden cols", () => {
      const gs = useGridStore.getState();
      // Default col width is 100
      expect(gs.getColumnX(0)).toBe(0);
      expect(gs.getColumnX(1)).toBe(100);
      expect(gs.getColumnX(3)).toBe(300);
    });

    it("skips hidden columns when calculating X position", () => {
      useGridStore.setState({ hiddenCols: new Set([1]) });
      const gs = useGridStore.getState();
      expect(gs.getColumnX(0)).toBe(0);
      expect(gs.getColumnX(1)).toBe(100); // col 0 width
      expect(gs.getColumnX(2)).toBe(100); // col 1 hidden, only col 0 counted
      expect(gs.getColumnX(3)).toBe(200); // col 0 + col 2
    });
  });

  describe("getRowAtY", () => {
    it("returns correct row for Y position with no hidden rows", () => {
      const gs = useGridStore.getState();
      expect(gs.getRowAtY(0)).toBe(0);
      expect(gs.getRowAtY(12)).toBe(0); // within first row (25px)
      expect(gs.getRowAtY(25)).toBe(1); // start of second row
      expect(gs.getRowAtY(49)).toBe(1);
      expect(gs.getRowAtY(50)).toBe(2);
    });

    it("skips hidden rows and maps to correct visible row", () => {
      useGridStore.setState({ hiddenRows: new Set([1, 2]) });
      const gs = useGridStore.getState();
      // Row 0: 0-25px, rows 1-2 hidden, row 3: 25-50px
      expect(gs.getRowAtY(0)).toBe(0);
      expect(gs.getRowAtY(24)).toBe(0);
      expect(gs.getRowAtY(25)).toBe(3); // skips rows 1 and 2
      expect(gs.getRowAtY(49)).toBe(3);
      expect(gs.getRowAtY(50)).toBe(4);
    });

    it("handles click at boundary between visible rows after hidden rows", () => {
      useGridStore.setState({ hiddenRows: new Set([0]) });
      const gs = useGridStore.getState();
      // Row 0 hidden, row 1 starts at y=0
      expect(gs.getRowAtY(0)).toBe(1);
      expect(gs.getRowAtY(24)).toBe(1);
      expect(gs.getRowAtY(25)).toBe(2);
    });
  });

  describe("getColAtX", () => {
    it("returns correct column for X position with no hidden cols", () => {
      const gs = useGridStore.getState();
      expect(gs.getColAtX(0)).toBe(0);
      expect(gs.getColAtX(50)).toBe(0);
      expect(gs.getColAtX(100)).toBe(1);
      expect(gs.getColAtX(200)).toBe(2);
    });

    it("skips hidden columns and maps to correct visible column", () => {
      useGridStore.setState({ hiddenCols: new Set([1]) });
      const gs = useGridStore.getState();
      // Col 0: 0-100px, col 1 hidden, col 2: 100-200px
      expect(gs.getColAtX(0)).toBe(0);
      expect(gs.getColAtX(99)).toBe(0);
      expect(gs.getColAtX(100)).toBe(2); // skips col 1
      expect(gs.getColAtX(199)).toBe(2);
      expect(gs.getColAtX(200)).toBe(3);
    });
  });

  describe("coordinate consistency", () => {
    it("getRowAtY is inverse of getRowY for visible rows", () => {
      useGridStore.setState({ hiddenRows: new Set([2, 5, 6]) });
      const gs = useGridStore.getState();
      // For each visible row, getRowAtY(getRowY(r)) should return r
      const visibleRows = [0, 1, 3, 4, 7, 8, 9];
      for (const r of visibleRows) {
        const y = gs.getRowY(r);
        expect(gs.getRowAtY(y)).toBe(r);
      }
    });

    it("getColAtX is inverse of getColumnX for visible cols", () => {
      useGridStore.setState({ hiddenCols: new Set([1, 3]) });
      const gs = useGridStore.getState();
      const visibleCols = [0, 2, 4, 5];
      for (const c of visibleCols) {
        const x = gs.getColumnX(c);
        expect(gs.getColAtX(x)).toBe(c);
      }
    });
  });
});
