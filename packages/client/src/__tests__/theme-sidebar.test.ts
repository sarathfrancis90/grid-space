/**
 * Tests for issue #198: Enhanced Themes sidebar with Customize button,
 * chart preview cards, and 8+ themes.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  useThemeStore,
  PREDEFINED_THEMES,
  SpreadsheetTheme,
} from "../stores/themeStore";

describe("Theme store — enhanced sidebar", () => {
  beforeEach(() => {
    useThemeStore.setState({
      activeThemeId: "default",
      activeTheme: PREDEFINED_THEMES[0],
      isCustomizing: false,
      customization: {
        fontFamily: "Arial, sans-serif",
        primaryColor: "#1a73e8",
        headerBgColor: "#f8f9fa",
        fontColor: "#000000",
      },
    });
  });

  it("has at least 8 predefined themes", () => {
    expect(PREDEFINED_THEMES.length).toBeGreaterThanOrEqual(8);
  });

  it("includes Simple Light, Streamline, and Modern themes", () => {
    const names = PREDEFINED_THEMES.map((t) => t.name);
    expect(names).toContain("Simple Light");
    expect(names).toContain("Streamline");
    expect(names).toContain("Modern");
  });

  it("all themes have unique IDs and names", () => {
    const ids = PREDEFINED_THEMES.map((t) => t.id);
    const names = PREDEFINED_THEMES.map((t) => t.name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it("all themes have complete color properties", () => {
    const requiredKeys: (keyof SpreadsheetTheme["colors"])[] = [
      "primary",
      "primaryLight",
      "headerBg",
      "headerText",
      "gridlineBorder",
      "selectionBg",
      "selectionBorder",
      "tabActiveBg",
      "toolbarBg",
      "fontColor",
    ];
    for (const theme of PREDEFINED_THEMES) {
      for (const key of requiredKeys) {
        expect(theme.colors[key]).toBeTruthy();
      }
      expect(theme.fontFamily).toBeTruthy();
    }
  });

  describe("customization", () => {
    it("can toggle customizing mode", () => {
      expect(useThemeStore.getState().isCustomizing).toBe(false);
      useThemeStore.getState().setCustomizing(true);
      expect(useThemeStore.getState().isCustomizing).toBe(true);
    });

    it("initializes customization from active theme when opening", () => {
      useThemeStore.getState().setTheme("ocean");
      useThemeStore.getState().setCustomizing(true);
      const state = useThemeStore.getState();
      expect(state.customization.primaryColor).toBe("#0077b6");
      expect(state.customization.fontFamily).toBe("Segoe UI, sans-serif");
    });

    it("can update customization values", () => {
      useThemeStore.getState().setCustomizing(true);
      useThemeStore.getState().setCustomization({ primaryColor: "#ff0000" });
      expect(useThemeStore.getState().customization.primaryColor).toBe(
        "#ff0000",
      );
    });

    it("applies customization to active theme", () => {
      useThemeStore.getState().setCustomizing(true);
      useThemeStore.getState().setCustomization({
        primaryColor: "#ff0000",
        fontFamily: "Georgia, serif",
      });
      useThemeStore.getState().applyCustomization();
      const state = useThemeStore.getState();
      expect(state.activeTheme.colors.primary).toBe("#ff0000");
      expect(state.activeTheme.fontFamily).toBe("Georgia, serif");
      expect(state.isCustomizing).toBe(false);
    });

    it("resets customizing when switching themes", () => {
      useThemeStore.getState().setCustomizing(true);
      expect(useThemeStore.getState().isCustomizing).toBe(true);
      useThemeStore.getState().setTheme("dark");
      expect(useThemeStore.getState().isCustomizing).toBe(false);
    });
  });
});
