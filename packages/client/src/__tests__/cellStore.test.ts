import { describe, it, expect, beforeEach } from "vitest";
import { useCellStore } from "../stores/cellStore";

describe("cellStore", () => {
  beforeEach(() => {
    useCellStore.setState({
      cells: new Map(),
    });
  });

  it("returns undefined for non-existent cell", () => {
    const cell = useCellStore.getState().getCell("sheet-1", 0, 0);
    expect(cell).toBeUndefined();
  });

  it("sets and gets a cell", () => {
    useCellStore.getState().setCell("sheet-1", 0, 0, { value: "hello" });
    const cell = useCellStore.getState().getCell("sheet-1", 0, 0);
    expect(cell).toEqual({ value: "hello" });
  });

  it("overwrites a cell value", () => {
    useCellStore.getState().setCell("sheet-1", 0, 0, { value: "first" });
    useCellStore.getState().setCell("sheet-1", 0, 0, { value: "second" });
    const cell = useCellStore.getState().getCell("sheet-1", 0, 0);
    expect(cell).toEqual({ value: "second" });
  });

  it("deletes a cell", () => {
    useCellStore.getState().setCell("sheet-1", 0, 0, { value: "hello" });
    useCellStore.getState().deleteCell("sheet-1", 0, 0);
    const cell = useCellStore.getState().getCell("sheet-1", 0, 0);
    expect(cell).toBeUndefined();
  });

  it("handles multiple sheets", () => {
    useCellStore.getState().setCell("sheet-1", 0, 0, { value: "sheet1" });
    useCellStore.getState().setCell("sheet-2", 0, 0, { value: "sheet2" });
    expect(useCellStore.getState().getCell("sheet-1", 0, 0)?.value).toBe(
      "sheet1",
    );
    expect(useCellStore.getState().getCell("sheet-2", 0, 0)?.value).toBe(
      "sheet2",
    );
  });

  it("gets cells in range", () => {
    useCellStore.getState().setCell("sheet-1", 0, 0, { value: "A1" });
    useCellStore.getState().setCell("sheet-1", 0, 1, { value: "B1" });
    useCellStore.getState().setCell("sheet-1", 1, 0, { value: "A2" });
    useCellStore.getState().setCell("sheet-1", 1, 1, { value: "B2" });
    const cells = useCellStore
      .getState()
      .getCellsInRange("sheet-1", 0, 0, 1, 1);
    expect(cells).toHaveLength(4);
    const values = cells.map((c) => c.value);
    expect(values).toContain("A1");
    expect(values).toContain("B1");
    expect(values).toContain("A2");
    expect(values).toContain("B2");
  });

  it("returns empty array for range on missing sheet", () => {
    const cells = useCellStore
      .getState()
      .getCellsInRange("nonexistent", 0, 0, 5, 5);
    expect(cells).toEqual([]);
  });

  it("ensures a sheet exists", () => {
    useCellStore.getState().ensureSheet("new-sheet");
    expect(useCellStore.getState().cells.has("new-sheet")).toBe(true);
  });

  it("deleting non-existent cell does not throw", () => {
    expect(() => {
      useCellStore.getState().deleteCell("sheet-1", 99, 99);
    }).not.toThrow();
  });
});
