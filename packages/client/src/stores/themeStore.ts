import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface SpreadsheetTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    primaryLight: string;
    headerBg: string;
    headerText: string;
    gridlineBorder: string;
    selectionBg: string;
    selectionBorder: string;
    tabActiveBg: string;
    toolbarBg: string;
    fontColor: string;
  };
  fontFamily: string;
}

export const PREDEFINED_THEMES: SpreadsheetTheme[] = [
  {
    id: "default",
    name: "Standard",
    colors: {
      primary: "#1a73e8",
      primaryLight: "#e8f0fe",
      headerBg: "#f8f9fa",
      headerText: "#666666",
      gridlineBorder: "#e2e2e2",
      selectionBg: "rgba(26, 115, 232, 0.1)",
      selectionBorder: "#1a73e8",
      tabActiveBg: "#ffffff",
      toolbarBg: "#f3f3f3",
      fontColor: "#000000",
    },
    fontFamily: "Arial, sans-serif",
  },
  {
    id: "simple-light",
    name: "Simple Light",
    colors: {
      primary: "#4285f4",
      primaryLight: "#e8f0fe",
      headerBg: "#ffffff",
      headerText: "#5f6368",
      gridlineBorder: "#dadce0",
      selectionBg: "rgba(66, 133, 244, 0.08)",
      selectionBorder: "#4285f4",
      tabActiveBg: "#ffffff",
      toolbarBg: "#ffffff",
      fontColor: "#202124",
    },
    fontFamily: "Roboto, sans-serif",
  },
  {
    id: "streamline",
    name: "Streamline",
    colors: {
      primary: "#1b9e77",
      primaryLight: "#e0f5ee",
      headerBg: "#f0faf6",
      headerText: "#137a5b",
      gridlineBorder: "#c8e6d9",
      selectionBg: "rgba(27, 158, 119, 0.1)",
      selectionBorder: "#1b9e77",
      tabActiveBg: "#ffffff",
      toolbarBg: "#f0faf6",
      fontColor: "#1a1a1a",
    },
    fontFamily: "Lato, sans-serif",
  },
  {
    id: "modern",
    name: "Modern",
    colors: {
      primary: "#6200ee",
      primaryLight: "#f3e8fd",
      headerBg: "#fafafa",
      headerText: "#49454f",
      gridlineBorder: "#e0e0e0",
      selectionBg: "rgba(98, 0, 238, 0.08)",
      selectionBorder: "#6200ee",
      tabActiveBg: "#ffffff",
      toolbarBg: "#fafafa",
      fontColor: "#1c1b1f",
    },
    fontFamily: "Inter, sans-serif",
  },
  {
    id: "dark",
    name: "Dark",
    colors: {
      primary: "#8ab4f8",
      primaryLight: "#1e3a5f",
      headerBg: "#2d2d2d",
      headerText: "#c8c8c8",
      gridlineBorder: "#444444",
      selectionBg: "rgba(138, 180, 248, 0.15)",
      selectionBorder: "#8ab4f8",
      tabActiveBg: "#3c3c3c",
      toolbarBg: "#333333",
      fontColor: "#e0e0e0",
    },
    fontFamily: "Arial, sans-serif",
  },
  {
    id: "ocean",
    name: "Ocean",
    colors: {
      primary: "#0077b6",
      primaryLight: "#caf0f8",
      headerBg: "#e0f4ff",
      headerText: "#023e8a",
      gridlineBorder: "#90e0ef",
      selectionBg: "rgba(0, 119, 182, 0.1)",
      selectionBorder: "#0077b6",
      tabActiveBg: "#ffffff",
      toolbarBg: "#e0f4ff",
      fontColor: "#03045e",
    },
    fontFamily: "Segoe UI, sans-serif",
  },
  {
    id: "forest",
    name: "Forest",
    colors: {
      primary: "#2d6a4f",
      primaryLight: "#d8f3dc",
      headerBg: "#edf6ef",
      headerText: "#1b4332",
      gridlineBorder: "#b7e4c7",
      selectionBg: "rgba(45, 106, 79, 0.1)",
      selectionBorder: "#2d6a4f",
      tabActiveBg: "#ffffff",
      toolbarBg: "#edf6ef",
      fontColor: "#1b4332",
    },
    fontFamily: "Georgia, serif",
  },
  {
    id: "sunset",
    name: "Sunset",
    colors: {
      primary: "#e76f51",
      primaryLight: "#fce4db",
      headerBg: "#fff1eb",
      headerText: "#6b3a2a",
      gridlineBorder: "#f4a261",
      selectionBg: "rgba(231, 111, 81, 0.1)",
      selectionBorder: "#e76f51",
      tabActiveBg: "#ffffff",
      toolbarBg: "#fff1eb",
      fontColor: "#264653",
    },
    fontFamily: "Verdana, sans-serif",
  },
  {
    id: "lavender",
    name: "Lavender",
    colors: {
      primary: "#7c3aed",
      primaryLight: "#ede9fe",
      headerBg: "#f5f3ff",
      headerText: "#4c1d95",
      gridlineBorder: "#c4b5fd",
      selectionBg: "rgba(124, 58, 237, 0.1)",
      selectionBorder: "#7c3aed",
      tabActiveBg: "#ffffff",
      toolbarBg: "#f5f3ff",
      fontColor: "#1e1b4b",
    },
    fontFamily: "Calibri, sans-serif",
  },
  {
    id: "monochrome",
    name: "Monochrome",
    colors: {
      primary: "#374151",
      primaryLight: "#f3f4f6",
      headerBg: "#f9fafb",
      headerText: "#374151",
      gridlineBorder: "#d1d5db",
      selectionBg: "rgba(55, 65, 81, 0.08)",
      selectionBorder: "#374151",
      tabActiveBg: "#ffffff",
      toolbarBg: "#f9fafb",
      fontColor: "#111827",
    },
    fontFamily: "Helvetica, Arial, sans-serif",
  },
];

