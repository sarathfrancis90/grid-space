import { describe, it, expect, beforeEach } from "vitest";
import { useCommentStore } from "../stores/commentStore";
import { useFilterStore } from "../stores/filterStore";
import type { CellComment, ColumnFilter, SortCriterion } from "../types/grid";

describe("Cell visual indicators — data layer", () => {
  beforeEach(() => {
    useCommentStore.setState({
      comments: new Map(),
      activeCommentCell: null,
      activeSheetForComment: null,
      isPanelOpen: false,
      filter: "all",
    });
    useFilterStore.setState({
      filtersEnabled: new Map(),
      columnFilters: new Map(),
      sortCriteria: new Map(),
      filteredRows: new Map(),
    });
  });

  const makeComment = (overrides: Partial<CellComment> = {}): CellComment => ({
    id: `c-${Math.random().toString(36).slice(2, 8)}`,
    cellKey: "0,0",
    sheetId: "sheet-1",
    text: "Test comment",
    author: "Alice",
    authorId: "user-1",
    createdAt: Date.now(),
    replies: [],
    resolved: false,
    ...overrides,
  });

  describe("Comment indicator", () => {
    it("hasComment returns true after adding a comment", () => {
      const store = useCommentStore.getState();
      store.addComment("sheet-1", makeComment({ cellKey: "2,3" }));

      const updated = useCommentStore.getState();
      expect(updated.hasComment("sheet-1", "2,3")).toBe(true);
    });

    it("hasComment returns false for cell without comment", () => {
      const store = useCommentStore.getState();
      expect(store.hasComment("sheet-1", "0,0")).toBe(false);
    });

    it("comment cellKeys can be collected into a Set for fast lookup", () => {
      const store = useCommentStore.getState();
      store.addComment("sheet-1", makeComment({ cellKey: "0,0" }));
      store.addComment("sheet-1", makeComment({ cellKey: "1,2" }));
      store.addComment("sheet-1", makeComment({ cellKey: "5,3" }));

      const comments = useCommentStore.getState().comments.get("sheet-1") ?? [];
      const cellKeys = new Set(comments.map((c: CellComment) => c.cellKey));

      expect(cellKeys.has("0,0")).toBe(true);
      expect(cellKeys.has("1,2")).toBe(true);
      expect(cellKeys.has("5,3")).toBe(true);
      expect(cellKeys.has("9,9")).toBe(false);
    });
  });

  describe("Filter indicator", () => {
    it("columnFilters stores filter for a specific column", () => {
      const store = useFilterStore.getState();
      store.setColumnFilter("sheet-1", {
        col: 2,
        allowedValues: new Set(["A", "B"]),
      });

      const filters =
        useFilterStore.getState().columnFilters.get("sheet-1") ?? [];
      const hasFilterOnCol2 = filters.some((f: ColumnFilter) => f.col === 2);
      const hasFilterOnCol5 = filters.some((f: ColumnFilter) => f.col === 5);

      expect(hasFilterOnCol2).toBe(true);
      expect(hasFilterOnCol5).toBe(false);
    });

    it("removing a column filter clears indicator data", () => {
      const store = useFilterStore.getState();
      store.setColumnFilter("sheet-1", {
        col: 3,
        allowedValues: new Set(["X"]),
      });
      store.removeColumnFilter("sheet-1", 3);

      const filters =
        useFilterStore.getState().columnFilters.get("sheet-1") ?? [];
      expect(filters.some((f: ColumnFilter) => f.col === 3)).toBe(false);
    });
  });

  describe("Sort indicator", () => {
    it("sortCriteria stores ascending sort for a column", () => {
      const store = useFilterStore.getState();
      store.setSortCriteria("sheet-1", [{ col: 1, direction: "asc" }]);

      const criteria =
        useFilterStore.getState().sortCriteria.get("sheet-1") ?? [];
      const sortForCol1 = criteria.find((s: SortCriterion) => s.col === 1);

      expect(sortForCol1).toBeDefined();
      expect(sortForCol1?.direction).toBe("asc");
    });

    it("sortCriteria stores descending sort for a column", () => {
      const store = useFilterStore.getState();
      store.setSortCriteria("sheet-1", [{ col: 4, direction: "desc" }]);

      const criteria =
        useFilterStore.getState().sortCriteria.get("sheet-1") ?? [];
      const sortForCol4 = criteria.find((s: SortCriterion) => s.col === 4);

      expect(sortForCol4).toBeDefined();
      expect(sortForCol4?.direction).toBe("desc");
    });

    it("clearing sort removes indicator data", () => {
      const store = useFilterStore.getState();
      store.setSortCriteria("sheet-1", [{ col: 0, direction: "asc" }]);
      store.clearSort("sheet-1");

      const criteria =
        useFilterStore.getState().sortCriteria.get("sheet-1") ?? [];
      expect(criteria.length).toBe(0);
    });
  });

  describe("Combined filter and sort indicators", () => {
    it("column can have both filter and sort simultaneously", () => {
      const store = useFilterStore.getState();
      store.setColumnFilter("sheet-1", {
        col: 2,
        allowedValues: new Set(["Yes"]),
      });
      store.setSortCriteria("sheet-1", [{ col: 2, direction: "desc" }]);

      const state = useFilterStore.getState();
      const filters = state.columnFilters.get("sheet-1") ?? [];
      const criteria = state.sortCriteria.get("sheet-1") ?? [];

      expect(filters.some((f: ColumnFilter) => f.col === 2)).toBe(true);
      expect(criteria.find((s: SortCriterion) => s.col === 2)?.direction).toBe(
        "desc",
      );
    });
  });
});
