/**
 * ThemeSidebar — right sidebar for selecting and customizing spreadsheet themes.
 * Shows theme preview cards with mini chart illustrations using theme colors.
 */
import React, { useCallback } from "react";
import {
  useThemeStore,
  PREDEFINED_THEMES,
  type SpreadsheetTheme,
} from "../../stores/themeStore";

/** Mini bar chart preview rendered with theme colors */
function MiniBarChart({ colors }: { colors: SpreadsheetTheme["colors"] }) {
  const barHeights = [60, 85, 45, 70, 55];
  return (
    <svg
      width="48"
      height="32"
      viewBox="0 0 48 32"
      data-testid="mini-bar-chart"
    >
      {barHeights.map((h, i) => (
        <rect
          key={i}
          x={i * 10}
          y={32 - (h * 32) / 100}
          width="7"
          height={(h * 32) / 100}
          rx="1"
          fill={i % 2 === 0 ? colors.primary : colors.headerText}
          opacity={0.85}
        />
      ))}
    </svg>
  );
}

/** Mini horizontal bars preview */
function MiniHorizontalBars({
  colors,
}: {
  colors: SpreadsheetTheme["colors"];
}) {
  const widths = [38, 28, 20];
  const barColors = [colors.primary, colors.headerText, colors.gridlineBorder];
  return (
    <svg
      width="48"
      height="32"
      viewBox="0 0 48 32"
      data-testid="mini-horizontal-bars"
    >
      {widths.map((w, i) => (
        <rect
          key={i}
          x="0"
          y={i * 11}
          width={w}
          height="8"
          rx="1"
          fill={barColors[i]}
          opacity={0.85}
        />
      ))}
    </svg>
  );
}

/** Mini pie chart preview */
function MiniPieChart({ colors }: { colors: SpreadsheetTheme["colors"] }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      data-testid="mini-pie-chart"
    >
      <circle cx="16" cy="16" r="14" fill={colors.primaryLight} />
      <path
        d="M16 2 A14 14 0 0 1 29.8 20 L16 16 Z"
        fill={colors.primary}
        opacity={0.9}
      />
      <path
        d="M16 2 A14 14 0 0 0 2.2 20 L16 16 Z"
        fill={colors.headerText}
        opacity={0.7}
      />
    </svg>
  );
}

/** Theme preview card showing theme name + mini charts */
const ThemeCard = React.memo(function ThemeCard({
  theme,
  isActive,
  onSelect,
}: {
  theme: SpreadsheetTheme;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      data-testid={`theme-card-${theme.id}`}
      onClick={onSelect}
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "12px",
        borderRadius: "8px",
        border: `2px solid ${isActive ? "#1a73e8" : "#dadce0"}`,
        backgroundColor: theme.colors.headerBg,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        boxShadow: isActive ? "0 0 0 2px rgba(26,115,232,0.25)" : "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      {/* Bold number preview */}
      <div
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: theme.colors.fontColor,
          fontFamily: theme.fontFamily,
          marginBottom: "8px",
        }}
      >
        Total 208
      </div>

      {/* Mini chart previews row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <MiniBarChart colors={theme.colors} />
        <MiniHorizontalBars colors={theme.colors} />
        <MiniPieChart colors={theme.colors} />
      </div>

      {/* Theme name */}
      <div
        style={{
          fontSize: "12px",
          fontWeight: 500,
          color: theme.colors.headerText,
          marginTop: "8px",
          fontFamily: theme.fontFamily,
        }}
      >
        {theme.name}
      </div>
    </button>
  );
});

/** Color input row for the customize panel */
function ColorRow({
  label,
  colorKey,
  value,
  onChange,
}: {
  label: string;
  colorKey: string;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 0",
      }}
    >
      <span style={{ fontSize: "12px", color: "#5f6368" }}>{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(colorKey, e.target.value)}
        data-testid={`customize-color-${colorKey}`}
        style={{
          width: "28px",
          height: "28px",
          border: "1px solid #dadce0",
          borderRadius: "4px",
          cursor: "pointer",
          padding: "2px",
        }}
      />
    </div>
  );
}

const COLOR_LABELS: Array<{ key: string; label: string }> = [
  { key: "primary", label: "Primary" },
  { key: "headerBg", label: "Header background" },
  { key: "headerText", label: "Header text" },
  { key: "fontColor", label: "Font color" },
  { key: "gridlineBorder", label: "Gridlines" },
  { key: "toolbarBg", label: "Toolbar" },
];

const FONT_OPTIONS = [
  "Arial, sans-serif",
  "Roboto, sans-serif",
  "Inter, sans-serif",
  "Lato, sans-serif",
  "Georgia, serif",
  "Verdana, sans-serif",
  "Calibri, sans-serif",
  "Helvetica, Arial, sans-serif",
  "Segoe UI, sans-serif",
];