interface ThemeState {
  activeThemeId: string;
  activeTheme: SpreadsheetTheme;
  isSidebarOpen: boolean;
  isCustomizeOpen: boolean;
  customColors: Record<string, string>;
  customFontFamily: string;
  setTheme: (themeId: string) => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  openCustomize: () => void;
  closeCustomize: () => void;
  setCustomColor: (key: string, value: string) => void;
  setCustomFontFamily: (fontFamily: string) => void;
  applyCustomTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  immer((set) => ({
    activeThemeId: "default",
    activeTheme: PREDEFINED_THEMES[0],
    isSidebarOpen: false,
    isCustomizeOpen: false,
    customColors: {},
    customFontFamily: "",
    setTheme: (themeId: string) => {
      set((state) => {
        const theme = PREDEFINED_THEMES.find((t) => t.id === themeId);
        if (theme) {
          state.activeThemeId = themeId;
          state.activeTheme = theme;
          state.isCustomizeOpen = false;
        }
      });
    },
    openSidebar: () => {
      set((state) => {
        state.isSidebarOpen = true;
      });
    },
    closeSidebar: () => {
      set((state) => {
        state.isSidebarOpen = false;
        state.isCustomizeOpen = false;
      });
    },
    openCustomize: () => {
      set((state) => {
        state.isCustomizeOpen = true;
        state.customColors = { ...state.activeTheme.colors };
        state.customFontFamily = state.activeTheme.fontFamily;
      });
    },
    closeCustomize: () => {
      set((state) => {
        state.isCustomizeOpen = false;
      });
    },
    setCustomColor: (key: string, value: string) => {
      set((state) => {
        state.customColors[key] = value;
      });
    },
    setCustomFontFamily: (fontFamily: string) => {
      set((state) => {
        state.customFontFamily = fontFamily;
      });
    },
    applyCustomTheme: () => {
      set((state) => {
        const customTheme: SpreadsheetTheme = {
          id: state.activeThemeId,
          name: state.activeTheme.name,
          colors: {
            primary:
              state.customColors["primary"] ?? state.activeTheme.colors.primary,
            primaryLight:
              state.customColors["primaryLight"] ??
              state.activeTheme.colors.primaryLight,
            headerBg:
              state.customColors["headerBg"] ??
              state.activeTheme.colors.headerBg,
            headerText:
              state.customColors["headerText"] ??
              state.activeTheme.colors.headerText,
            gridlineBorder:
              state.customColors["gridlineBorder"] ??
              state.activeTheme.colors.gridlineBorder,
            selectionBg:
              state.customColors["selectionBg"] ??
              state.activeTheme.colors.selectionBg,
            selectionBorder:
              state.customColors["selectionBorder"] ??
              state.activeTheme.colors.selectionBorder,
            tabActiveBg:
              state.customColors["tabActiveBg"] ??
              state.activeTheme.colors.tabActiveBg,
            toolbarBg:
              state.customColors["toolbarBg"] ??
              state.activeTheme.colors.toolbarBg,
            fontColor:
              state.customColors["fontColor"] ??
              state.activeTheme.colors.fontColor,
          },
          fontFamily: state.customFontFamily || state.activeTheme.fontFamily,
        };
        state.activeTheme = customTheme;
        state.isCustomizeOpen = false;
      });
    },
  })),
);
