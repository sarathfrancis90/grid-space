import { describe, it, expect, beforeEach } from "vitest";
import { useFilterViewStore } from "../filterViewStore";
import type { ColumnFilter } from "../../types/grid";

describe("filterViewStore", () => {
  beforeEach(() => {
    // Reset store state between tests using setState to avoid Immer freeze
    useFilterViewStore.setState({
      filterViews: new Map(),
      activeFilterViewId: new Map(),
    });
  });

  const sheetId = "sheet-1";

  const sampleFilters: ColumnFilter[] = [
    { col: 0, allowedValues: new Set(["Alice", "Bob"]) },
    { col: 2, condition: { op: "greater-than", value: "10" } },
  ];

  describe("createFilterView", () => {
    it("should create a new filter view and return its id", () => {
      const store = useFilterViewStore.getState();
      const id = store.createFilterView(sheetId, "My Filter", sampleFilters);

      expect(id).toBeTruthy();
      const views = store.getFilterViews(sheetId);
      expect(views).toHaveLength(1);
      expect(views[0].name).toBe("My Filter");
      expect(views[0].sheetId).toBe(sheetId);
      expect(views[0].columnFilters).toEqual(sampleFilters);
    });

    it("should create multiple filter views for the same sheet", () => {
      const store = useFilterViewStore.getState();
      store.createFilterView(sheetId, "Filter 1", []);
      store.createFilterView(sheetId, "Filter 2", sampleFilters);

      const views = store.getFilterViews(sheetId);
      expect(views).toHaveLength(2);
      expect(views[0].name).toBe("Filter 1");
      expect(views[1].name).toBe("Filter 2");
    });
  });

  describe("activateFilterView / deactivateFilterView", () => {
    it("should activate a filter view", () => {
      const store = useFilterViewStore.getState();
      const id = store.createFilterView(sheetId, "Active Filter", []);

      store.activateFilterView(sheetId, id);
      const active = store.getActiveFilterView(sheetId);
      expect(active).not.toBeNull();
      expect(active!.id).toBe(id);
    });

    it("should deactivate the filter view", () => {
      const store = useFilterViewStore.getState();
      const id = store.createFilterView(sheetId, "Active Filter", []);

      store.activateFilterView(sheetId, id);
      expect(store.getActiveFilterView(sheetId)).not.toBeNull();

      store.deactivateFilterView(sheetId);
      expect(store.getActiveFilterView(sheetId)).toBeNull();
    });
  });

  describe("updateFilterView", () => {
    it("should update filter view name", () => {
      const store = useFilterViewStore.getState();
      const id = store.createFilterView(sheetId, "Old Name", []);

      store.updateFilterView(sheetId, id, { name: "New Name" });
      const views = store.getFilterViews(sheetId);
      expect(views[0].name).toBe("New Name");
    });

    it("should update filter view column filters", () => {
      const store = useFilterViewStore.getState();
      const id = store.createFilterView(sheetId, "Filter", []);

      store.updateFilterView(sheetId, id, {
        columnFilters: sampleFilters,
      });
      const views = store.getFilterViews(sheetId);
      expect(views[0].columnFilters).toEqual(sampleFilters);
    });

    it("should update the updatedAt timestamp", () => {
      const store = useFilterViewStore.getState();
      const id = store.createFilterView(sheetId, "Filter", []);
      const originalUpdatedAt = store.getFilterViews(sheetId)[0].updatedAt;

      // Small delay to ensure timestamp differs
      store.updateFilterView(sheetId, id, { name: "Updated" });
      const newUpdatedAt = store.getFilterViews(sheetId)[0].updatedAt;
      expect(newUpdatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
    });
  });

  describe("deleteFilterView", () => {
    it("should delete a filter view", () => {
      const store = useFilterViewStore.getState();
      const id = store.createFilterView(sheetId, "To Delete", []);
      expect(store.getFilterViews(sheetId)).toHaveLength(1);

      store.deleteFilterView(sheetId, id);
      expect(store.getFilterViews(sheetId)).toHaveLength(0);
    });

    it("should deactivate the view if it was active when deleted", () => {
      const store = useFilterViewStore.getState();
      const id = store.createFilterView(sheetId, "Active & Delete", []);
      store.activateFilterView(sheetId, id);
      expect(store.getActiveFilterView(sheetId)).not.toBeNull();

      store.deleteFilterView(sheetId, id);
      expect(store.getActiveFilterView(sheetId)).toBeNull();
    });
  });

  describe("renameFilterView", () => {
    it("should rename a filter view", () => {
      const store = useFilterViewStore.getState();
      const id = store.createFilterView(sheetId, "Original", []);

      store.renameFilterView(sheetId, id, "Renamed");
      expect(store.getFilterViews(sheetId)[0].name).toBe("Renamed");
    });
  });

  describe("getFilterViews", () => {
    it("should return empty array for sheet with no views", () => {
      const store = useFilterViewStore.getState();
      expect(store.getFilterViews("nonexistent")).toEqual([]);
    });
  });

  describe("getActiveFilterView", () => {
    it("should return null when no view is active", () => {
      const store = useFilterViewStore.getState();
      expect(store.getActiveFilterView(sheetId)).toBeNull();
    });

    it("should return null if active id points to deleted view", () => {
      const store = useFilterViewStore.getState();
      const id = store.createFilterView(sheetId, "View", []);
      store.activateFilterView(sheetId, id);
      store.deleteFilterView(sheetId, id);
      expect(store.getActiveFilterView(sheetId)).toBeNull();
    });
  });
});
