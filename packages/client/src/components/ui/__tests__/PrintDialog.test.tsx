import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PrintDialog } from "../PrintDialog";

// Mock stores
vi.mock("../../../stores/uiStore", () => ({
  useUIStore: vi.fn((selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      isPrintDialogOpen: true,
      setPrintDialogOpen: mockClose,
      selections: [{ start: { row: 0, col: 0 }, end: { row: 2, col: 2 } }],
    }),
  ),
}));

vi.mock("../../../stores/cellStore", () => ({
  useCellStore: vi.fn((selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      getLastDataPosition: () => ({ row: 2, col: 2 }),
      getCell: (_sheetId: string, row: number, col: number) => {
        if (row === 0 && col === 0) return { value: "Hello" };
        if (row === 0 && col === 1) return { value: 42 };
        return undefined;
      },
    }),
  ),
}));

vi.mock("../../../stores/spreadsheetStore", () => ({
  useSpreadsheetStore: vi.fn(
    (selector: (state: Record<string, unknown>) => unknown) =>
      selector({ activeSheetId: "sheet-1" }),
  ),
}));

const mockClose = vi.fn();

describe("PrintDialog", () => {
  beforeEach(() => {
    mockClose.mockClear();
  });

  it("renders print dialog with all sections", () => {
    render(<PrintDialog />);
    expect(screen.getByTestId("print-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("print-preview-panel")).toBeInTheDocument();
    expect(screen.getByText("Print Settings")).toBeInTheDocument();
  });

  it("renders page size selector with options", () => {
    render(<PrintDialog />);
    const pageSize = screen.getByTestId("print-page-size");
    expect(pageSize).toBeInTheDocument();
    expect(pageSize).toHaveValue("letter");
  });

  it("renders scale mode selector", () => {
    render(<PrintDialog />);
    const scaleMode = screen.getByTestId("print-scale-mode");
    expect(scaleMode).toBeInTheDocument();
    expect(scaleMode).toHaveValue("actual");
  });

  it("renders print range selector", () => {
    render(<PrintDialog />);
    const range = screen.getByTestId("print-range");
    expect(range).toBeInTheDocument();
    expect(range).toHaveValue("current-sheet");
  });

  it("renders gridlines and headers checkboxes", () => {
    render(<PrintDialog />);
    expect(screen.getByTestId("print-gridlines")).toBeInTheDocument();
    expect(screen.getByTestId("print-headers")).toBeInTheDocument();
  });

  it("gridlines checkbox defaults to checked", () => {
    render(<PrintDialog />);
    const gridlines = screen.getByTestId("print-gridlines") as HTMLInputElement;
    expect(gridlines.checked).toBe(true);
  });

  it("headers checkbox defaults to unchecked", () => {
    render(<PrintDialog />);
    const headers = screen.getByTestId("print-headers") as HTMLInputElement;
    expect(headers.checked).toBe(false);
  });

  it("toggles gridlines checkbox", () => {
    render(<PrintDialog />);
    const gridlines = screen.getByTestId("print-gridlines") as HTMLInputElement;
    fireEvent.click(gridlines);
    expect(gridlines.checked).toBe(false);
  });

  it("renders repeat rows input", () => {
    render(<PrintDialog />);
    const repeat = screen.getByTestId("print-repeat-rows") as HTMLInputElement;
    expect(repeat).toBeInTheDocument();
    expect(repeat.value).toBe("0");
  });

  it("shows custom scale input when custom mode selected", () => {
    render(<PrintDialog />);
    const scaleMode = screen.getByTestId("print-scale-mode");
    fireEvent.change(scaleMode, { target: { value: "custom" } });
    expect(screen.getByTestId("print-custom-scale")).toBeInTheDocument();
  });

  it("renders print preview", () => {
    render(<PrintDialog />);
    expect(screen.getByTestId("print-preview")).toBeInTheDocument();
  });

  it("cancel button closes dialog", () => {
    render(<PrintDialog />);
    fireEvent.click(screen.getByTestId("print-cancel"));
    expect(mockClose).toHaveBeenCalledWith(false);
  });

  it("renders orientation radio buttons", () => {
    render(<PrintDialog />);
    expect(
      screen.getByTestId("print-orientation-portrait"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("print-orientation-landscape"),
    ).toBeInTheDocument();
  });

  it("changes page size", () => {
    render(<PrintDialog />);
    const pageSize = screen.getByTestId("print-page-size");
    fireEvent.change(pageSize, { target: { value: "a4" } });
    expect(pageSize).toHaveValue("a4");
  });
});
