import { describe, it, expect, beforeEach } from "vitest";
import { useNamedRangeStore } from "../stores/namedRangeStore";

describe("namedRangeStore", () => {
  beforeEach(() => {
    useNamedRangeStore.setState({ ranges: new Map() });
  });

  it("adds and retrieves a range", () => {
    useNamedRangeStore.getState().addRange({
      name: "MyRange",
      sheetId: "sheet-1",
      startRow: 0,
      startCol: 0,
      endRow: 9,
      endCol: 2,
    });

    const range = useNamedRangeStore.getState().getRange("MyRange");
    expect(range).toBeDefined();
    expect(range?.startRow).toBe(0);
    expect(range?.endRow).toBe(9);
  });

  it("removes a range", () => {
    useNamedRangeStore.getState().addRange({
      name: "Test",
      sheetId: "sheet-1",
      startRow: 0,
      startCol: 0,
      endRow: 5,
      endCol: 5,
    });

    useNamedRangeStore.getState().removeRange("Test");
    expect(useNamedRangeStore.getState().getRange("Test")).toBeUndefined();
  });

  it("updates a range", () => {
    useNamedRangeStore.getState().addRange({
      name: "Data",
      sheetId: "sheet-1",
      startRow: 0,
      startCol: 0,
      endRow: 5,
      endCol: 3,
    });

    useNamedRangeStore.getState().updateRange("Data", { endRow: 10 });
    expect(useNamedRangeStore.getState().getRange("Data")?.endRow).toBe(10);
  });

  it("getAllRanges returns all", () => {
    useNamedRangeStore.getState().addRange({
      name: "R1",
      sheetId: "sheet-1",
      startRow: 0,
      startCol: 0,
      endRow: 1,
      endCol: 1,
    });
    useNamedRangeStore.getState().addRange({
      name: "R2",
      sheetId: "sheet-2",
      startRow: 0,
      startCol: 0,
      endRow: 2,
      endCol: 2,
    });

    expect(useNamedRangeStore.getState().getAllRanges()).toHaveLength(2);
  });

  it("getRangesForSheet filters by sheet", () => {
    useNamedRangeStore.getState().addRange({
      name: "R1",
      sheetId: "sheet-1",
      startRow: 0,
      startCol: 0,
      endRow: 1,
      endCol: 1,
    });
    useNamedRangeStore.getState().addRange({
      name: "R2",
      sheetId: "sheet-2",
      startRow: 0,
      startCol: 0,
      endRow: 2,
      endCol: 2,
    });

    expect(
      useNamedRangeStore.getState().getRangesForSheet("sheet-1"),
    ).toHaveLength(1);
  });

  it("resolveRange returns position data", () => {
    useNamedRangeStore.getState().addRange({
      name: "Totals",
      sheetId: "sheet-1",
      startRow: 5,
      startCol: 2,
      endRow: 10,
      endCol: 4,
    });

    const resolved = useNamedRangeStore.getState().resolveRange("Totals");
    expect(resolved).toEqual({
      sheetId: "sheet-1",
      start: { row: 5, col: 2 },
      end: { row: 10, col: 4 },
    });
  });

  it("resolveRange returns null for unknown name", () => {
    expect(
      useNamedRangeStore.getState().resolveRange("NoSuchRange"),
    ).toBeNull();
  });
});
