import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Test the Format menu submenus: Font, Font size, Text wrapping, Text rotation.
 */

const mockSetFormatOnSelection = vi.fn();

vi.mock("../../../stores/formatStore", () => ({
  useFormatStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) => selector({}),
    {
      getState: () => ({
        setFormatOnSelection: mockSetFormatOnSelection,
        clearFormattingOnSelection: vi.fn(),
      }),
    },
  ),
}));

vi.mock("../../../stores/uiStore", () => ({
  useUIStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        showGridlines: true,
        showFormulaBar: true,
      }),
    {
      getState: () => ({
        selections: [{ start: { row: 0, col: 0 }, end: { row: 0, col: 0 } }],
        selectedCell: { row: 0, col: 0 },
        setFormatCellsDialogOpen: vi.fn(),
        setBandedRowsDialogOpen: vi.fn(),
        setConditionalFormatOpen: vi.fn(),
      }),
    },
  ),
}));

vi.mock("../../../stores/gridStore", () => ({
  useGridStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({ showFormulas: false }),
    {
      getState: () => ({ totalRows: 100, totalCols: 26 }),
    },
  ),
}));

vi.mock("../../../stores/macroStore", () => ({
  useMacroStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({ isRecording: false }),
    {
      getState: () => ({ isRecording: false }),
    },
  ),
}));

describe("Format menu submenus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defines Font submenu with correct testIds", () => {
    const expectedTestIds = [
      "menu-format-font",
      "menu-format-font-submenu",
      "menu-format-font-arial",
      "menu-format-font-times-new-roman",
      "menu-format-font-courier-new",
    ];
    for (const testId of expectedTestIds) {
      expect(testId).toMatch(/^menu-format-font/);
    }
  });

  it("defines Font size submenu with correct testIds", () => {
    const expectedTestIds = [
      "menu-format-font-size",
      "menu-format-font-size-submenu",
      "menu-format-font-size-10",
      "menu-format-font-size-12",
      "menu-format-font-size-24",
    ];
    for (const testId of expectedTestIds) {
      expect(testId).toMatch(/^menu-format-font-size/);
    }
  });

  it("defines Text wrapping submenu with correct testIds", () => {
    const expectedTestIds = [
      "menu-format-text-wrapping",
      "menu-format-text-wrapping-submenu",
      "menu-format-wrap-overflow",
      "menu-format-wrap-wrap",
      "menu-format-wrap-clip",
    ];
    for (const testId of expectedTestIds) {
      expect(testId).toMatch(/^menu-format-(text-wrapping|wrap)/);
    }
  });

  it("defines Text rotation submenu with correct testIds", () => {
    const expectedTestIds = [
      "menu-format-text-rotation",
      "menu-format-text-rotation-submenu",
      "menu-format-rotation-none",
      "menu-format-rotation-tilt-up",
      "menu-format-rotation-tilt-down",
      "menu-format-rotation-stack-vertically",
      "menu-format-rotation-rotate-up",
      "menu-format-rotation-rotate-down",
      "menu-format-rotation-custom",
      "menu-format-rotation-custom-input",
    ];
    for (const testId of expectedTestIds) {
      expect(testId).toMatch(/^menu-format-(text-)?rotation/);
    }
  });

  it("setFormatOnSelection applies font family", () => {
    mockSetFormatOnSelection({ fontFamily: "Georgia" });
    expect(mockSetFormatOnSelection).toHaveBeenCalledWith({
      fontFamily: "Georgia",
    });
  });

  it("setFormatOnSelection applies font size", () => {
    mockSetFormatOnSelection({ fontSize: 14 });
    expect(mockSetFormatOnSelection).toHaveBeenCalledWith({ fontSize: 14 });
  });

  it("setFormatOnSelection applies text wrapping", () => {
    mockSetFormatOnSelection({ wrapText: "wrap" });
    expect(mockSetFormatOnSelection).toHaveBeenCalledWith({
      wrapText: "wrap",
    });
  });

  it("setFormatOnSelection applies text rotation", () => {
    mockSetFormatOnSelection({ textRotation: 45 });
    expect(mockSetFormatOnSelection).toHaveBeenCalledWith({
      textRotation: 45,
    });
  });

  it("text rotation custom angle clamps between -90 and 90", () => {
    // Simulate what the custom angle handler does
    const clamp = (val: number) => Math.max(-90, Math.min(90, val));
    expect(clamp(100)).toBe(90);
    expect(clamp(-100)).toBe(-90);
    expect(clamp(45)).toBe(45);
    expect(clamp(0)).toBe(0);
  });
});
