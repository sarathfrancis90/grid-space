/**
 * Tests for issue #92: Accounting/Duration formats, Themes, ODS, Full-screen.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { formatCellValue, NUMBER_FORMATS } from "../utils/numberFormat";
import { useThemeStore, PREDEFINED_THEMES } from "../stores/themeStore";
import { useUIStore } from "../stores/uiStore";

// ── Accounting format ─────────────────────────────────────────

describe("Accounting format", () => {
  it("formats positive numbers with aligned $ and trailing space", () => {
    expect(formatCellValue(1234.56, "_($#,##0.00")).toBe("$ 1,234.56 ");
  });

  it("formats negative numbers with parentheses", () => {
    expect(formatCellValue(-50, "_($#,##0.00")).toBe("$ (50.00)");
  });

  it("formats zero with aligned $ and trailing space", () => {
    expect(formatCellValue(0, "_($#,##0.00")).toBe("$ 0.00 ");
  });

  it("formats large negative numbers with thousands separator", () => {
    expect(formatCellValue(-1234567.89, "_($#,##0.00")).toBe(
      "$ (1,234,567.89)",
    );
  });

  it("handles string values gracefully", () => {
    expect(formatCellValue("hello", "_($#,##0.00")).toBe("hello");
  });

  it("is available as a preset format", () => {
    expect(NUMBER_FORMATS.Accounting).toBe("_($#,##0.00");
  });
});

// ── Duration format ──────────────────────────────────────────

describe("Duration format", () => {
  it("formats hours:minutes:seconds from decimal hours", () => {
    expect(formatCellValue(2.5, "[h]:mm:ss")).toBe("2:30:00");
  });

  it("formats duration beyond 24 hours", () => {
    expect(formatCellValue(30, "[h]:mm:ss")).toBe("30:00:00");
  });

  it("formats zero duration", () => {
    expect(formatCellValue(0, "[h]:mm:ss")).toBe("0:00:00");
  });

  it("formats fractional minutes", () => {
    // 1 hour 15 minutes 30 seconds = 1 + 15/60 + 30/3600 = 1.25833...
    expect(formatCellValue(1.2583333333333333, "[h]:mm:ss")).toBe("1:15:30");
  });

  it("formats negative duration", () => {
    expect(formatCellValue(-1.5, "[h]:mm:ss")).toBe("-1:30:00");
  });

  it("also works with [hh]:mm:ss variant", () => {
    expect(formatCellValue(2.5, "[hh]:mm:ss")).toBe("2:30:00");
  });

  it("handles string values gracefully", () => {
    expect(formatCellValue("not a number", "[h]:mm:ss")).toBe("not a number");
  });

  it("is available as a preset format", () => {
    expect(NUMBER_FORMATS.Duration).toBe("[h]:mm:ss");
  });
});

// ── Theme store ─────────────────────────────────────────────

describe("Theme store", () => {
  beforeEach(() => {
    useThemeStore.setState({
      activeThemeId: "default",
      activeTheme: PREDEFINED_THEMES[0],
    });
  });

  it("has at least 8 predefined themes", () => {
    expect(PREDEFINED_THEMES.length).toBeGreaterThanOrEqual(8);
  });

  it("defaults to the default theme", () => {
    const state = useThemeStore.getState();
    expect(state.activeThemeId).toBe("default");
    expect(state.activeTheme.name).toBe("Default");
  });

  it("can switch to another theme", () => {
    useThemeStore.getState().setTheme("dark");
    const state = useThemeStore.getState();
    expect(state.activeThemeId).toBe("dark");
    expect(state.activeTheme.name).toBe("Dark");
  });

  it("ignores invalid theme IDs", () => {
    useThemeStore.getState().setTheme("nonexistent");
    const state = useThemeStore.getState();
    expect(state.activeThemeId).toBe("default");
  });

  it("each theme has required color properties", () => {
    for (const theme of PREDEFINED_THEMES) {
      expect(theme.colors.primary).toBeTruthy();
      expect(theme.colors.headerBg).toBeTruthy();
      expect(theme.colors.gridlineBorder).toBeTruthy();
      expect(theme.colors.selectionBg).toBeTruthy();
      expect(theme.colors.selectionBorder).toBeTruthy();
      expect(theme.fontFamily).toBeTruthy();
    }
  });

  it("has unique IDs for all themes", () => {
    const ids = PREDEFINED_THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── UI store: theme dialog and fullscreen ────────────────────

describe("UI store - theme dialog and fullscreen", () => {
  beforeEach(() => {
    useUIStore.setState({
      isThemeDialogOpen: false,
      isFullscreen: false,
    });
  });

  it("can open and close theme dialog", () => {
    expect(useUIStore.getState().isThemeDialogOpen).toBe(false);
    useUIStore.getState().setThemeDialogOpen(true);
    expect(useUIStore.getState().isThemeDialogOpen).toBe(true);
    useUIStore.getState().setThemeDialogOpen(false);
    expect(useUIStore.getState().isThemeDialogOpen).toBe(false);
  });

  it("can toggle fullscreen", () => {
    expect(useUIStore.getState().isFullscreen).toBe(false);
    useUIStore.getState().setFullscreen(true);
    expect(useUIStore.getState().isFullscreen).toBe(true);
    useUIStore.getState().setFullscreen(false);
    expect(useUIStore.getState().isFullscreen).toBe(false);
  });
});

// ── ODS export/import availability ───────────────────────────

describe("ODS export/import", () => {
  it("exports exportODS function", async () => {
    const fileOps = await import("../utils/fileOps");
    expect(typeof fileOps.exportODS).toBe("function");
  });

  it("exports importODS function", async () => {
    const fileOps = await import("../utils/fileOps");
    expect(typeof fileOps.importODS).toBe("function");
  });
});

// ── NUMBER_FORMATS contains all expected formats ─────────────

describe("NUMBER_FORMATS presets", () => {
  it("contains Accounting format", () => {
    expect("Accounting" in NUMBER_FORMATS).toBe(true);
  });

  it("contains Duration format", () => {
    expect("Duration" in NUMBER_FORMATS).toBe(true);
  });

  it("contains all original formats", () => {
    expect("General" in NUMBER_FORMATS).toBe(true);
    expect("Number" in NUMBER_FORMATS).toBe(true);
    expect("Currency" in NUMBER_FORMATS).toBe(true);
    expect("Percent" in NUMBER_FORMATS).toBe(true);
    expect("Date" in NUMBER_FORMATS).toBe(true);
    expect("Time" in NUMBER_FORMATS).toBe(true);
    expect("Scientific" in NUMBER_FORMATS).toBe(true);
  });
});
