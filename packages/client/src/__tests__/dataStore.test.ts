import { describe, it, expect, beforeEach } from "vitest";
import { useDataStore } from "../stores/dataStore";

describe("dataStore", () => {
  const SHEET = "sheet-1";

  beforeEach(() => {
    useDataStore.setState({
      rowGroups: new Map(),
      colGroups: new Map(),
      protectedRanges: new Map(),
      slicers: new Map(),
    });
  });

  // Row grouping
  describe("row grouping", () => {
    it("adds a row group", () => {
      useDataStore.getState().addRowGroup(SHEET, 2, 5);
      const groups = useDataStore.getState().getRowGroups(SHEET);
      expect(groups).toHaveLength(1);
      expect(groups[0]).toEqual({ start: 2, end: 5, collapsed: false });
    });

    it("toggles row group collapsed state", () => {
      useDataStore.getState().addRowGroup(SHEET, 1, 4);
      useDataStore.getState().toggleRowGroup(SHEET, 1);
      expect(useDataStore.getState().getRowGroups(SHEET)[0].collapsed).toBe(
        true,
      );
      useDataStore.getState().toggleRowGroup(SHEET, 1);
      expect(useDataStore.getState().getRowGroups(SHEET)[0].collapsed).toBe(
        false,
      );
    });

    it("removes a row group", () => {
      useDataStore.getState().addRowGroup(SHEET, 1, 3);
      useDataStore.getState().removeRowGroup(SHEET, 1);
      expect(useDataStore.getState().getRowGroups(SHEET)).toHaveLength(0);
    });
  });

  // Column grouping
  describe("column grouping", () => {
    it("adds a column group", () => {
      useDataStore.getState().addColGroup(SHEET, 0, 3);
      const groups = useDataStore.getState().getColGroups(SHEET);
      expect(groups).toHaveLength(1);
      expect(groups[0].start).toBe(0);
    });

    it("toggles column group", () => {
      useDataStore.getState().addColGroup(SHEET, 0, 2);
      useDataStore.getState().toggleColGroup(SHEET, 0);
      expect(useDataStore.getState().getColGroups(SHEET)[0].collapsed).toBe(
        true,
      );
    });

    it("removes a column group", () => {
      useDataStore.getState().addColGroup(SHEET, 0, 2);
      useDataStore.getState().removeColGroup(SHEET, 0);
      expect(useDataStore.getState().getColGroups(SHEET)).toHaveLength(0);
    });
  });

  // Nested grouping
  describe("nested grouping", () => {
    it("supports nested row groups (2 levels)", () => {
      useDataStore.getState().addRowGroup(SHEET, 1, 10);
      useDataStore.getState().addRowGroup(SHEET, 3, 6);
      const groups = useDataStore.getState().getRowGroups(SHEET);
      expect(groups).toHaveLength(2);
      expect(groups[0]).toEqual({ start: 1, end: 10, collapsed: false });
      expect(groups[1]).toEqual({ start: 3, end: 6, collapsed: false });
    });

    it("collapses inner group independently of outer group", () => {
      useDataStore.getState().addRowGroup(SHEET, 0, 8);
      useDataStore.getState().addRowGroup(SHEET, 2, 5);
      useDataStore.getState().toggleRowGroup(SHEET, 2);
      const groups = useDataStore.getState().getRowGroups(SHEET);
      expect(groups[0].collapsed).toBe(false);
      expect(groups[1].collapsed).toBe(true);
    });

    it("supports nested column groups (2 levels)", () => {
      useDataStore.getState().addColGroup(SHEET, 0, 7);
      useDataStore.getState().addColGroup(SHEET, 2, 4);
      const groups = useDataStore.getState().getColGroups(SHEET);
      expect(groups).toHaveLength(2);
      expect(groups[0].start).toBe(0);
      expect(groups[1].start).toBe(2);
    });

    it("removes inner group without affecting outer group", () => {
      useDataStore.getState().addRowGroup(SHEET, 0, 10);
      useDataStore.getState().addRowGroup(SHEET, 3, 6);
      useDataStore.getState().removeRowGroup(SHEET, 3);
      const groups = useDataStore.getState().getRowGroups(SHEET);
      expect(groups).toHaveLength(1);
      expect(groups[0]).toEqual({ start: 0, end: 10, collapsed: false });
    });

    it("groups from different sheets are independent", () => {
      useDataStore.getState().addRowGroup(SHEET, 0, 3);
      useDataStore.getState().addRowGroup("sheet-2", 5, 8);
      expect(useDataStore.getState().getRowGroups(SHEET)).toHaveLength(1);
      expect(useDataStore.getState().getRowGroups("sheet-2")).toHaveLength(1);
      expect(useDataStore.getState().getRowGroups(SHEET)[0].start).toBe(0);
      expect(useDataStore.getState().getRowGroups("sheet-2")[0].start).toBe(5);
    });
  });

  // Protected ranges
  describe("protected ranges", () => {
    it("adds a protected range", () => {
      useDataStore.getState().addProtectedRange({
        id: "pr-1",
        sheetId: SHEET,
        startRow: 0,
        startCol: 0,
        endRow: 5,
        endCol: 3,
        description: "Header area",
      });
      expect(useDataStore.getState().getProtectedRanges(SHEET)).toHaveLength(1);
    });

    it("checks if a cell is protected", () => {
      useDataStore.getState().addProtectedRange({
        id: "pr-1",
        sheetId: SHEET,
        startRow: 0,
        startCol: 0,
        endRow: 2,
        endCol: 2,
      });

      expect(useDataStore.getState().isCellProtected(SHEET, 1, 1)).toBe(true);
      expect(useDataStore.getState().isCellProtected(SHEET, 5, 5)).toBe(false);
    });

    it("removes a protected range", () => {
      useDataStore.getState().addProtectedRange({
        id: "pr-1",
        sheetId: SHEET,
        startRow: 0,
        startCol: 0,
        endRow: 2,
        endCol: 2,
      });
      useDataStore.getState().removeProtectedRange(SHEET, "pr-1");
      expect(useDataStore.getState().getProtectedRanges(SHEET)).toHaveLength(0);
    });
  });

  // Slicers
  describe("slicers", () => {
    it("adds a slicer", () => {
      useDataStore.getState().addSlicer({
        id: "slicer-1",
        sheetId: SHEET,
        targetCol: 0,
        title: "Category",
        x: 100,
        y: 100,
        width: 200,
        height: 300,
        selectedValues: new Set(["A", "B"]),
      });
      expect(useDataStore.getState().getSlicer("slicer-1")).toBeDefined();
    });

    it("updates slicer selection", () => {
      useDataStore.getState().addSlicer({
        id: "slicer-1",
        sheetId: SHEET,
        targetCol: 0,
        title: "Category",
        x: 0,
        y: 0,
        width: 150,
        height: 200,
        selectedValues: new Set(["A"]),
      });

      useDataStore
        .getState()
        .updateSlicerSelection("slicer-1", new Set(["A", "B", "C"]));
      const slicer = useDataStore.getState().getSlicer("slicer-1");
      expect(slicer?.selectedValues.size).toBe(3);
    });

    it("removes a slicer", () => {
      useDataStore.getState().addSlicer({
        id: "slicer-1",
        sheetId: SHEET,
        targetCol: 0,
        title: "Test",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        selectedValues: new Set(),
      });
      useDataStore.getState().removeSlicer("slicer-1");
      expect(useDataStore.getState().getSlicer("slicer-1")).toBeUndefined();
    });

    it("gets slicers for sheet", () => {
      useDataStore.getState().addSlicer({
        id: "s1",
        sheetId: SHEET,
        targetCol: 0,
        title: "A",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        selectedValues: new Set(),
      });
      useDataStore.getState().addSlicer({
        id: "s2",
        sheetId: "sheet-2",
        targetCol: 0,
        title: "B",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        selectedValues: new Set(),
      });

      expect(useDataStore.getState().getSlicersForSheet(SHEET)).toHaveLength(1);
    });
  });
});
