/**
 * Tests for Formatting Part 2: S3-019 through S3-038.
 * Borders, merge/unmerge, paint format, text wrapping, text rotation,
 * alternating colors, clear formatting, indent, conditional formatting.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useFormatStore, evaluateColorScale } from "../stores/formatStore";
import { useCellStore } from "../stores/cellStore";
import { useUIStore } from "../stores/uiStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import type { ConditionalRule } from "../types/grid";

const SHEET = "test-sheet";

function reset() {
  useCellStore.setState({ cells: new Map() });
  useUIStore.setState({
    selectedCell: { row: 0, col: 0 },
    selections: [{ start: { row: 0, col: 0 }, end: { row: 0, col: 0 } }],
    isEditing: false,
    editValue: "",
    editingCell: null,
  });
  useSpreadsheetStore.setState({ activeSheetId: SHEET });
  useCellStore.getState().ensureSheet(SHEET);
  useFormatStore.setState({
    mergedRegions: new Map(),
    conditionalRules: new Map(),
    alternatingColors: new Map(),
    paintFormatMode: "off",
    paintFormatSource: null,
  });
}

function selectRange(sR: number, sC: number, eR: number, eC: number) {
  useUIStore.setState({
    selectedCell: { row: sR, col: sC },
    selections: [{ start: { row: sR, col: sC }, end: { row: eR, col: eC } }],
  });
}

describe("Borders (S3-019 to S3-022)", () => {
  beforeEach(reset);

  // S3-019: All sides
  it("applies borders to all sides of selected cells", () => {
    const store = useFormatStore.getState();
    const border = { style: "thin" as const, color: "#000000" };
    store.setBordersAllOnSelection(border);
    const fmt = store.getFormat(SHEET, 0, 0);
    expect(fmt?.borders?.top).toEqual(border);
    expect(fmt?.borders?.right).toEqual(border);
    expect(fmt?.borders?.bottom).toEqual(border);
    expect(fmt?.borders?.left).toEqual(border);
  });

  // S3-020: Individual sides
  it("applies border to individual sides", () => {
    const store = useFormatStore.getState();
    const border = { style: "medium" as const, color: "#ff0000" };
    store.setBordersOnSelection(["top", "bottom"], border);
    const fmt = store.getFormat(SHEET, 0, 0);
    expect(fmt?.borders?.top).toEqual(border);
    expect(fmt?.borders?.bottom).toEqual(border);
    expect(fmt?.borders?.right).toBeUndefined();
    expect(fmt?.borders?.left).toBeUndefined();
  });

  it("applies border to left side only", () => {
    const store = useFormatStore.getState();
    const border = { style: "thick" as const, color: "#0000ff" };
    store.setBordersOnSelection(["left"], border);
    const fmt = store.getFormat(SHEET, 0, 0);
    expect(fmt?.borders?.left).toEqual(border);
    expect(fmt?.borders?.top).toBeUndefined();
  });

  // S3-021: Border styles
  it("supports different border styles", () => {
    const store = useFormatStore.getState();
    const styles = ["thin", "medium", "thick", "dashed", "dotted"] as const;
    for (const style of styles) {
      store.setBordersAllOnSelection({ style, color: "#000" });
      const fmt = store.getFormat(SHEET, 0, 0);
      expect(fmt?.borders?.top?.style).toBe(style);
    }
  });

  // S3-022: Border color
  it("supports colored borders", () => {
    const store = useFormatStore.getState();
    store.setBordersAllOnSelection({
      style: "thin",
      color: "#ff6600",
    });
    expect(store.getFormat(SHEET, 0, 0)?.borders?.top?.color).toBe("#ff6600");
  });

  it("clears borders on selection", () => {
    const store = useFormatStore.getState();
    store.setBordersAllOnSelection({ style: "thin", color: "#000" });
    expect(store.getFormat(SHEET, 0, 0)?.borders?.top).toBeDefined();
    store.clearBordersOnSelection();
    expect(store.getFormat(SHEET, 0, 0)?.borders).toBeUndefined();
  });

  it("applies borders to a range", () => {
    selectRange(0, 0, 2, 2);
    const store = useFormatStore.getState();
    store.setBordersAllOnSelection({
      style: "thin",
      color: "#000000",
    });
    for (let r = 0; r <= 2; r++) {
      for (let c = 0; c <= 2; c++) {
        expect(store.getFormat(SHEET, r, c)?.borders?.top).toBeDefined();
      }
    }
  });
});

describe("Merge Cells (S3-023, S3-024)", () => {
  beforeEach(reset);

  // S3-023: Merge
  it("merges selected range", () => {
    selectRange(0, 0, 2, 2);
    useCellStore.getState().setCell(SHEET, 0, 0, { value: "Hello" });
    useCellStore.getState().setCell(SHEET, 1, 1, { value: "World" });

    useFormatStore.getState().mergeSelection();

    const regions = useFormatStore.getState().getMergedRegions(SHEET);
    expect(regions).toHaveLength(1);
    expect(regions[0]).toEqual({
      startRow: 0,
      startCol: 0,
      endRow: 2,
      endCol: 2,
    });

    // Top-left value preserved
    expect(useCellStore.getState().getCell(SHEET, 0, 0)?.value).toBe("Hello");
    // Other cells cleared
    expect(useCellStore.getState().getCell(SHEET, 1, 1)).toBeUndefined();
  });

  it("finds merged region for any cell in range", () => {
    selectRange(0, 0, 1, 1);
    useFormatStore.getState().mergeSelection();

    expect(
      useFormatStore.getState().getMergedRegion(SHEET, 0, 0),
    ).toBeDefined();
    expect(
      useFormatStore.getState().getMergedRegion(SHEET, 1, 1),
    ).toBeDefined();
    expect(
      useFormatStore.getState().getMergedRegion(SHEET, 2, 2),
    ).toBeUndefined();
  });

  it("does not merge a single cell", () => {
    selectRange(0, 0, 0, 0);
    useFormatStore.getState().mergeSelection();
    expect(useFormatStore.getState().getMergedRegions(SHEET)).toHaveLength(0);
  });

  // S3-024: Unmerge
  it("unmerges cells", () => {
    selectRange(0, 0, 1, 1);
    useFormatStore.getState().mergeSelection();
    expect(useFormatStore.getState().getMergedRegions(SHEET)).toHaveLength(1);

    selectRange(0, 0, 1, 1);
    useFormatStore.getState().unmergeSelection();
    expect(useFormatStore.getState().getMergedRegions(SHEET)).toHaveLength(0);
  });
});

describe("Paint Format (S3-025, S3-026)", () => {
  beforeEach(reset);

  // S3-025: Single click
  it("copies format and applies once in single mode", () => {
    const store = useFormatStore.getState();
    store.setFormat(SHEET, 0, 0, { bold: true, textColor: "#ff0000" });

    useUIStore.setState({ selectedCell: { row: 0, col: 0 } });
    store.startPaintFormat(false);
    expect(useFormatStore.getState().paintFormatMode).toBe("single");

    store.applyPaintFormat(SHEET, 1, 0);

    const fmt = store.getFormat(SHEET, 1, 0);
    expect(fmt?.bold).toBe(true);
    expect(fmt?.textColor).toBe("#ff0000");

    // Should auto-exit single mode
    expect(useFormatStore.getState().paintFormatMode).toBe("off");
  });

  // S3-026: Persistent mode
  it("stays active in persistent mode", () => {
    const store = useFormatStore.getState();
    store.setFormat(SHEET, 0, 0, { italic: true });

    useUIStore.setState({ selectedCell: { row: 0, col: 0 } });
    store.startPaintFormat(true);
    expect(useFormatStore.getState().paintFormatMode).toBe("persistent");

    store.applyPaintFormat(SHEET, 1, 0);
    expect(useFormatStore.getState().paintFormatMode).toBe("persistent");

    store.applyPaintFormat(SHEET, 2, 0);
    expect(useFormatStore.getState().paintFormatMode).toBe("persistent");
    expect(store.getFormat(SHEET, 2, 0)?.italic).toBe(true);

    store.cancelPaintFormat();
    expect(useFormatStore.getState().paintFormatMode).toBe("off");
  });
});

describe("Text Wrapping (S3-027, S3-028, S3-029)", () => {
  beforeEach(reset);

  // S3-027: Overflow
  it("sets overflow wrap mode", () => {
    const store = useFormatStore.getState();
    store.setFormatOnSelection({ wrapText: "overflow" });
    expect(store.getFormat(SHEET, 0, 0)?.wrapText).toBe("overflow");
  });

  // S3-028: Wrap
  it("sets wrap mode", () => {
    const store = useFormatStore.getState();
    store.setFormatOnSelection({ wrapText: "wrap" });
    expect(store.getFormat(SHEET, 0, 0)?.wrapText).toBe("wrap");
  });

  // S3-029: Clip
  it("sets clip mode", () => {
    const store = useFormatStore.getState();
    store.setFormatOnSelection({ wrapText: "clip" });
    expect(store.getFormat(SHEET, 0, 0)?.wrapText).toBe("clip");
  });
});

describe("Text Rotation (S3-030)", () => {
  beforeEach(reset);

  it("sets text rotation angle", () => {
    const store = useFormatStore.getState();
    store.setFormatOnSelection({ textRotation: 45 });
    expect(store.getFormat(SHEET, 0, 0)?.textRotation).toBe(45);
  });

  it("sets negative rotation", () => {
    const store = useFormatStore.getState();
    store.setFormatOnSelection({ textRotation: -90 });
    expect(store.getFormat(SHEET, 0, 0)?.textRotation).toBe(-90);
  });
});

describe("Alternating Row Colors (S3-031)", () => {
  beforeEach(reset);

  it("sets alternating colors", () => {
    const store = useFormatStore.getState();
    store.setAlternatingColors(SHEET, ["#ffffff", "#f0f0f0"]);
    const colors = store.getAlternatingColors(SHEET);
    expect(colors).toEqual(["#ffffff", "#f0f0f0"]);
  });

  it("clears alternating colors", () => {
    const store = useFormatStore.getState();
    store.setAlternatingColors(SHEET, ["#fff", "#eee"]);
    store.setAlternatingColors(SHEET, null);
    expect(store.getAlternatingColors(SHEET)).toBeNull();
  });
});

describe("Clear Formatting (S3-032)", () => {
  beforeEach(reset);

  it("clears all formatting from selection", () => {
    const store = useFormatStore.getState();
    useCellStore.getState().setCell(SHEET, 0, 0, {
      value: 42,
      format: {
        bold: true,
        italic: true,
        textColor: "#ff0000",
        fontSize: 24,
      },
    });

    store.clearFormattingOnSelection();

    const cell = useCellStore.getState().getCell(SHEET, 0, 0);
    expect(cell?.value).toBe(42); // Value preserved
    expect(cell?.format).toBeUndefined(); // Format cleared
  });

  it("clears formatting for range", () => {
    selectRange(0, 0, 1, 1);
    const store = useFormatStore.getState();
    store.setFormatForRange(SHEET, 0, 0, 1, 1, { bold: true });
    store.clearFormattingOnSelection();

    for (let r = 0; r <= 1; r++) {
      for (let c = 0; c <= 1; c++) {
        const cell = useCellStore.getState().getCell(SHEET, r, c);
        expect(cell?.format).toBeUndefined();
      }
    }
  });
});

describe("Indentation (S3-033, S3-034)", () => {
  beforeEach(reset);

  // S3-033: Increase indent
  it("increases indent level", () => {
    const store = useFormatStore.getState();
    store.increaseIndent();
    expect(store.getFormat(SHEET, 0, 0)?.indent).toBe(1);
    store.increaseIndent();
    expect(store.getFormat(SHEET, 0, 0)?.indent).toBe(2);
  });

  it("caps indent at 10", () => {
    const store = useFormatStore.getState();
    store.setFormat(SHEET, 0, 0, { indent: 10 });
    store.increaseIndent();
    expect(store.getFormat(SHEET, 0, 0)?.indent).toBe(10);
  });

  // S3-034: Decrease indent
  it("decreases indent level", () => {
    const store = useFormatStore.getState();
    store.setFormat(SHEET, 0, 0, { indent: 3 });
    store.decreaseIndent();
    expect(store.getFormat(SHEET, 0, 0)?.indent).toBe(2);
  });

  it("does not go below 0", () => {
    const store = useFormatStore.getState();
    store.decreaseIndent();
    expect(store.getFormat(SHEET, 0, 0)?.indent).toBe(0);
  });
});

describe("Toolbar reflects format (S3-035)", () => {
  beforeEach(reset);

  it("getFormat returns current cell format for toolbar display", () => {
    const store = useFormatStore.getState();
    store.setFormat(SHEET, 0, 0, {
      bold: true,
      fontSize: 18,
      fontFamily: "Georgia",
    });

    const fmt = store.getFormat(SHEET, 0, 0);
    expect(fmt?.bold).toBe(true);
    expect(fmt?.fontSize).toBe(18);
    expect(fmt?.fontFamily).toBe("Georgia");
  });
});

describe("Conditional Formatting — Value Rules (S3-036)", () => {
  beforeEach(reset);

  it("highlights cells greater than threshold", () => {
    const store = useFormatStore.getState();
    const rule: ConditionalRule = {
      id: "rule-1",
      range: { startRow: 0, startCol: 0, endRow: 10, endCol: 0 },
      type: "value",
      condition: "greaterThan",
      values: ["50"],
      format: { backgroundColor: "#ff0000" },
      priority: 1,
    };
    store.addConditionalRule(SHEET, rule);

    const result = store.evaluateConditionalFormat(SHEET, 0, 0, 75);
    expect(result?.backgroundColor).toBe("#ff0000");

    const noMatch = store.evaluateConditionalFormat(SHEET, 0, 0, 25);
    expect(noMatch).toBeNull();
  });

  it("highlights cells less than threshold", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(SHEET, {
      id: "rule-2",
      range: { startRow: 0, startCol: 0, endRow: 10, endCol: 0 },
      type: "value",
      condition: "lessThan",
      values: ["10"],
      format: { textColor: "#0000ff" },
      priority: 1,
    });

    expect(store.evaluateConditionalFormat(SHEET, 0, 0, 5)?.textColor).toBe(
      "#0000ff",
    );
    expect(store.evaluateConditionalFormat(SHEET, 0, 0, 15)).toBeNull();
  });

  it("highlights cells equal to value", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(SHEET, {
      id: "rule-3",
      range: { startRow: 0, startCol: 0, endRow: 10, endCol: 0 },
      type: "value",
      condition: "equalTo",
      values: ["42"],
      format: { bold: true },
      priority: 1,
    });

    expect(store.evaluateConditionalFormat(SHEET, 0, 0, 42)?.bold).toBe(true);
    expect(store.evaluateConditionalFormat(SHEET, 0, 0, 43)).toBeNull();
  });

  it("highlights cells between two values", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(SHEET, {
      id: "rule-4",
      range: { startRow: 0, startCol: 0, endRow: 10, endCol: 0 },
      type: "value",
      condition: "between",
      values: ["10", "20"],
      format: { backgroundColor: "#00ff00" },
      priority: 1,
    });

    expect(
      store.evaluateConditionalFormat(SHEET, 0, 0, 15)?.backgroundColor,
    ).toBe("#00ff00");
    expect(store.evaluateConditionalFormat(SHEET, 0, 0, 5)).toBeNull();
    expect(store.evaluateConditionalFormat(SHEET, 0, 0, 25)).toBeNull();
  });

  it("does not apply to cells outside range", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(SHEET, {
      id: "rule-5",
      range: { startRow: 0, startCol: 0, endRow: 5, endCol: 0 },
      type: "value",
      condition: "greaterThan",
      values: ["0"],
      format: { bold: true },
      priority: 1,
    });

    expect(store.evaluateConditionalFormat(SHEET, 10, 0, 100)).toBeNull();
  });
});

describe("Conditional Formatting — Text Rules (S3-037)", () => {
  beforeEach(reset);

  it("highlights cells containing text", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(SHEET, {
      id: "text-1",
      range: { startRow: 0, startCol: 0, endRow: 10, endCol: 5 },
      type: "text",
      condition: "contains",
      values: ["error"],
      format: { backgroundColor: "#ffcccc" },
      priority: 1,
    });

    expect(
      store.evaluateConditionalFormat(SHEET, 0, 0, "Error found"),
    ).toBeDefined();
    expect(store.evaluateConditionalFormat(SHEET, 0, 0, "All good")).toBeNull();
  });

  it("highlights cells starting with text", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(SHEET, {
      id: "text-2",
      range: { startRow: 0, startCol: 0, endRow: 10, endCol: 5 },
      type: "text",
      condition: "startsWith",
      values: ["inv"],
      format: { italic: true },
      priority: 1,
    });

    expect(
      store.evaluateConditionalFormat(SHEET, 0, 0, "INV-001")?.italic,
    ).toBe(true);
    expect(
      store.evaluateConditionalFormat(SHEET, 0, 0, "Order-001"),
    ).toBeNull();
  });

  it("highlights cells ending with text", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(SHEET, {
      id: "text-3",
      range: { startRow: 0, startCol: 0, endRow: 10, endCol: 5 },
      type: "text",
      condition: "endsWith",
      values: [".pdf"],
      format: { underline: true },
      priority: 1,
    });

    expect(
      store.evaluateConditionalFormat(SHEET, 0, 0, "report.pdf")?.underline,
    ).toBe(true);
    expect(
      store.evaluateConditionalFormat(SHEET, 0, 0, "report.doc"),
    ).toBeNull();
  });
});

describe("Conditional Formatting — Color Scales (S3-038)", () => {
  beforeEach(reset);

  it("evaluates 2-color scale", () => {
    const rule: ConditionalRule = {
      id: "cs-1",
      range: { startRow: 0, startCol: 0, endRow: 10, endCol: 0 },
      type: "colorScale",
      condition: "colorScale",
      values: ["#ff0000", "#00ff00"],
      format: {},
      priority: 1,
    };

    // At min → red
    expect(evaluateColorScale(rule, 0, 0, 100)).toBe("#ff0000");
    // At max → green
    expect(evaluateColorScale(rule, 100, 0, 100)).toBe("#00ff00");
    // At midpoint → yellow-ish
    const mid = evaluateColorScale(rule, 50, 0, 100);
    expect(mid).toBeDefined();
    expect(mid?.startsWith("#")).toBe(true);
  });

  it("evaluates 3-color scale", () => {
    const rule: ConditionalRule = {
      id: "cs-2",
      range: { startRow: 0, startCol: 0, endRow: 10, endCol: 0 },
      type: "colorScale",
      condition: "colorScale",
      values: ["#ff0000", "#ffff00", "#00ff00"],
      format: {},
      priority: 1,
    };

    expect(evaluateColorScale(rule, 0, 0, 100)).toBe("#ff0000");
    expect(evaluateColorScale(rule, 50, 0, 100)).toBe("#ffff00");
    expect(evaluateColorScale(rule, 100, 0, 100)).toBe("#00ff00");
  });

  it("handles equal min/max", () => {
    const rule: ConditionalRule = {
      id: "cs-3",
      range: { startRow: 0, startCol: 0, endRow: 10, endCol: 0 },
      type: "colorScale",
      condition: "colorScale",
      values: ["#ff0000", "#00ff00"],
      format: {},
      priority: 1,
    };

    expect(evaluateColorScale(rule, 50, 50, 50)).toBe("#ff0000");
  });
});

describe("Conditional rule management", () => {
  beforeEach(reset);

  it("adds and removes conditional rules", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(SHEET, {
      id: "r1",
      range: { startRow: 0, startCol: 0, endRow: 5, endCol: 5 },
      type: "value",
      condition: "greaterThan",
      values: ["10"],
      format: { bold: true },
      priority: 1,
    });

    expect(store.getConditionalRules(SHEET)).toHaveLength(1);

    store.removeConditionalRule(SHEET, "r1");
    expect(store.getConditionalRules(SHEET)).toHaveLength(0);
  });

  it("respects priority ordering", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(SHEET, {
      id: "low-priority",
      range: { startRow: 0, startCol: 0, endRow: 10, endCol: 0 },
      type: "value",
      condition: "greaterThan",
      values: ["0"],
      format: { backgroundColor: "#ff0000" },
      priority: 10,
    });
    store.addConditionalRule(SHEET, {
      id: "high-priority",
      range: { startRow: 0, startCol: 0, endRow: 10, endCol: 0 },
      type: "value",
      condition: "greaterThan",
      values: ["0"],
      format: { backgroundColor: "#00ff00" },
      priority: 1,
    });

    // High priority wins
    const result = store.evaluateConditionalFormat(SHEET, 0, 0, 5);
    expect(result?.backgroundColor).toBe("#00ff00");
  });
});
