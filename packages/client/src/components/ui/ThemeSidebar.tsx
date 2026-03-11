import React from "react";
import {
  useThemeStore,
  PREDEFINED_THEMES,
  SpreadsheetTheme,
} from "../../stores/themeStore";

interface ThemeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function MiniBarChart({ colors }: { colors: SpreadsheetTheme["colors"] }) {
  const barColors = [colors.primary, colors.headerText, colors.gridlineBorder];
  const heights = [28, 18, 24];
  return (
    <svg width="48" height="32" viewBox="0 0 48 32" aria-hidden="true">
      {barColors.map((color, i) => (
        <rect
          key={i}
          x={4 + i * 14}
          y={32 - heights[i]}
          width="10"
          height={heights[i]}
          rx="1"
          fill={color}
        />
      ))}
    </svg>
  );
}

function MiniPieChart({ colors }: { colors: SpreadsheetTheme["colors"] }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill={colors.gridlineBorder} />
      <path d="M16 16 L16 2 A14 14 0 0 1 29.8 19.8 Z" fill={colors.primary} />
      <path
        d="M16 16 L29.8 19.8 A14 14 0 0 1 6.2 26 Z"
        fill={colors.headerText}
      />
    </svg>
  );
}

function MiniHorizontalBars({
  colors,
}: {
  colors: SpreadsheetTheme["colors"];
}) {
  const widths = [36, 24, 30];
  const barColors = [colors.primary, colors.headerText, colors.gridlineBorder];
  return (
    <svg width="48" height="32" viewBox="0 0 48 32" aria-hidden="true">
      {barColors.map((color, i) => (
        <rect
          key={i}
          x="2"
          y={3 + i * 10}
          width={widths[i]}
          height="7"
          rx="1"
          fill={color}
        />
      ))}
    </svg>
  );
}

function ThemePreviewCard({
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
      data-testid={`theme-option-${theme.id}`}
      onClick={onSelect}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        padding: "12px",
        borderRadius: "8px",
        border: `2px solid ${isActive ? theme.colors.primary : "#e5e7eb"}`,
        backgroundColor: isActive ? theme.colors.primaryLight : "#ffffff",
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 0.15s, background-color 0.15s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <span
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: theme.colors.fontColor,
            fontFamily: theme.fontFamily,
          }}
        >
          Total 208
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        <MiniBarChart colors={theme.colors} />
        <MiniHorizontalBars colors={theme.colors} />
        <MiniPieChart colors={theme.colors} />
      </div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: 500,
          color: theme.colors.headerText,
          fontFamily: theme.fontFamily,
        }}
      >
        {theme.name}
      </div>
    </button>
  );
}

