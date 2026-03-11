import { describe, it, expect, beforeEach } from "vitest";
import { useThemeStore, PREDEFINED_THEMES } from "../stores/themeStore";

describe("ThemeStore — sidebar and themes", () => {
  beforeEach(() => {
    useThemeStore.setState({
      activeThemeId: "default",
      activeTheme: PREDEFINED_THEMES[0],
      isSidebarOpen: false,
      isCustomizeOpen: false,
      customColors: {},
      customFontFamily: "",
    });
  });

  it("has at least 8 predefined themes", () => {
    expect(PREDEFINED_THEMES.length).toBeGreaterThanOrEqual(8);
  });

  it("includes expected theme names", () => {
    const names = PREDEFINED_THEMES.map((t) => t.name);
    expect(names).toContain("Standard");
    expect(names).toContain("Simple Light");
    expect(names).toContain("Streamline");
    expect(names).toContain("Modern");
    expect(names).toContain("Dark");
  });

  it("opens and closes sidebar", () => {
    expect(useThemeStore.getState().isSidebarOpen).toBe(false);
    useThemeStore.getState().openSidebar();
    expect(useThemeStore.getState().isSidebarOpen).toBe(true);
    useThemeStore.getState().closeSidebar();
    expect(useThemeStore.getState().isSidebarOpen).toBe(false);
  });

  it("closing sidebar also closes customize panel", () => {
    useThemeStore.getState().openSidebar();
    useThemeStore.getState().openCustomize();
    expect(useThemeStore.getState().isCustomizeOpen).toBe(true);
    useThemeStore.getState().closeSidebar();
    expect(useThemeStore.getState().isCustomizeOpen).toBe(false);
  });

  it("selects a theme by id", () => {
    useThemeStore.getState().setTheme("ocean");
    const state = useThemeStore.getState();
    expect(state.activeThemeId).toBe("ocean");
    expect(state.activeTheme.name).toBe("Ocean");
  });

  it("selecting a theme closes customize panel", () => {
    useThemeStore.getState().openCustomize();
    useThemeStore.getState().setTheme("dark");
    expect(useThemeStore.getState().isCustomizeOpen).toBe(false);
  });

  it("openCustomize populates customColors from active theme", () => {
    useThemeStore.getState().setTheme("sunset");
    useThemeStore.getState().openCustomize();
    const state = useThemeStore.getState();
    expect(state.isCustomizeOpen).toBe(true);
    expect(state.customColors["primary"]).toBe(
      PREDEFINED_THEMES.find((t) => t.id === "sunset")!.colors.primary,
    );
  });

  it("setCustomColor updates a specific color", () => {
    useThemeStore.getState().openCustomize();
    useThemeStore.getState().setCustomColor("primary", "#ff0000");
    expect(useThemeStore.getState().customColors["primary"]).toBe("#ff0000");
  });

  it("applyCustomTheme merges custom colors into active theme", () => {
    useThemeStore.getState().openCustomize();
    useThemeStore.getState().setCustomColor("primary", "#ff0000");
    useThemeStore.getState().applyCustomTheme();
    const state = useThemeStore.getState();
    expect(state.activeTheme.colors.primary).toBe("#ff0000");
    expect(state.isCustomizeOpen).toBe(false);
  });

  it("setCustomFontFamily and applyCustomTheme updates font", () => {
    useThemeStore.getState().openCustomize();
    useThemeStore.getState().setCustomFontFamily("Courier New, monospace");
    useThemeStore.getState().applyCustomTheme();
    expect(useThemeStore.getState().activeTheme.fontFamily).toBe(
      "Courier New, monospace",
    );
  });

  it("each theme has all required color keys", () => {
    const requiredKeys = [
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
        expect(theme.colors).toHaveProperty(key);
      }
    }
  });

  it("each theme has a fontFamily", () => {
    for (const theme of PREDEFINED_THEMES) {
      expect(theme.fontFamily).toBeTruthy();
    }
  });
});
