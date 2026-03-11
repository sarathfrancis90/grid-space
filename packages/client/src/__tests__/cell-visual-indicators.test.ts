import { describe, it, expect, beforeEach } from "vitest";
import { useCommentStore } from "../stores/commentStore";
import { useFilterStore } from "../stores/filterStore";
import { useDataStore } from "../stores/dataStore";
import type { CellComment, ColumnFilter, ProtectedRange } from "../types/grid";

const SHEET = "sheet-1";

describe("Cell Visual Indicators", () => {
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
    useDataStore.setState({
      protectedRanges: new Map(),
    });
  });

  describe("Comment indicators", () => {
    it("hasComment returns true when comment exists in commentStore", () => {
      const comment: CellComment = {
        id: "c1",
        cellKey: "0,0",
        sheetId: SHEET,
        authorId: "user-1",
        author: "Test User",
        text: "This is a comment",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        replies: [],
        resolved: false,
      };

      useCommentStore.getState().addComment(SHEET, comment);

      expect(useCommentStore.getState().hasComment(SHEET, "0,0")).toBe(true);
      expect(useCommentStore.getState().hasComment(SHEET, "1,1")).toBe(false);
    });

    it("hasComment returns false after comment is deleted", () => {
      const comment: CellComment = {
        id: "c2",
        cellKey: "2,3",
        sheetId: SHEET,
        authorId: "user-1",
        author: "Test User",
        text: "Another comment",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        replies: [],
        resolved: false,
      };

      useCommentStore.getState().addComment(SHEET, comment);
      expect(useCommentStore.getState().hasComment(SHEET, "2,3")).toBe(true);

      useCommentStore.getState().deleteComment(SHEET, "c2");
      expect(useCommentStore.getState().hasComment(SHEET, "2,3")).toBe(false);
    });
  });

  describe("Filter indicators", () => {
    it("tracks active column filters for header icon display", () => {
      const store = useFilterStore.getState();
      store.toggleFilters(SHEET);

      store.setColumnFilter(SHEET, {
        col: 2,
        condition: { op: "equals", value: "test" },
      });

      const state = useFilterStore.getState();
      const filters = state.columnFilters.get(SHEET) ?? [];
      const filtersEnabled = state.filtersEnabled.get(SHEET) ?? false;

      expect(filtersEnabled).toBe(true);
      expect(filters.some((f: ColumnFilter) => f.col === 2)).toBe(true);
      expect(filters.some((f: ColumnFilter) => f.col === 0)).toBe(false);
    });

    it("filter icon data clears when filters are toggled off", () => {
      const store = useFilterStore.getState();
      store.toggleFilters(SHEET);
      store.setColumnFilter(SHEET, {
        col: 1,
        condition: { op: "contains", value: "abc" },
      });

      // Toggle off
      useFilterStore.getState().toggleFilters(SHEET);

      const state = useFilterStore.getState();
      expect(state.filtersEnabled.get(SHEET)).toBe(false);
      expect(state.columnFilters.get(SHEET)).toBeUndefined();
    });
  });

  describe("Sort indicators", () => {
    it("tracks sort criteria for header arrow display", () => {
      const store = useFilterStore.getState();
      store.setSortCriteria(SHEET, [{ col: 3, direction: "asc" }]);

      const criteria = useFilterStore.getState().sortCriteria.get(SHEET) ?? [];
      expect(criteria).toHaveLength(1);
      expect(criteria[0].col).toBe(3);
      expect(criteria[0].direction).toBe("asc");
    });

    it("supports descending sort direction", () => {
      const store = useFilterStore.getState();
      store.setSortCriteria(SHEET, [{ col: 0, direction: "desc" }]);

      const criteria = useFilterStore.getState().sortCriteria.get(SHEET) ?? [];
      expect(criteria[0].direction).toBe("desc");
    });

    it("clears sort criteria", () => {
      const store = useFilterStore.getState();
      store.setSortCriteria(SHEET, [{ col: 1, direction: "asc" }]);
      store.clearSort(SHEET);

      const criteria = useFilterStore.getState().sortCriteria.get(SHEET);
      expect(criteria).toBeUndefined();
    });
  });

  describe("Protected range indicators", () => {
    it("tracks protected ranges for cell shading", () => {
      const store = useDataStore.getState();
      store.addProtectedRange({
        id: "pr-1",
        sheetId: SHEET,
        startRow: 0,
        startCol: 0,
        endRow: 5,
        endCol: 3,
        description: "Header area",
      });

      const ranges = useDataStore.getState().getProtectedRanges(SHEET);
      expect(ranges).toHaveLength(1);
      expect(ranges[0].startRow).toBe(0);
      expect(ranges[0].endCol).toBe(3);
    });

    it("checks if a cell is within a protected range", () => {
      const store = useDataStore.getState();
      store.addProtectedRange({
        id: "pr-2",
        sheetId: SHEET,
        startRow: 2,
        startCol: 1,
        endRow: 4,
        endCol: 3,
      });

      const ranges = useDataStore.getState().getProtectedRanges(SHEET);
      // Cell (3,2) is inside the protected range
      const isProtected = ranges.some(
        (pr: ProtectedRange) =>
          3 >= pr.startRow &&
          3 <= pr.endRow &&
          2 >= pr.startCol &&
          2 <= pr.endCol,
      );
      expect(isProtected).toBe(true);

      // Cell (0,0) is outside
      const isOutside = ranges.some(
        (pr: ProtectedRange) =>
          0 >= pr.startRow &&
          0 <= pr.endRow &&
          0 >= pr.startCol &&
          0 <= pr.endCol,
      );
      expect(isOutside).toBe(false);
    });
  });
});
