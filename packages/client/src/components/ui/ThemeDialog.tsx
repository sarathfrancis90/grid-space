import React from "react";
import { useThemeStore, PREDEFINED_THEMES } from "../../stores/themeStore";

interface ThemeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeDialog: React.FC<ThemeDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const activeThemeId = useThemeStore((s) => s.activeThemeId);
  const setTheme = useThemeStore((s) => s.setTheme);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.3)",
      }}
      data-testid="theme-dialog-overlay"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-[520px]"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          width: "520px",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
        data-testid="theme-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-lg font-semibold mb-4"
          style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}
        >
          Themes
        </h2>
        <p
          className="text-sm text-gray-500 mb-4"
          style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}
        >
          Choose a theme to apply to your spreadsheet.
        </p>

        <div
          className="grid grid-cols-2 gap-3"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          {PREDEFINED_THEMES.map((theme) => (
            <button
              key={theme.id}
              data-testid={`theme-option-${theme.id}`}
              className={`rounded-lg border-2 p-3 text-left transition-all ${
                activeThemeId === theme.id
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: `2px solid ${
                  activeThemeId === theme.id ? "#3b82f6" : "#e5e7eb"
                }`,
                cursor: "pointer",
                textAlign: "left",
                backgroundColor: "white",
              }}
              onClick={() => setTheme(theme.id)}
            >
              <div
                className="font-medium text-sm mb-2"
                style={{
                  fontWeight: 500,
                  fontSize: "13px",
                  marginBottom: "8px",
                  fontFamily: theme.fontFamily,
                }}
              >
                {theme.name}
              </div>
              <div
                className="flex gap-1"
                style={{ display: "flex", gap: "4px" }}
              >
                {[
                  theme.colors.primary,
                  theme.colors.headerBg,
                  theme.colors.gridlineBorder,
                  theme.colors.headerText,
                ].map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded"
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "4px",
                      backgroundColor: color,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>

        <div
          className="flex justify-end mt-6"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "24px",
          }}
        >
          <button
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: "4px",
            }}
            data-testid="theme-dialog-close"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
