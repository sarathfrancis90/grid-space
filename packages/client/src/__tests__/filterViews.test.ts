import { describe, it, expect, beforeEach } from "vitest";
import { useFilterStore } from "../stores/filterStore";
import type { FilterView } from "../types/grid";

describe("filterStore — filter views", () => {
  const SHEET = "sheet-1";

  beforeEach(() => {
    useFilterStore.setState({
      filtersEnabled: new Map(),
      columnFilters: new Map(),
      sortCriteria: new Map(),
      filteredRows: new Map(),
      filterViews: new Map(),
      activeFilterViewId: null,
    });
  });

  it("creates a filter view with current filters", () => {
    const store = useFilterStore.getState();
    store.setColumnFilter(SHEET, {
      col: 0,
      condition: { op: "equals", value: "test" },
    });

    const id = store.createFilterView(SHEET, "My View");
    const views = useFilterStore.getState().getFilterViews(SHEET);

    expect(views).toHaveLength(1);
    expect(views[0].name).toBe("My View");
    expect(views[0].id).toBe(id);
    expect(views[0].columnFilters).toHaveLength(1);
    expect(views[0].columnFilters[0].col).toBe(0);
    expect(useFilterStore.getState().activeFilterViewId).toBe(id);
  });

  it("creates a filter view with no filters", () => {
    const store = useFilterStore.getState();
    const id = store.createFilterView(SHEET, "Empty View");
    const views = useFilterStore.getState().getFilterViews(SHEET);

    expect(views).toHaveLength(1);
    expect(views[0].columnFilters).toHaveLength(0);
    expect(views[0].id).toBe(id);
  });

  it("renames a filter view", () => {
    const store = useFilterStore.getState();
    const id = store.createFilterView(SHEET, "Old Name");

    useFilterStore.getState().renameFilterView(SHEET, id, "New Name");
    const views = useFilterStore.getState().getFilterViews(SHEET);

    expect(views[0].name).toBe("New Name");
  });

  it("deletes a filter view", () => {
    const store = useFilterStore.getState();
    const id = store.createFilterView(SHEET, "To Delete");

    expect(useFilterStore.getState().getFilterViews(SHEET)).toHaveLength(1);

    useFilterStore.getState().deleteFilterView(SHEET, id);
    expect(useFilterStore.getState().getFilterViews(SHEET)).toHaveLength(0);
    expect(useFilterStore.getState().activeFilterViewId).toBeNull();
  });

  it("activates a filter view and applies its filters", () => {
    const store = useFilterStore.getState();
    store.setColumnFilter(SHEET, {
      col: 2,
      condition: { op: "contains", value: "hello" },
    });
    const id = store.createFilterView(SHEET, "Saved View");

    // Clear current filters
    useFilterStore.getState().clearFilters(SHEET);
    useFilterStore.getState().deactivateFilterView();

    // Activate the saved view
    useFilterStore.getState().activateFilterView(SHEET, id);

    const state = useFilterStore.getState();
    expect(state.activeFilterViewId).toBe(id);
    expect(state.filtersEnabled.get(SHEET)).toBe(true);
    const filters = state.columnFilters.get(SHEET);
    expect(filters).toHaveLength(1);
    expect(filters![0].col).toBe(2);
    expect(filters![0].condition?.op).toBe("contains");
  });

  it("deactivates filter view without clearing filters", () => {
    const store = useFilterStore.getState();
    store.setColumnFilter(SHEET, {
      col: 0,
      condition: { op: "equals", value: "x" },
    });
    store.createFilterView(SHEET, "Test");

    useFilterStore.getState().deactivateFilterView();
    expect(useFilterStore.getState().activeFilterViewId).toBeNull();
    // Filters themselves remain — deactivate only clears the view indicator
    expect(useFilterStore.getState().columnFilters.get(SHEET)).toHaveLength(1);
  });

  it("saves updated filters to an existing filter view", () => {
    const store = useFilterStore.getState();
    store.setColumnFilter(SHEET, {
      col: 0,
      condition: { op: "equals", value: "a" },
    });
    const id = store.createFilterView(SHEET, "Updatable");

    // Change filters
    useFilterStore.getState().setColumnFilter(SHEET, {
      col: 1,
      condition: { op: "contains", value: "b" },
    });

    // Save to view
    useFilterStore.getState().saveFilterView(SHEET, id);

    const views = useFilterStore.getState().getFilterViews(SHEET);
    expect(views[0].columnFilters).toHaveLength(2);
  });

  it("returns empty array for sheets with no filter views", () => {
    const views = useFilterStore.getState().getFilterViews("nonexistent-sheet");
    expect(views).toEqual([]);
  });

  it("supports multiple filter views per sheet", () => {
    const store = useFilterStore.getState();
    store.createFilterView(SHEET, "View 1");
    store.createFilterView(SHEET, "View 2");
    store.createFilterView(SHEET, "View 3");

    const views = useFilterStore.getState().getFilterViews(SHEET);
    expect(views).toHaveLength(3);
    expect(views.map((v: FilterView) => v.name)).toEqual([
      "View 1",
      "View 2",
      "View 3",
    ]);
  });

  it("deleting active filter view clears activeFilterViewId", () => {
    const store = useFilterStore.getState();
    const id = store.createFilterView(SHEET, "Active");
    expect(useFilterStore.getState().activeFilterViewId).toBe(id);

    useFilterStore.getState().deleteFilterView(SHEET, id);
    expect(useFilterStore.getState().activeFilterViewId).toBeNull();
  });
});
