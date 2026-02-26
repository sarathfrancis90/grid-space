import { describe, it, expect, beforeEach } from "vitest";
import { usePivotStore, aggregate } from "../stores/pivotStore";
import { getCellKey } from "../utils/coordinates";
import type { CellData, PivotConfig } from "../types/grid";

describe("aggregate", () => {
  it("SUM", () => {
    expect(aggregate([1, 2, 3, 4, 5], "SUM")).toBe(15);
  });

  it("COUNT", () => {
    expect(aggregate([1, 2, 3], "COUNT")).toBe(3);
  });

  it("AVERAGE", () => {
    expect(aggregate([10, 20, 30], "AVERAGE")).toBe(20);
  });

  it("MIN", () => {
    expect(aggregate([5, 3, 8, 1], "MIN")).toBe(1);
  });

  it("MAX", () => {
    expect(aggregate([5, 3, 8, 1], "MAX")).toBe(8);
  });

  it("returns 0 for empty array", () => {
    expect(aggregate([], "SUM")).toBe(0);
  });
});

describe("pivotStore", () => {
  beforeEach(() => {
    usePivotStore.setState({
      pivots: new Map(),
      editorOpen: false,
      editingPivotId: null,
    });
  });

  const makePivotConfig = (): PivotConfig => ({
    id: "pivot-1",
    sourceSheetId: "sheet-1",
    sourceRange: {
      start: { row: 0, col: 0 },
      end: { row: 4, col: 2 },
    },
    rowFields: [{ col: 0, label: "Category" }],
    colFields: [],
    valueFields: [{ col: 2, label: "Amount", aggregation: "SUM" }],
    filters: [],
    targetSheetId: "sheet-2",
    targetCell: { row: 0, col: 0 },
  });

  it("creates and retrieves a pivot", () => {
    const config = makePivotConfig();
    usePivotStore.getState().createPivot(config);

    const pivot = usePivotStore.getState().getPivot("pivot-1");
    expect(pivot).toBeDefined();
    expect(pivot?.id).toBe("pivot-1");
  });

  it("removes a pivot", () => {
    usePivotStore.getState().createPivot(makePivotConfig());
    usePivotStore.getState().removePivot("pivot-1");
    expect(usePivotStore.getState().getPivot("pivot-1")).toBeUndefined();
  });

  it("opens and closes editor", () => {
    usePivotStore.getState().createPivot(makePivotConfig());
    usePivotStore.getState().openEditor("pivot-1");

    expect(usePivotStore.getState().editorOpen).toBe(true);
    expect(usePivotStore.getState().editingPivotId).toBe("pivot-1");

    usePivotStore.getState().closeEditor();
    expect(usePivotStore.getState().editorOpen).toBe(false);
  });

  it("sets row/col/value fields", () => {
    usePivotStore.getState().createPivot(makePivotConfig());

    usePivotStore
      .getState()
      .setRowFields("pivot-1", [{ col: 1, label: "Region" }]);
    expect(
      usePivotStore.getState().getPivot("pivot-1")?.rowFields,
    ).toHaveLength(1);

    usePivotStore
      .getState()
      .setColFields("pivot-1", [{ col: 0, label: "Category" }]);
    expect(
      usePivotStore.getState().getPivot("pivot-1")?.colFields,
    ).toHaveLength(1);

    usePivotStore
      .getState()
      .setValueFields("pivot-1", [
        { col: 2, label: "Amount", aggregation: "AVERAGE" },
      ]);
    expect(
      usePivotStore.getState().getPivot("pivot-1")?.valueFields[0].aggregation,
    ).toBe("AVERAGE");
  });

  it("computes pivot table from source data", () => {
    const config = makePivotConfig();
    usePivotStore.getState().createPivot(config);

    // Source data:
    // Row 0 (header): Category, Region, Amount
    // Row 1: A, North, 10
    // Row 2: B, South, 20
    // Row 3: A, South, 30
    // Row 4: B, North, 40
    const cells = new Map<string, CellData>();
    cells.set(getCellKey(0, 0), { value: "Category" });
    cells.set(getCellKey(0, 1), { value: "Region" });
    cells.set(getCellKey(0, 2), { value: "Amount" });
    cells.set(getCellKey(1, 0), { value: "A" });
    cells.set(getCellKey(1, 1), { value: "North" });
    cells.set(getCellKey(1, 2), { value: 10 });
    cells.set(getCellKey(2, 0), { value: "B" });
    cells.set(getCellKey(2, 1), { value: "South" });
    cells.set(getCellKey(2, 2), { value: 20 });
    cells.set(getCellKey(3, 0), { value: "A" });
    cells.set(getCellKey(3, 1), { value: "South" });
    cells.set(getCellKey(3, 2), { value: 30 });
    cells.set(getCellKey(4, 0), { value: "B" });
    cells.set(getCellKey(4, 1), { value: "North" });
    cells.set(getCellKey(4, 2), { value: 40 });

    const result = usePivotStore.getState().computePivot(config, cells);

    // Header row: Category, Amount (SUM)
    expect(result.get(getCellKey(0, 0))?.value).toBe("Category");
    expect(result.get(getCellKey(0, 1))?.value).toBe("Amount (SUM)");

    // Data: A → 10+30=40, B → 20+40=60
    expect(result.get(getCellKey(1, 0))?.value).toBe("A");
    expect(result.get(getCellKey(1, 1))?.value).toBe(40);
    expect(result.get(getCellKey(2, 0))?.value).toBe("B");
    expect(result.get(getCellKey(2, 1))?.value).toBe(60);
  });

  it("computes pivot with filters", () => {
    const config: PivotConfig = {
      ...makePivotConfig(),
      filters: [{ col: 0, allowedValues: new Set(["A"]) }],
    };

    const cells = new Map<string, CellData>();
    cells.set(getCellKey(0, 0), { value: "Category" });
    cells.set(getCellKey(0, 2), { value: "Amount" });
    cells.set(getCellKey(1, 0), { value: "A" });
    cells.set(getCellKey(1, 2), { value: 10 });
    cells.set(getCellKey(2, 0), { value: "B" });
    cells.set(getCellKey(2, 2), { value: 20 });
    cells.set(getCellKey(3, 0), { value: "A" });
    cells.set(getCellKey(3, 2), { value: 30 });

    const result = usePivotStore.getState().computePivot(config, cells);

    // Only A should be present
    expect(result.get(getCellKey(1, 0))?.value).toBe("A");
    expect(result.get(getCellKey(1, 1))?.value).toBe(40);
    // No row for B
    expect(result.get(getCellKey(2, 0))).toBeUndefined();
  });
});