function CustomizePanel({ onBack }: { onBack: () => void }) {
  const customization = useThemeStore((s) => s.customization);
  const setCustomization = useThemeStore((s) => s.setCustomization);
  const applyCustomization = useThemeStore((s) => s.applyCustomization);

  const fontOptions = [
    "Arial, sans-serif",
    "Roboto, Arial, sans-serif",
    "Georgia, serif",
    "Verdana, sans-serif",
    "Inter, system-ui, sans-serif",
    "Open Sans, Arial, sans-serif",
    "Lato, Arial, sans-serif",
    "Calibri, sans-serif",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 16px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <button
          data-testid="theme-customize-back"
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
          }}
          type="button"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5f6368"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#202124" }}>
          Customize theme
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 500,
              color: "#5f6368",
              marginBottom: "6px",
            }}
          >
            Font family
          </label>
          <select
            data-testid="theme-customize-font"
            value={customization.fontFamily}
            onChange={(e) => setCustomization({ fontFamily: e.target.value })}
            style={{
              width: "100%",
              padding: "8px",
              fontSize: "13px",
              border: "1px solid #dadce0",
              borderRadius: "4px",
              backgroundColor: "#fff",
            }}
          >
            {fontOptions.map((f) => (
              <option key={f} value={f}>
                {f.split(",")[0]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 500,
              color: "#5f6368",
              marginBottom: "6px",
            }}
          >
            Accent color
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              data-testid="theme-customize-primary"
              type="color"
              value={customization.primaryColor}
              onChange={(e) =>
                setCustomization({ primaryColor: e.target.value })
              }
              style={{
                width: "32px",
                height: "32px",
                border: "1px solid #dadce0",
                borderRadius: "4px",
                cursor: "pointer",
                padding: "2px",
              }}
            />
            <span style={{ fontSize: "13px", color: "#5f6368" }}>
              {customization.primaryColor}
            </span>
          </div>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 500,
              color: "#5f6368",
              marginBottom: "6px",
            }}
          >
            Header background
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              data-testid="theme-customize-header-bg"
              type="color"
              value={customization.headerBgColor}
              onChange={(e) =>
                setCustomization({ headerBgColor: e.target.value })
              }
              style={{
                width: "32px",
                height: "32px",
                border: "1px solid #dadce0",
                borderRadius: "4px",
                cursor: "pointer",
                padding: "2px",
              }}
            />
            <span style={{ fontSize: "13px", color: "#5f6368" }}>
              {customization.headerBgColor}
            </span>
          </div>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 500,
              color: "#5f6368",
              marginBottom: "6px",
            }}
          >
            Font color
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              data-testid="theme-customize-font-color"
              type="color"
              value={customization.fontColor}
              onChange={(e) => setCustomization({ fontColor: e.target.value })}
              style={{
                width: "32px",
                height: "32px",
                border: "1px solid #dadce0",
                borderRadius: "4px",
                cursor: "pointer",
                padding: "2px",
              }}
            />
            <span style={{ fontSize: "13px", color: "#5f6368" }}>
              {customization.fontColor}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          gap: "8px",
          justifyContent: "flex-end",
        }}
      >
        <button
          data-testid="theme-customize-cancel"
          onClick={onBack}
          style={{
            padding: "6px 16px",
            fontSize: "13px",
            border: "1px solid #dadce0",
            borderRadius: "4px",
            backgroundColor: "#fff",
            cursor: "pointer",
            color: "#5f6368",
          }}
          type="button"
        >
          Cancel
        </button>
        <button
          data-testid="theme-customize-apply"
          onClick={applyCustomization}
          style={{
            padding: "6px 16px",
            fontSize: "13px",
            border: "none",
            borderRadius: "4px",
            backgroundColor: "#1a73e8",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 500,
          }}
          type="button"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

export const ThemeSidebar: React.FC<ThemeSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const activeThemeId = useThemeStore((s) => s.activeThemeId);
  const activeTheme = useThemeStore((s) => s.activeTheme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const isCustomizing = useThemeStore((s) => s.isCustomizing);
  const setCustomizing = useThemeStore((s) => s.setCustomizing);

  if (!isOpen) return null;

  return (
    <div
      data-testid="theme-sidebar"
      style={{
        width: "300px",
        minWidth: "300px",
        height: "100%",
        borderLeft: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {isCustomizing ? (
        <CustomizePanel onBack={() => setCustomizing(false)} />
      ) : (
        <>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <span
              style={{ fontSize: "14px", fontWeight: 600, color: "#202124" }}
            >
              Themes
            </span>
            <button
              data-testid="theme-sidebar-close"
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
              }}
              type="button"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5f6368"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Current theme + Customize */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "13px", color: "#5f6368" }}>
              Current: <strong>{activeTheme.name}</strong>
            </span>
            <button
              data-testid="theme-customize-button"
              onClick={() => setCustomizing(true)}
              style={{
                padding: "4px 12px",
                fontSize: "12px",
                fontWeight: 500,
                border: "1px solid #1a73e8",
                borderRadius: "4px",
                backgroundColor: "#fff",
                color: "#1a73e8",
                cursor: "pointer",
              }}
              type="button"
            >
              Customize
            </button>
          </div>

          {/* Theme list */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {PREDEFINED_THEMES.map((theme) => (
              <ThemePreviewCard
                key={theme.id}
                theme={theme}
                isActive={activeThemeId === theme.id}
                onSelect={() => setTheme(theme.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
