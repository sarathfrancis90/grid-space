/**
 * Tests for format store — format operations on cells.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useFormatStore } from "../stores/formatStore";
import { useCellStore } from "../stores/cellStore";
import { useUIStore } from "../stores/uiStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";

const SHEET_ID = "test-sheet";

function resetStores() {
  useCellStore.setState({ cells: new Map() });
  useUIStore.setState({
    selectedCell: { row: 0, col: 0 },
    selections: [{ start: { row: 0, col: 0 }, end: { row: 0, col: 0 } }],
    isEditing: false,
    editValue: "",
    editingCell: null,
  });
  useSpreadsheetStore.setState({ activeSheetId: SHEET_ID });
  useCellStore.getState().ensureSheet(SHEET_ID);
}

describe("formatStore", () => {
  beforeEach(() => {
    resetStores();
  });

  // S3-001: Bold
  describe("Bold (S3-001)", () => {
    it("sets bold on a cell", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { bold: true });
      const fmt = store.getFormat(SHEET_ID, 0, 0);
      expect(fmt?.bold).toBe(true);
    });

    it("toggles bold on selection", () => {
      const store = useFormatStore.getState();
      store.toggleFormatOnSelection("bold");
      const fmt = store.getFormat(SHEET_ID, 0, 0);
      expect(fmt?.bold).toBe(true);

      // Toggle again
      store.toggleFormatOnSelection("bold");
      const fmt2 = store.getFormat(SHEET_ID, 0, 0);
      expect(fmt2?.bold).toBe(false);
    });
  });

  // S3-002: Italic
  describe("Italic (S3-002)", () => {
    it("sets italic on a cell", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { italic: true });
      const fmt = store.getFormat(SHEET_ID, 0, 0);
      expect(fmt?.italic).toBe(true);
    });

    it("toggles italic on selection", () => {
      const store = useFormatStore.getState();
      store.toggleFormatOnSelection("italic");
      expect(store.getFormat(SHEET_ID, 0, 0)?.italic).toBe(true);
      store.toggleFormatOnSelection("italic");
      expect(store.getFormat(SHEET_ID, 0, 0)?.italic).toBe(false);
    });
  });

  // S3-003: Underline
  describe("Underline (S3-003)", () => {
    it("sets underline on a cell", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { underline: true });
      expect(store.getFormat(SHEET_ID, 0, 0)?.underline).toBe(true);
    });

    it("toggles underline", () => {
      const store = useFormatStore.getState();
      store.toggleFormatOnSelection("underline");
      expect(store.getFormat(SHEET_ID, 0, 0)?.underline).toBe(true);
    });
  });

  // S3-004: Strikethrough
  describe("Strikethrough (S3-004)", () => {
    it("sets strikethrough on a cell", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { strikethrough: true });
      expect(store.getFormat(SHEET_ID, 0, 0)?.strikethrough).toBe(true);
    });

    it("toggles strikethrough", () => {
      const store = useFormatStore.getState();
      store.toggleFormatOnSelection("strikethrough");
      expect(store.getFormat(SHEET_ID, 0, 0)?.strikethrough).toBe(true);
    });
  });

  // S3-005: Font family
  describe("Font family (S3-005)", () => {
    it("sets font family", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { fontFamily: "Times New Roman" });
      expect(store.getFormat(SHEET_ID, 0, 0)?.fontFamily).toBe(
        "Times New Roman",
      );
    });

    it("sets font family on selection", () => {
      const store = useFormatStore.getState();
      store.setFormatOnSelection({ fontFamily: "Courier New" });
      expect(store.getFormat(SHEET_ID, 0, 0)?.fontFamily).toBe("Courier New");
    });
  });

  // S3-006: Font size
  describe("Font size (S3-006)", () => {
    it("sets font size", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { fontSize: 24 });
      expect(store.getFormat(SHEET_ID, 0, 0)?.fontSize).toBe(24);
    });

    it("sets font size on selection", () => {
      const store = useFormatStore.getState();
      store.setFormatOnSelection({ fontSize: 14 });
      expect(store.getFormat(SHEET_ID, 0, 0)?.fontSize).toBe(14);
    });
  });

  // S3-007: Text color
  describe("Text color (S3-007)", () => {
    it("sets text color", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { textColor: "#ff0000" });
      expect(store.getFormat(SHEET_ID, 0, 0)?.textColor).toBe("#ff0000");
    });

    it("sets text color on selection", () => {
      const store = useFormatStore.getState();
      store.setFormatOnSelection({ textColor: "#00ff00" });
      expect(store.getFormat(SHEET_ID, 0, 0)?.textColor).toBe("#00ff00");
    });
  });

  // S3-008: Background color
  describe("Background color (S3-008)", () => {
    it("sets background color", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { backgroundColor: "#ffff00" });
      expect(store.getFormat(SHEET_ID, 0, 0)?.backgroundColor).toBe("#ffff00");
    });

    it("sets background color on selection", () => {
      const store = useFormatStore.getState();
      store.setFormatOnSelection({ backgroundColor: "#0000ff" });
      expect(store.getFormat(SHEET_ID, 0, 0)?.backgroundColor).toBe("#0000ff");
    });
  });

  // S3-009: Horizontal alignment
  describe("Horizontal alignment (S3-009)", () => {
    it("sets left alignment", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { horizontalAlign: "left" });
      expect(store.getFormat(SHEET_ID, 0, 0)?.horizontalAlign).toBe("left");
    });

    it("sets center alignment", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { horizontalAlign: "center" });
      expect(store.getFormat(SHEET_ID, 0, 0)?.horizontalAlign).toBe("center");
    });

    it("sets right alignment", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { horizontalAlign: "right" });
      expect(store.getFormat(SHEET_ID, 0, 0)?.horizontalAlign).toBe("right");
    });
  });

  // S3-010: Vertical alignment
  describe("Vertical alignment (S3-010)", () => {
    it("sets top alignment", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { verticalAlign: "top" });
      expect(store.getFormat(SHEET_ID, 0, 0)?.verticalAlign).toBe("top");
    });

    it("sets middle alignment", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { verticalAlign: "middle" });
      expect(store.getFormat(SHEET_ID, 0, 0)?.verticalAlign).toBe("middle");
    });

    it("sets bottom alignment", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { verticalAlign: "bottom" });
      expect(store.getFormat(SHEET_ID, 0, 0)?.verticalAlign).toBe("bottom");
    });
  });

  // Range formatting
  describe("Range formatting", () => {
    it("applies format to a range of cells", () => {
      useUIStore.setState({
        selectedCell: { row: 0, col: 0 },
        selections: [{ start: { row: 0, col: 0 }, end: { row: 2, col: 2 } }],
      });

      const store = useFormatStore.getState();
      store.setFormatForRange(SHEET_ID, 0, 0, 2, 2, { bold: true });

      // Check all cells in range
      for (let r = 0; r <= 2; r++) {
        for (let c = 0; c <= 2; c++) {
          expect(store.getFormat(SHEET_ID, r, c)?.bold).toBe(true);
        }
      }
    });

    it("merges formats without overwriting unrelated properties", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { bold: true, fontSize: 14 });
      store.setFormat(SHEET_ID, 0, 0, { italic: true });

      const fmt = store.getFormat(SHEET_ID, 0, 0);
      expect(fmt?.bold).toBe(true);
      expect(fmt?.italic).toBe(true);
      expect(fmt?.fontSize).toBe(14);
    });

    it("preserves cell value when setting format", () => {
      useCellStore.getState().setCell(SHEET_ID, 0, 0, {
        value: 42,
        formula: undefined,
      });
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { bold: true });

      const cell = useCellStore.getState().getCell(SHEET_ID, 0, 0);
      expect(cell?.value).toBe(42);
      expect(cell?.format?.bold).toBe(true);
    });
  });

  // Multi-cell selection formatting
  describe("Multi-cell selection formatting", () => {
    it("toggles bold on all cells in a multi-cell selection", () => {
      useUIStore.setState({
        selectedCell: { row: 0, col: 0 },
        selections: [{ start: { row: 0, col: 0 }, end: { row: 2, col: 2 } }],
      });

      const store = useFormatStore.getState();
      store.toggleFormatOnSelection("bold");

      for (let r = 0; r <= 2; r++) {
        for (let c = 0; c <= 2; c++) {
          expect(store.getFormat(SHEET_ID, r, c)?.bold).toBe(true);
        }
      }
    });

    it("applies setFormatOnSelection to all cells in range", () => {
      useUIStore.setState({
        selectedCell: { row: 0, col: 0 },
        selections: [{ start: { row: 0, col: 0 }, end: { row: 2, col: 2 } }],
      });

      const store = useFormatStore.getState();
      store.setFormatOnSelection({ fontSize: 24, textColor: "#ff0000" });

      for (let r = 0; r <= 2; r++) {
        for (let c = 0; c <= 2; c++) {
          const fmt = store.getFormat(SHEET_ID, r, c);
          expect(fmt?.fontSize).toBe(24);
          expect(fmt?.textColor).toBe("#ff0000");
        }
      }
    });

    it("toggles italic on multi-cell selection and back", () => {
      useUIStore.setState({
        selectedCell: { row: 1, col: 1 },
        selections: [{ start: { row: 1, col: 1 }, end: { row: 3, col: 3 } }],
      });

      const store = useFormatStore.getState();
      store.toggleFormatOnSelection("italic");

      for (let r = 1; r <= 3; r++) {
        for (let c = 1; c <= 3; c++) {
          expect(store.getFormat(SHEET_ID, r, c)?.italic).toBe(true);
        }
      }

      // Toggle off
      store.toggleFormatOnSelection("italic");
      for (let r = 1; r <= 3; r++) {
        for (let c = 1; c <= 3; c++) {
          expect(store.getFormat(SHEET_ID, r, c)?.italic).toBe(false);
        }
      }
    });

    it("preserves existing cell values when formatting a range", () => {
      const cellStore = useCellStore.getState();
      cellStore.setCell(SHEET_ID, 0, 0, { value: "Hello", formula: undefined });
      cellStore.setCell(SHEET_ID, 0, 1, { value: 42, formula: undefined });
      cellStore.setCell(SHEET_ID, 1, 0, { value: "World", formula: undefined });

      useUIStore.setState({
        selectedCell: { row: 0, col: 0 },
        selections: [{ start: { row: 0, col: 0 }, end: { row: 1, col: 1 } }],
      });

      useFormatStore.getState().setFormatOnSelection({ bold: true });

      const cs = useCellStore.getState();
      expect(cs.getCell(SHEET_ID, 0, 0)?.value).toBe("Hello");
      expect(cs.getCell(SHEET_ID, 0, 0)?.format?.bold).toBe(true);
      expect(cs.getCell(SHEET_ID, 0, 1)?.value).toBe(42);
      expect(cs.getCell(SHEET_ID, 0, 1)?.format?.bold).toBe(true);
      expect(cs.getCell(SHEET_ID, 1, 0)?.value).toBe("World");
      expect(cs.getCell(SHEET_ID, 1, 0)?.format?.bold).toBe(true);
    });

    it("clears formatting on all cells in selection", () => {
      useUIStore.setState({
        selectedCell: { row: 0, col: 0 },
        selections: [{ start: { row: 0, col: 0 }, end: { row: 1, col: 1 } }],
      });

      const cellStore = useCellStore.getState();
      cellStore.setCell(SHEET_ID, 0, 0, {
        value: "A",
        formula: undefined,
        format: { bold: true, italic: true },
      });
      cellStore.setCell(SHEET_ID, 0, 1, {
        value: "B",
        formula: undefined,
        format: { bold: true, fontSize: 24 },
      });
      cellStore.setCell(SHEET_ID, 1, 0, {
        value: "C",
        formula: undefined,
        format: { underline: true },
      });

      useFormatStore.getState().clearFormattingOnSelection();

      const cs = useCellStore.getState();
      expect(cs.getCell(SHEET_ID, 0, 0)?.format).toBeUndefined();
      expect(cs.getCell(SHEET_ID, 0, 0)?.value).toBe("A");
      expect(cs.getCell(SHEET_ID, 0, 1)?.format).toBeUndefined();
      expect(cs.getCell(SHEET_ID, 0, 1)?.value).toBe("B");
      expect(cs.getCell(SHEET_ID, 1, 0)?.format).toBeUndefined();
      expect(cs.getCell(SHEET_ID, 1, 0)?.value).toBe("C");
    });
  });

  // Number format on cells
  describe("Number format on cells (S3-011 to S3-018)", () => {
    it("sets number format General", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { numberFormat: "General" });
      expect(store.getFormat(SHEET_ID, 0, 0)?.numberFormat).toBe("General");
    });

    it("sets number format with thousands separator", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { numberFormat: "#,##0.00" });
      expect(store.getFormat(SHEET_ID, 0, 0)?.numberFormat).toBe("#,##0.00");
    });

    it("sets currency format", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { numberFormat: "$#,##0.00" });
      expect(store.getFormat(SHEET_ID, 0, 0)?.numberFormat).toBe("$#,##0.00");
    });

    it("sets percent format", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { numberFormat: "0.00%" });
      expect(store.getFormat(SHEET_ID, 0, 0)?.numberFormat).toBe("0.00%");
    });

    it("sets date format", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { numberFormat: "yyyy-mm-dd" });
      expect(store.getFormat(SHEET_ID, 0, 0)?.numberFormat).toBe("yyyy-mm-dd");
    });

    it("sets scientific format", () => {
      const store = useFormatStore.getState();
      store.setFormat(SHEET_ID, 0, 0, { numberFormat: "0.00E+0" });
      expect(store.getFormat(SHEET_ID, 0, 0)?.numberFormat).toBe("0.00E+0");
    });
  });
});
