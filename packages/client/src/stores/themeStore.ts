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
    name: "Default",
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
    fontFamily: "Roboto, Arial, sans-serif",
  },
  {
    id: "streamline",
    name: "Streamline",
    colors: {
      primary: "#00897b",
      primaryLight: "#e0f2f1",
      headerBg: "#f1f8f6",
      headerText: "#00695c",
      gridlineBorder: "#b2dfdb",
      selectionBg: "rgba(0, 137, 123, 0.08)",
      selectionBorder: "#00897b",
      tabActiveBg: "#ffffff",
      toolbarBg: "#f1f8f6",
      fontColor: "#004d40",
    },
    fontFamily: "Open Sans, Arial, sans-serif",
  },
  {
    id: "modern",
    name: "Modern",
    colors: {
      primary: "#6200ea",
      primaryLight: "#ede7f6",
      headerBg: "#fafafa",
      headerText: "#424242",
      gridlineBorder: "#e0e0e0",
      selectionBg: "rgba(98, 0, 234, 0.08)",
      selectionBorder: "#6200ea",
      tabActiveBg: "#ffffff",
      toolbarBg: "#fafafa",
      fontColor: "#212121",
    },
    fontFamily: "Inter, system-ui, sans-serif",
  },
  {
    id: "coral",
    name: "Coral",
    colors: {
      primary: "#ef5350",
      primaryLight: "#ffebee",
      headerBg: "#fff5f5",
      headerText: "#c62828",
      gridlineBorder: "#ef9a9a",
      selectionBg: "rgba(239, 83, 80, 0.08)",
      selectionBorder: "#ef5350",
      tabActiveBg: "#ffffff",
      toolbarBg: "#fff5f5",
      fontColor: "#b71c1c",
    },
    fontFamily: "Lato, Arial, sans-serif",
  },
];

export interface ThemeCustomization {
  fontFamily: string;
  primaryColor: string;
  headerBgColor: string;
  fontColor: string;
}

interface ThemeState {
  activeThemeId: string;
  activeTheme: SpreadsheetTheme;
  isCustomizing: boolean;
  customization: ThemeCustomization;
  setTheme: (themeId: string) => void;
  setCustomizing: (open: boolean) => void;
  setCustomization: (updates: Partial<ThemeCustomization>) => void;
  applyCustomization: () => void;
}

export const useThemeStore = create<ThemeState>()(
  immer((set) => ({
    activeThemeId: "default",
    activeTheme: PREDEFINED_THEMES[0],
    isCustomizing: false,
    customization: {
      fontFamily: "Arial, sans-serif",
      primaryColor: "#1a73e8",
      headerBgColor: "#f8f9fa",
      fontColor: "#000000",
    },
    setTheme: (themeId: string) => {
      set((state) => {
        const theme = PREDEFINED_THEMES.find((t) => t.id === themeId);
        if (theme) {
          state.activeThemeId = themeId;
          state.activeTheme = theme;
          state.isCustomizing = false;
          state.customization = {
            fontFamily: theme.fontFamily,
            primaryColor: theme.colors.primary,
            headerBgColor: theme.colors.headerBg,
            fontColor: theme.colors.fontColor,
          };
        }
      });
    },
    setCustomizing: (open: boolean) => {
      set((state) => {
        state.isCustomizing = open;
        if (open) {
          state.customization = {
            fontFamily: state.activeTheme.fontFamily,
            primaryColor: state.activeTheme.colors.primary,
            headerBgColor: state.activeTheme.colors.headerBg,
            fontColor: state.activeTheme.colors.fontColor,
          };
        }
      });
    },
    setCustomization: (updates: Partial<ThemeCustomization>) => {
      set((state) => {
        Object.assign(state.customization, updates);
      });
    },
    applyCustomization: () => {
      set((state) => {
        const base = state.activeTheme;
        state.activeTheme = {
          ...base,
          fontFamily: state.customization.fontFamily,
          colors: {
            ...base.colors,
            primary: state.customization.primaryColor,
            headerBg: state.customization.headerBgColor,
            fontColor: state.customization.fontColor,
          },
        };
        state.isCustomizing = false;
      });
    },
  })),
);
