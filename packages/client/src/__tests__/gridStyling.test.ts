import { describe, it, expect, beforeEach } from "vitest";
import { useGridStore } from "../stores/gridStore";

describe("Grid styling matches Google Sheets", () => {
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

  it("default row height is 21px to match Google Sheets", () => {
    const gs = useGridStore.getState();
    expect(gs.defaultRowHeight).toBe(21);
  });

  it("default column width is 100px to match Google Sheets", () => {
    const gs = useGridStore.getState();
    expect(gs.defaultColWidth).toBe(100);
  });

  it("getRowY calculates correctly with 21px default row height", () => {
    const gs = useGridStore.getState();
    expect(gs.getRowY(0)).toBe(0);
    expect(gs.getRowY(1)).toBe(21);
    expect(gs.getRowY(10)).toBe(210);
  });

  it("getRowHeight returns 21px for rows without custom height", () => {
    const gs = useGridStore.getState();
    expect(gs.getRowHeight(0)).toBe(21);
    expect(gs.getRowHeight(50)).toBe(21);
  });

  it("getColumnWidth returns 100px for columns without custom width", () => {
    const gs = useGridStore.getState();
    expect(gs.getColumnWidth(0)).toBe(100);
    expect(gs.getColumnWidth(25)).toBe(100);
  });
});
