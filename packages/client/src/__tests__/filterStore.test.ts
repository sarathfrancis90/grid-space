import { describe, it, expect, beforeEach } from "vitest";
import { useFilterStore } from "../stores/filterStore";
import { getCellKey } from "../utils/coordinates";
import type { CellData } from "../types/grid";

describe("filterStore", () => {
  beforeEach(() => {
    useFilterStore.setState({
      filtersEnabled: new Map(),
      columnFilters: new Map(),
      sortCriteria: new Map(),
      filteredRows: new Map(),
    });
  });

  const SHEET = "sheet-1";

  it("toggles filters on and off", () => {
    const store = useFilterStore.getState();
    expect(store.isFilterEnabled(SHEET)).toBe(false);

    store.toggleFilters(SHEET);
    expect(useFilterStore.getState().isFilterEnabled(SHEET)).toBe(true);

    useFilterStore.getState().toggleFilters(SHEET);
    expect(useFilterStore.getState().isFilterEnabled(SHEET)).toBe(false);
  });

  it("sets and removes column filters", () => {
    const store = useFilterStore.getState();
    store.setColumnFilter(SHEET, {
      col: 0,
      condition: { op: "equals", value: "hello" },
    });

    const filters = useFilterStore.getState().columnFilters.get(SHEET);
    expect(filters).toHaveLength(1);
    expect(filters![0].col).toBe(0);

    useFilterStore.getState().removeColumnFilter(SHEET, 0);
    const after = useFilterStore.getState().columnFilters.get(SHEET);
    expect(after).toHaveLength(0);
  });

  it("updates existing filter on same column", () => {
    const store = useFilterStore.getState();
    store.setColumnFilter(SHEET, {
      col: 2,
      condition: { op: "equals", value: "a" },
    });
    store.setColumnFilter(SHEET, {
      col: 2,
      condition: { op: "contains", value: "b" },
    });

    const filters = useFilterStore.getState().columnFilters.get(SHEET);
    expect(filters).toHaveLength(1);
    expect(filters![0].condition?.op).toBe("contains");
  });

  it("computes filtered rows correctly", () => {
    const cells = new Map<string, CellData>();
    cells.set(getCellKey(0, 0), { value: "Apple" });
    cells.set(getCellKey(1, 0), { value: "Banana" });
    cells.set(getCellKey(2, 0), { value: "Cherry" });
    cells.set(getCellKey(3, 0), { value: "Avocado" });

    const store = useFilterStore.getState();
    store.setColumnFilter(SHEET, {
      col: 0,
      condition: { op: "starts-with", value: "A" },
    });

    useFilterStore.getState().computeFilteredRows(SHEET, cells, 4);

    // Rows 1 and 2 (Banana, Cherry) should be hidden
    expect(useFilterStore.getState().isRowVisible(SHEET, 0)).toBe(true);
    expect(useFilterStore.getState().isRowVisible(SHEET, 1)).toBe(false);
    expect(useFilterStore.getState().isRowVisible(SHEET, 2)).toBe(false);
    expect(useFilterStore.getState().isRowVisible(SHEET, 3)).toBe(true);
  });

  it("filters by allowed values", () => {
    const cells = new Map<string, CellData>();
    cells.set(getCellKey(0, 0), { value: "Red" });
    cells.set(getCellKey(1, 0), { value: "Blue" });
    cells.set(getCellKey(2, 0), { value: "Green" });

    const store = useFilterStore.getState();
    store.setColumnFilter(SHEET, {
      col: 0,
      allowedValues: new Set(["Red", "Green"]),
    });

    useFilterStore.getState().computeFilteredRows(SHEET, cells, 3);

    expect(useFilterStore.getState().isRowVisible(SHEET, 0)).toBe(true);
    expect(useFilterStore.getState().isRowVisible(SHEET, 1)).toBe(false);
    expect(useFilterStore.getState().isRowVisible(SHEET, 2)).toBe(true);
  });

  it("filters by color", () => {
    const cells = new Map<string, CellData>();
    cells.set(getCellKey(0, 0), {
      value: "A",
      format: { backgroundColor: "#ff0000" },
    });
    cells.set(getCellKey(1, 0), {
      value: "B",
      format: { backgroundColor: "#00ff00" },
    });
    cells.set(getCellKey(2, 0), { value: "C" });

    const store = useFilterStore.getState();
    store.setColumnFilter(SHEET, {
      col: 0,
      filterByColor: "#ff0000",
    });

    useFilterStore.getState().computeFilteredRows(SHEET, cells, 3);

    expect(useFilterStore.getState().isRowVisible(SHEET, 0)).toBe(true);
    expect(useFilterStore.getState().isRowVisible(SHEET, 1)).toBe(false);
    expect(useFilterStore.getState().isRowVisible(SHEET, 2)).toBe(false);
  });

  it("clears filters", () => {
    const store = useFilterStore.getState();
    store.setColumnFilter(SHEET, {
      col: 0,
      condition: { op: "equals", value: "test" },
    });
    store.clearFilters(SHEET);

    expect(useFilterStore.getState().columnFilters.get(SHEET)).toBeUndefined();
    expect(useFilterStore.getState().filteredRows.get(SHEET)).toBeUndefined();
  });

  it("sorts rows by single criterion", () => {
    const cells = new Map<string, CellData>();
    cells.set(getCellKey(0, 0), { value: 30 });
    cells.set(getCellKey(1, 0), { value: 10 });
    cells.set(getCellKey(2, 0), { value: 20 });

    const store = useFilterStore.getState();
    store.setSortCriteria(SHEET, [{ col: 0, direction: "asc" }]);

    const sorted = useFilterStore.getState().sortRows(SHEET, cells, 3, 1);

    expect(sorted.get(getCellKey(0, 0))?.value).toBe(10);
    expect(sorted.get(getCellKey(1, 0))?.value).toBe(20);
    expect(sorted.get(getCellKey(2, 0))?.value).toBe(30);
  });

  it("sorts rows descending", () => {
    const cells = new Map<string, CellData>();
    cells.set(getCellKey(0, 0), { value: "Apple" });
    cells.set(getCellKey(1, 0), { value: "Cherry" });
    cells.set(getCellKey(2, 0), { value: "Banana" });

    const store = useFilterStore.getState();
    store.setSortCriteria(SHEET, [{ col: 0, direction: "desc" }]);

    const sorted = useFilterStore.getState().sortRows(SHEET, cells, 3, 1);

    expect(sorted.get(getCellKey(0, 0))?.value).toBe("Cherry");
    expect(sorted.get(getCellKey(1, 0))?.value).toBe("Banana");
    expect(sorted.get(getCellKey(2, 0))?.value).toBe("Apple");
  });

  it("handles multi-column sort", () => {
    const cells = new Map<string, CellData>();
    // Row 0: Cat=A, Val=2
    cells.set(getCellKey(0, 0), { value: "A" });
    cells.set(getCellKey(0, 1), { value: 2 });
    // Row 1: Cat=B, Val=1
    cells.set(getCellKey(1, 0), { value: "B" });
    cells.set(getCellKey(1, 1), { value: 1 });
    // Row 2: Cat=A, Val=1
    cells.set(getCellKey(2, 0), { value: "A" });
    cells.set(getCellKey(2, 1), { value: 1 });

    const store = useFilterStore.getState();
    store.setSortCriteria(SHEET, [
      { col: 0, direction: "asc" },
      { col: 1, direction: "asc" },
    ]);

    const sorted = useFilterStore.getState().sortRows(SHEET, cells, 3, 2);

    // Row 0: A,1  Row 1: A,2  Row 2: B,1
    expect(sorted.get(getCellKey(0, 0))?.value).toBe("A");
    expect(sorted.get(getCellKey(0, 1))?.value).toBe(1);
    expect(sorted.get(getCellKey(1, 0))?.value).toBe("A");
    expect(sorted.get(getCellKey(1, 1))?.value).toBe(2);
    expect(sorted.get(getCellKey(2, 0))?.value).toBe("B");
  });

  it("filter condition operators work", () => {
    const cells = new Map<string, CellData>();
    cells.set(getCellKey(0, 0), { value: 10 });
    cells.set(getCellKey(1, 0), { value: 20 });
    cells.set(getCellKey(2, 0), { value: 30 });
    cells.set(getCellKey(3, 0), { value: null });

    // greater-than 15
    useFilterStore.getState().setColumnFilter(SHEET, {
      col: 0,
      condition: { op: "greater-than", value: "15" },
    });
    useFilterStore.getState().computeFilteredRows(SHEET, cells, 4);

    expect(useFilterStore.getState().isRowVisible(SHEET, 0)).toBe(false); // 10
    expect(useFilterStore.getState().isRowVisible(SHEET, 1)).toBe(true); // 20
    expect(useFilterStore.getState().isRowVisible(SHEET, 2)).toBe(true); // 30
    expect(useFilterStore.getState().isRowVisible(SHEET, 3)).toBe(false); // null

    // is-empty
    useFilterStore.getState().setColumnFilter(SHEET, {
      col: 0,
      condition: { op: "is-empty", value: "" },
    });
    useFilterStore.getState().computeFilteredRows(SHEET, cells, 4);

    expect(useFilterStore.getState().isRowVisible(SHEET, 0)).toBe(false);
    expect(useFilterStore.getState().isRowVisible(SHEET, 3)).toBe(true);
  });
});
