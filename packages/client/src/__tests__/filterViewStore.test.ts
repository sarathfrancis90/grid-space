import { describe, it, expect, beforeEach, vi } from "vitest";
import { useFilterStore } from "../stores/filterStore";
import type { FilterView } from "../stores/filterStore";

// Mock the API module
vi.mock("../services/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("filterStore — filter views", () => {
  beforeEach(() => {
    useFilterStore.setState({
      filtersEnabled: new Map(),
      columnFilters: new Map(),
      sortCriteria: new Map(),
      filteredRows: new Map(),
      filterViews: [],
      activeFilterViewId: null,
      filterViewsLoading: false,
    });
  });

  const sampleView: FilterView = {
    id: "fv-1",
    spreadsheetId: "ss-1",
    sheetId: "sheet-1",
    userId: "user-1",
    name: "My Filter",
    criteria: [
      { col: 0, condition: { op: "equals", value: "hello" } },
      { col: 2, allowedValues: ["a", "b"] },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  describe("applyFilterView", () => {
    it("activates filter view and applies criteria as column filters", () => {
      const store = useFilterStore.getState();
      store.applyFilterView(sampleView, "sheet-1");

      const state = useFilterStore.getState();
      expect(state.activeFilterViewId).toBe("fv-1");
      expect(state.filtersEnabled.get("sheet-1")).toBe(true);

      const filters = state.columnFilters.get("sheet-1");
      expect(filters).toBeDefined();
      expect(filters!.length).toBe(2);
      expect(filters![0].col).toBe(0);
      expect(filters![0].condition?.op).toBe("equals");
      expect(filters![0].condition?.value).toBe("hello");
      expect(filters![1].col).toBe(2);
      expect(filters![1].allowedValues).toEqual(new Set(["a", "b"]));
    });
  });

  describe("deactivateFilterView", () => {
    it("clears active filter view and removes filters", () => {
      const store = useFilterStore.getState();
      store.applyFilterView(sampleView, "sheet-1");

      store.deactivateFilterView("sheet-1");

      const state = useFilterStore.getState();
      expect(state.activeFilterViewId).toBeNull();
      expect(state.filtersEnabled.get("sheet-1")).toBe(false);
      expect(state.columnFilters.has("sheet-1")).toBe(false);
      expect(state.filteredRows.has("sheet-1")).toBe(false);
    });
  });

  describe("loadFilterViews", () => {
    it("loads filter views from API", async () => {
      const { api } = await import("../services/api");
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue([sampleView]);

      await useFilterStore
        .getState()
        .loadFilterViews("ss-1", "sheet-1");

      const state = useFilterStore.getState();
      expect(state.filterViews).toHaveLength(1);
      expect(state.filterViews[0].name).toBe("My Filter");
      expect(state.filterViewsLoading).toBe(false);
    });

    it("handles API errors gracefully", async () => {
      const { api } = await import("../services/api");
      (api.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Network error"),
      );

      await useFilterStore
        .getState()
        .loadFilterViews("ss-1", "sheet-1");

      const state = useFilterStore.getState();
      expect(state.filterViews).toHaveLength(0);
      expect(state.filterViewsLoading).toBe(false);
    });
  });

  describe("deleteFilterView", () => {
    it("removes from list and clears active if it was active", async () => {
      const { api } = await import("../services/api");
      (api.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      useFilterStore.setState({
        filterViews: [sampleView],
        activeFilterViewId: "fv-1",
      });

      await useFilterStore
        .getState()
        .deleteFilterView("ss-1", "sheet-1", "fv-1");

      const state = useFilterStore.getState();
      expect(state.filterViews).toHaveLength(0);
      expect(state.activeFilterViewId).toBeNull();
    });
  });

  describe("updateFilterView", () => {
    it("updates the filter view in the list", async () => {
      const { api } = await import("../services/api");
      const updatedView = { ...sampleView, name: "Renamed Filter" };
      (api.put as ReturnType<typeof vi.fn>).mockResolvedValue(updatedView);

      useFilterStore.setState({ filterViews: [sampleView] });

      await useFilterStore
        .getState()
        .updateFilterView("ss-1", "sheet-1", "fv-1", {
          name: "Renamed Filter",
        });

      const state = useFilterStore.getState();
      expect(state.filterViews[0].name).toBe("Renamed Filter");
    });
  });
});
