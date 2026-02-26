import { describe, it, expect, beforeEach } from "vitest";
import { useCellStore } from "../stores/cellStore";
import { useGridStore } from "../stores/gridStore";

describe("cellStore row/col operations", () => {
  beforeEach(() => {
    useCellStore.setState({ cells: new Map() });
    useGridStore.setState({
      totalRows: 100,
      totalCols: 26,
      columnWidths: new Map(),
      rowHeights: new Map(),
      hiddenRows: new Set(),
      hiddenCols: new Set(),
    });
  });

  describe("insertRows", () => {
    it("shifts cells down when inserting a row", () => {
      useCellStore.getState().setCell("s1", 0, 0, { value: "row0" });
      useCellStore.getState().setCell("s1", 1, 0, { value: "row1" });
      useCellStore.getState().setCell("s1", 2, 0, { value: "row2" });

      useCellStore.getState().insertRows("s1", 1, 1, 100);

      expect(useCellStore.getState().getCell("s1", 0, 0)?.value).toBe("row0");
      expect(useCellStore.getState().getCell("s1", 2, 0)?.value).toBe("row1");
      expect(useCellStore.getState().getCell("s1", 3, 0)?.value).toBe("row2");
      expect(useCellStore.getState().getCell("s1", 1, 0)).toBeUndefined();
    });
  });

  describe("deleteRows", () => {
    it("removes row and shifts cells up", () => {
      useCellStore.getState().setCell("s1", 0, 0, { value: "row0" });
      useCellStore.getState().setCell("s1", 1, 0, { value: "row1" });
      useCellStore.getState().setCell("s1", 2, 0, { value: "row2" });

      useCellStore.getState().deleteRows("s1", [1], 100);

      expect(useCellStore.getState().getCell("s1", 0, 0)?.value).toBe("row0");
      expect(useCellStore.getState().getCell("s1", 1, 0)?.value).toBe("row2");
    });
  });

  describe("insertCols", () => {
    it("shifts cells right when inserting a column", () => {
      useCellStore.getState().setCell("s1", 0, 0, { value: "col0" });
      useCellStore.getState().setCell("s1", 0, 1, { value: "col1" });
      useCellStore.getState().setCell("s1", 0, 2, { value: "col2" });

      useCellStore.getState().insertCols("s1", 1, 1, 26);

      expect(useCellStore.getState().getCell("s1", 0, 0)?.value).toBe("col0");
      expect(useCellStore.getState().getCell("s1", 0, 2)?.value).toBe("col1");
      expect(useCellStore.getState().getCell("s1", 0, 3)?.value).toBe("col2");
    });
  });

  describe("deleteCols", () => {
    it("removes column and shifts cells left", () => {
      useCellStore.getState().setCell("s1", 0, 0, { value: "col0" });
      useCellStore.getState().setCell("s1", 0, 1, { value: "col1" });
      useCellStore.getState().setCell("s1", 0, 2, { value: "col2" });

      useCellStore.getState().deleteCols("s1", [1], 26);

      expect(useCellStore.getState().getCell("s1", 0, 0)?.value).toBe("col0");
      expect(useCellStore.getState().getCell("s1", 0, 1)?.value).toBe("col2");
    });
  });

  describe("clearRange", () => {
    it("clears cells in range", () => {
      useCellStore.getState().setCell("s1", 0, 0, { value: "A" });
      useCellStore.getState().setCell("s1", 0, 1, { value: "B" });
      useCellStore.getState().setCell("s1", 1, 0, { value: "C" });
      useCellStore.getState().setCell("s1", 1, 1, { value: "D" });
      useCellStore.getState().setCell("s1", 2, 2, { value: "E" });

      useCellStore.getState().clearRange("s1", 0, 0, 1, 1);

      expect(useCellStore.getState().getCell("s1", 0, 0)).toBeUndefined();
      expect(useCellStore.getState().getCell("s1", 0, 1)).toBeUndefined();
      expect(useCellStore.getState().getCell("s1", 1, 0)).toBeUndefined();
      expect(useCellStore.getState().getCell("s1", 1, 1)).toBeUndefined();
      expect(useCellStore.getState().getCell("s1", 2, 2)?.value).toBe("E");
    });
  });

  describe("getCellsInRangeWithKeys", () => {
    it("returns cells with their keys", () => {
      useCellStore.getState().setCell("s1", 0, 0, { value: "A" });
      useCellStore.getState().setCell("s1", 0, 1, { value: "B" });
      const result = useCellStore
        .getState()
        .getCellsInRangeWithKeys("s1", 0, 0, 0, 1);
      expect(result.size).toBe(2);
      expect(result.get("0,0")?.value).toBe("A");
      expect(result.get("0,1")?.value).toBe("B");
    });
  });

  describe("getLastDataPosition", () => {
    it("returns max row/col with data", () => {
      useCellStore.getState().setCell("s1", 0, 0, { value: "A" });
      useCellStore.getState().setCell("s1", 5, 3, { value: "B" });
      useCellStore.getState().setCell("s1", 2, 8, { value: "C" });

      const last = useCellStore.getState().getLastDataPosition("s1");
      expect(last.row).toBe(5);
      expect(last.col).toBe(8);
    });

    it("returns 0,0 for empty sheet", () => {
      const last = useCellStore.getState().getLastDataPosition("s1");
      expect(last.row).toBe(0);
      expect(last.col).toBe(0);
    });
  });
});

describe("gridStore hide/unhide/freeze", () => {
  beforeEach(() => {
    useGridStore.setState({
      hiddenRows: new Set(),
      hiddenCols: new Set(),
      frozenRows: 0,
      frozenCols: 0,
    });
  });

  it("hides and unhides rows", () => {
    useGridStore.getState().hideRows([2, 3]);
    expect(useGridStore.getState().hiddenRows.has(2)).toBe(true);
    expect(useGridStore.getState().hiddenRows.has(3)).toBe(true);

    useGridStore.getState().unhideRows([2]);
    expect(useGridStore.getState().hiddenRows.has(2)).toBe(false);
    expect(useGridStore.getState().hiddenRows.has(3)).toBe(true);
  });

  it("hides and unhides columns", () => {
    useGridStore.getState().hideCols([1, 5]);
    expect(useGridStore.getState().hiddenCols.has(1)).toBe(true);
    expect(useGridStore.getState().hiddenCols.has(5)).toBe(true);

    useGridStore.getState().unhideCols([5]);
    expect(useGridStore.getState().hiddenCols.has(1)).toBe(true);
    expect(useGridStore.getState().hiddenCols.has(5)).toBe(false);
  });

  it("sets frozen rows", () => {
    useGridStore.getState().setFrozenRows(3);
    expect(useGridStore.getState().frozenRows).toBe(3);
  });

  it("sets frozen cols", () => {
    useGridStore.getState().setFrozenCols(2);
    expect(useGridStore.getState().frozenCols).toBe(2);
  });

  it("sets total rows", () => {
    useGridStore.getState().setTotalRows(5000);
    expect(useGridStore.getState().totalRows).toBe(5000);
  });

  it("sets total cols", () => {
    useGridStore.getState().setTotalCols(52);
    expect(useGridStore.getState().totalCols).toBe(52);
  });
});