/** Customize panel — color/font editor */
function CustomizePanel() {
  const customColors = useThemeStore((s) => s.customColors);
  const customFontFamily = useThemeStore((s) => s.customFontFamily);
  const setCustomColor = useThemeStore((s) => s.setCustomColor);
  const setCustomFontFamily = useThemeStore((s) => s.setCustomFontFamily);
  const applyCustomTheme = useThemeStore((s) => s.applyCustomTheme);
  const closeCustomize = useThemeStore((s) => s.closeCustomize);

  return (
    <div
      data-testid="theme-customize-panel"
      style={{ padding: "12px 16px", borderTop: "1px solid #dadce0" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#202124" }}>
          Customize theme
        </span>
        <button
          onClick={closeCustomize}
          data-testid="theme-customize-close"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "18px",
            color: "#5f6368",
            padding: "2px 6px",
          }}
        >
          &times;
        </button>
      </div>

      {COLOR_LABELS.map(({ key, label }) => (
        <ColorRow
          key={key}
          label={label}
          colorKey={key}
          value={
            (customColors[key] as string | undefined)?.startsWith("rgba")
              ? "#000000"
              : (customColors[key] ?? "#000000")
          }
          onChange={setCustomColor}
        />
      ))}

      {/* Font family selector */}
      <div style={{ marginTop: "12px" }}>
        <label
          style={{
            fontSize: "12px",
            color: "#5f6368",
            display: "block",
            marginBottom: "4px",
          }}
        >
          Font
        </label>
        <select
          value={customFontFamily}
          onChange={(e) => setCustomFontFamily(e.target.value)}
          data-testid="customize-font-select"
          style={{
            width: "100%",
            padding: "6px 8px",
            fontSize: "12px",
            border: "1px solid #dadce0",
            borderRadius: "4px",
            backgroundColor: "#fff",
          }}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f.split(",")[0]}
            </option>
          ))}
        </select>
      </div>

      {/* Apply / Cancel */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginTop: "16px",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={closeCustomize}
          data-testid="customize-cancel-btn"
          style={{
            padding: "6px 16px",
            fontSize: "13px",
            border: "1px solid #dadce0",
            borderRadius: "4px",
            backgroundColor: "#fff",
            color: "#5f6368",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={applyCustomTheme}
          data-testid="customize-apply-btn"
          style={{
            padding: "6px 16px",
            fontSize: "13px",
            border: "none",
            borderRadius: "4px",
            backgroundColor: "#1a73e8",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}

export function ThemeSidebar() {
  const isOpen = useThemeStore((s) => s.isSidebarOpen);
  const activeThemeId = useThemeStore((s) => s.activeThemeId);
  const activeTheme = useThemeStore((s) => s.activeTheme);
  const isCustomizeOpen = useThemeStore((s) => s.isCustomizeOpen);
  const closeSidebar = useThemeStore((s) => s.closeSidebar);
  const setTheme = useThemeStore((s) => s.setTheme);
  const openCustomize = useThemeStore((s) => s.openCustomize);

  const handleSelectTheme = useCallback(
    (themeId: string) => {
      setTheme(themeId);
    },
    [setTheme],
  );

  if (!isOpen) return null;

  return (
    <div
      data-testid="theme-sidebar"
      style={{
        width: "300px",
        minWidth: "300px",
        height: "100%",
        backgroundColor: "#ffffff",
        borderLeft: "1px solid #dadce0",
        display: "flex",
        flexDirection: "column",
        boxShadow: "-2px 0 8px rgba(0,0,0,0.08)",
        zIndex: 40,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #dadce0",
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#202124" }}>
          Themes
        </span>
        <button
          onClick={closeSidebar}
          data-testid="theme-sidebar-close"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "20px",
            color: "#5f6368",
            padding: "2px 6px",
            lineHeight: 1,
          }}
        >
          &times;
        </button>
      </div>

      {/* Current theme + Customize */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #dadce0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: "13px", color: "#5f6368" }}>
          {activeTheme.name}
        </span>
        <button
          onClick={openCustomize}
          data-testid="theme-customize-btn"
          style={{
            padding: "6px 16px",
            fontSize: "13px",
            fontWeight: 500,
            border: "none",
            borderRadius: "4px",
            backgroundColor: "#1a73e8",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Customize
        </button>
      </div>

      {/* Customize panel (conditionally shown) */}
      {isCustomizeOpen && <CustomizePanel />}

      {/* Scrollable theme list */}
      <div
        data-testid="theme-list"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {PREDEFINED_THEMES.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={activeThemeId === theme.id}
            onSelect={() => handleSelectTheme(theme.id)}
          />
        ))}
      </div>
    </div>
  );
}
