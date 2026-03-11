import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../stores/uiStore";
import { useNamedRangeStore } from "../stores/namedRangeStore";
import { isFormulaError } from "../types/formula";

describe("FormulaBar enhancements", () => {
  beforeEach(() => {
    useUIStore.setState({
      selectedCell: null,
      selections: [],
      isEditing: false,
      editValue: "",
      editingCell: null,
      isFormulaBarExpanded: false,
      isFunctionPickerOpen: false,
    });
    useNamedRangeStore.setState({ ranges: new Map() });
  });

  describe("expand/collapse state", () => {
    it("starts collapsed by default", () => {
      expect(useUIStore.getState().isFormulaBarExpanded).toBe(false);
    });

    it("toggles expanded state", () => {
      useUIStore.getState().setFormulaBarExpanded(true);
      expect(useUIStore.getState().isFormulaBarExpanded).toBe(true);

      useUIStore.getState().setFormulaBarExpanded(false);
      expect(useUIStore.getState().isFormulaBarExpanded).toBe(false);
    });
  });

  describe("function picker state", () => {
    it("starts closed by default", () => {
      expect(useUIStore.getState().isFunctionPickerOpen).toBe(false);
    });

    it("opens and closes function picker", () => {
      useUIStore.getState().setFunctionPickerOpen(true);
      expect(useUIStore.getState().isFunctionPickerOpen).toBe(true);

      useUIStore.getState().setFunctionPickerOpen(false);
      expect(useUIStore.getState().isFunctionPickerOpen).toBe(false);
    });
  });

  describe("formula error detection", () => {
    it("detects #DIV/0! as formula error", () => {
      expect(isFormulaError("#DIV/0!")).toBe(true);
    });

    it("detects #VALUE! as formula error", () => {
      expect(isFormulaError("#VALUE!")).toBe(true);
    });

    it("detects #NAME? as formula error", () => {
      expect(isFormulaError("#NAME?")).toBe(true);
    });

    it("detects #REF! as formula error", () => {
      expect(isFormulaError("#REF!")).toBe(true);
    });

    it("does not detect normal values as errors", () => {
      expect(isFormulaError("hello")).toBe(false);
      expect(isFormulaError(42)).toBe(false);
      expect(isFormulaError(null)).toBe(false);
    });
  });

  describe("named ranges dropdown", () => {
    it("lists named ranges from store", () => {
      useNamedRangeStore.getState().addRange({
        name: "Revenue",
        sheetId: "sheet1",
        startRow: 0,
        startCol: 0,
        endRow: 9,
        endCol: 0,
      });
      useNamedRangeStore.getState().addRange({
        name: "Expenses",
        sheetId: "sheet1",
        startRow: 0,
        startCol: 1,
        endRow: 9,
        endCol: 1,
      });

      const ranges = useNamedRangeStore.getState().getAllRanges();
      expect(ranges).toHaveLength(2);
      expect(ranges.map((r) => r.name)).toContain("Revenue");
      expect(ranges.map((r) => r.name)).toContain("Expenses");
    });

    it("resolves named range to cell position", () => {
      useNamedRangeStore.getState().addRange({
        name: "TestRange",
        sheetId: "sheet1",
        startRow: 5,
        startCol: 3,
        endRow: 10,
        endCol: 3,
      });

      const resolved = useNamedRangeStore.getState().resolveRange("TestRange");
      expect(resolved).toEqual({
        sheetId: "sheet1",
        start: { row: 5, col: 3 },
        end: { row: 10, col: 3 },
      });
    });
  });
});
