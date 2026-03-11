import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormulaBar } from "../components/formula-bar/FormulaBar";
import { useUIStore } from "../stores/uiStore";
import { useCellStore } from "../stores/cellStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import { useNamedRangeStore } from "../stores/namedRangeStore";

function renderFormulaBar() {
  return render(<FormulaBar />);
}

describe("FormulaBar", () => {
  beforeEach(() => {
    useSpreadsheetStore.setState({
      id: "spreadsheet-1",
      title: "Test",
      sheets: [],
      activeSheetId: "sheet-1",
    });
    useUIStore.setState({
      selectedCell: { row: 0, col: 0 },
      isEditing: false,
      editValue: "",
      editingCell: null,
    });
    useNamedRangeStore.setState({ ranges: new Map() });
  });

  describe("expand/collapse", () => {
    it("renders expand toggle button", () => {
      renderFormulaBar();
      expect(
        screen.getByTestId("formula-bar-expand-toggle"),
      ).toBeInTheDocument();
    });

    it("toggles formula bar height on click", () => {
      renderFormulaBar();
      const bar = screen.getByTestId("formula-bar");
      expect(bar.style.height).toBe("30px");

      fireEvent.mouseDown(screen.getByTestId("formula-bar-expand-toggle"));
      expect(bar.style.height).toBe("90px");

      fireEvent.mouseDown(screen.getByTestId("formula-bar-expand-toggle"));
      expect(bar.style.height).toBe("30px");
    });
  });

  describe("fx button and function picker", () => {
    it("renders fx button", () => {
      renderFormulaBar();
      expect(screen.getByTestId("fx-button")).toBeInTheDocument();
    });

    it("opens function picker on fx click", () => {
      renderFormulaBar();
      fireEvent.mouseDown(screen.getByTestId("fx-button"));
      expect(screen.getByTestId("function-picker")).toBeInTheDocument();
      expect(screen.getByTestId("function-picker-search")).toBeInTheDocument();
    });

    it("closes function picker on second fx click", () => {
      renderFormulaBar();
      fireEvent.mouseDown(screen.getByTestId("fx-button"));
      expect(screen.getByTestId("function-picker")).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId("fx-button"));
      expect(screen.queryByTestId("function-picker")).not.toBeInTheDocument();
    });

    it("filters functions by search query", () => {
      renderFormulaBar();
      fireEvent.mouseDown(screen.getByTestId("fx-button"));
      const search = screen.getByTestId("function-picker-search");
      fireEvent.change(search, { target: { value: "SUM" } });
      expect(
        screen.getByTestId("function-picker-item-SUM"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("function-picker-item-SUMIF"),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("function-picker-item-AVERAGE"),
      ).not.toBeInTheDocument();
    });

    it("switches category tabs", () => {
      renderFormulaBar();
      fireEvent.mouseDown(screen.getByTestId("fx-button"));
      fireEvent.mouseDown(
        screen.getByTestId("function-picker-category-Logical"),
      );
      expect(screen.getByTestId("function-picker-item-IF")).toBeInTheDocument();
      expect(
        screen.queryByTestId("function-picker-item-SUM"),
      ).not.toBeInTheDocument();
    });
  });

  describe("formula error indicator", () => {
    it("does not show error indicator when no error", () => {
      useCellStore.getState().setCell("sheet-1", 0, 0, {
        value: 42,
        formula: "=21*2",
      });
      renderFormulaBar();
      expect(
        screen.queryByTestId("formula-error-indicator"),
      ).not.toBeInTheDocument();
    });

    it("shows error indicator when cell has formula error", () => {
      useCellStore.getState().setCell("sheet-1", 0, 0, {
        value: "#DIV/0!",
        formula: "=1/0",
      });
      renderFormulaBar();
      expect(screen.getByTestId("formula-error-indicator")).toBeInTheDocument();
    });
  });

  describe("name box dropdown", () => {
    it("renders dropdown toggle button", () => {
      renderFormulaBar();
      expect(
        screen.getByTestId("name-box-dropdown-toggle"),
      ).toBeInTheDocument();
    });

    it("opens dropdown showing empty message when no named ranges", () => {
      renderFormulaBar();
      fireEvent.mouseDown(screen.getByTestId("name-box-dropdown-toggle"));
      expect(screen.getByTestId("name-box-dropdown")).toBeInTheDocument();
      expect(screen.getByText("No named ranges defined")).toBeInTheDocument();
    });

    it("lists named ranges in dropdown", () => {
      const rangesMap = new Map();
      rangesMap.set("Revenue", {
        name: "Revenue",
        sheetId: "sheet-1",
        startRow: 0,
        startCol: 0,
        endRow: 9,
        endCol: 0,
      });
      useNamedRangeStore.setState({ ranges: rangesMap });

      renderFormulaBar();
      fireEvent.mouseDown(screen.getByTestId("name-box-dropdown-toggle"));
      expect(
        screen.getByTestId("name-box-dropdown-item-Revenue"),
      ).toBeInTheDocument();
    });
  });
});
