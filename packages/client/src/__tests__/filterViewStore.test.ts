import { describe, it, expect, beforeEach } from "vitest";
import { useFilterStore } from "../stores/filterStore";

describe("filterStore — filter views", () => {
  const SHEET = "sheet-1";

  beforeEach(() => {
    useFilterStore.setState({
      filtersEnabled: new Map(),
      columnFilters: new Map(),
      sortCriteria: new Map(),
      filteredRows: new Map(),
      filterViews: new Map(),
      activeFilterViewId: new Map(),
    });
  });

  it("creates a filter view with current filters", () => {
    const store = useFilterStore.getState();
    store.setColumnFilter(SHEET, {
      col: 0,
      condition: { op: "equals", value: "test" },
    });

    const view = store.createFilterView(SHEET, "My Filter View");

    expect(view.name).toBe("My Filter View");
    expect(view.sheetId).toBe(SHEET);
    expect(view.filters).toHaveLength(1);
    expect(view.filters[0].col).toBe(0);
    expect(view.filters[0].condition?.op).toBe("equals");

    const views = useFilterStore.getState().filterViews.get(SHEET);
    expect(views).toHaveLength(1);

    const activeId = useFilterStore.getState().activeFilterViewId.get(SHEET);
    expect(activeId).toBe(view.id);
  });

  it("creates a filter view with empty filters when none are active", () => {
    const view = useFilterStore
      .getState()
      .createFilterView(SHEET, "Empty View");
    expect(view.filters).toHaveLength(0);
  });

  it("activates a filter view and applies its filters", () => {
    const store = useFilterStore.getState();
    store.setColumnFilter(SHEET, {
      col: 2,
      condition: { op: "contains", value: "hello" },
    });
    const view = store.createFilterView(SHEET, "View A");

    // Deactivate first
    useFilterStore.getState().deactivateFilterView(SHEET);
    expect(useFilterStore.getState().activeFilterViewId.get(SHEET)).toBeNull();
    expect(useFilterStore.getState().columnFilters.get(SHEET)).toBeUndefined();

    // Reactivate
    useFilterStore.getState().activateFilterView(SHEET, view.id);
    const activeId = useFilterStore.getState().activeFilterViewId.get(SHEET);
    expect(activeId).toBe(view.id);

    const filters = useFilterStore.getState().columnFilters.get(SHEET);
    expect(filters).toHaveLength(1);
    expect(filters![0].col).toBe(2);
    expect(filters![0].condition?.op).toBe("contains");
  });

  it("serializes and deserializes allowedValues correctly", () => {
    const store = useFilterStore.getState();
    store.setColumnFilter(SHEET, {
      col: 1,
      allowedValues: new Set(["a", "b", "c"]),
    });
    const view = store.createFilterView(SHEET, "Set View");

    // Serialized filters should have arrays, not sets
    expect(Array.isArray(view.filters[0].allowedValues)).toBe(true);
    expect(view.filters[0].allowedValues).toEqual(["a", "b", "c"]);

    // Deactivate and reactivate to test deserialization
    useFilterStore.getState().deactivateFilterView(SHEET);
    useFilterStore.getState().activateFilterView(SHEET, view.id);

    const filters = useFilterStore.getState().columnFilters.get(SHEET);
    expect(filters![0].allowedValues).toBeInstanceOf(Set);
    expect(filters![0].allowedValues!.has("a")).toBe(true);
    expect(filters![0].allowedValues!.has("b")).toBe(true);
  });

  it("renames a filter view", () => {
    const view = useFilterStore.getState().createFilterView(SHEET, "Old Name");
    useFilterStore.getState().updateFilterView(SHEET, view.id, "New Name");

    const views = useFilterStore.getState().filterViews.get(SHEET);
    expect(views![0].name).toBe("New Name");
  });

  it("deletes a filter view", () => {
    const view = useFilterStore.getState().createFilterView(SHEET, "To Delete");
    expect(useFilterStore.getState().filterViews.get(SHEET)).toHaveLength(1);

    useFilterStore.getState().deleteFilterView(SHEET, view.id);
    expect(useFilterStore.getState().filterViews.get(SHEET)).toHaveLength(0);
    expect(useFilterStore.getState().activeFilterViewId.get(SHEET)).toBeNull();
  });

  it("deactivates filter view when the active one is deleted", () => {
    const store = useFilterStore.getState();
    store.setColumnFilter(SHEET, {
      col: 0,
      condition: { op: "equals", value: "x" },
    });
    const view = store.createFilterView(SHEET, "Active");

    expect(useFilterStore.getState().activeFilterViewId.get(SHEET)).toBe(
      view.id,
    );
    useFilterStore.getState().deleteFilterView(SHEET, view.id);
    expect(useFilterStore.getState().activeFilterViewId.get(SHEET)).toBeNull();
    expect(useFilterStore.getState().columnFilters.get(SHEET)).toBeUndefined();
  });

  it("saves current filters to the active filter view", () => {
    const store = useFilterStore.getState();
    const view = store.createFilterView(SHEET, "Saveable");
    expect(view.filters).toHaveLength(0);

    // Add a filter while view is active
    useFilterStore.getState().setColumnFilter(SHEET, {
      col: 3,
      condition: { op: "greater-than", value: "10" },
    });

    useFilterStore.getState().saveActiveFilterView(SHEET);

    const views = useFilterStore.getState().filterViews.get(SHEET);
    expect(views![0].filters).toHaveLength(1);
    expect(views![0].filters[0].col).toBe(3);
  });

  it("getActiveFilterView returns the active view or null", () => {
    const store = useFilterStore.getState();
    expect(store.getActiveFilterView(SHEET)).toBeNull();

    const view = store.createFilterView(SHEET, "Active View");
    expect(useFilterStore.getState().getActiveFilterView(SHEET)?.id).toBe(
      view.id,
    );

    useFilterStore.getState().deactivateFilterView(SHEET);
    expect(useFilterStore.getState().getActiveFilterView(SHEET)).toBeNull();
  });

  it("setFilterViews replaces the views list for a sheet", () => {
    const store = useFilterStore.getState();
    store.setFilterViews(SHEET, [
      {
        id: "fv-1",
        name: "View 1",
        sheetId: SHEET,
        filters: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "fv-2",
        name: "View 2",
        sheetId: SHEET,
        filters: [{ col: 0, condition: { op: "equals", value: "x" } }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const views = useFilterStore.getState().filterViews.get(SHEET);
    expect(views).toHaveLength(2);
    expect(views![0].name).toBe("View 1");
    expect(views![1].name).toBe("View 2");
  });

  it("supports multiple filter views per sheet", () => {
    const store = useFilterStore.getState();
    store.createFilterView(SHEET, "View A");
    store.createFilterView(SHEET, "View B");
    store.createFilterView(SHEET, "View C");

    const views = useFilterStore.getState().filterViews.get(SHEET);
    expect(views).toHaveLength(3);
  });
});
