import React, { useState } from "react";
import { useUIStore } from "../../stores/uiStore";
import {
  performPasteSpecial,
  type PasteSpecialMode,
} from "../../hooks/useKeyboardShortcuts";

export const PasteSpecialDialog: React.FC = () => {
  const isOpen = useUIStore((s) => s.isPasteSpecialOpen);
  const close = useUIStore((s) => s.setPasteSpecialOpen);
  const [mode, setMode] = useState<PasteSpecialMode>("values");
  const [transpose, setTranspose] = useState(false);

  if (!isOpen) return null;

  const handleApply = () => {
    performPasteSpecial({ mode, transpose });
    close(false);
  };

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
      data-testid="paste-special-overlay"
      onClick={() => close(false)}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-80"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          width: "320px",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
        data-testid="paste-special-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-lg font-semibold mb-4"
          style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}
        >
          Paste Special
        </h2>

        <div className="space-y-2 mb-4" style={{ marginBottom: "16px" }}>
          {(["values", "format", "formula"] as const).map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 cursor-pointer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="paste-mode"
                checked={mode === opt}
                onChange={() => setMode(opt)}
                data-testid={`paste-mode-${opt}`}
              />
              <span className="text-sm">
                {opt === "values"
                  ? "Values only"
                  : opt === "format"
                    ? "Format only"
                    : "Formulas only"}
              </span>
            </label>
          ))}
        </div>

        <div
          className="border-t border-gray-200 pt-3 mb-4"
          style={{
            borderTop: "1px solid #e5e7eb",
            paddingTop: "12px",
            marginBottom: "16px",
          }}
        >
          <label
            className="flex items-center gap-2 cursor-pointer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={transpose}
              onChange={(e) => setTranspose(e.target.checked)}
              data-testid="paste-special-transpose"
            />
            <span className="text-sm">Transpose</span>
          </label>
        </div>

        <div
          className="flex justify-end gap-2"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
          }}
        >
          <button
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
            }}
            data-testid="paste-special-cancel"
            onClick={() => close(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: "4px",
            }}
            data-testid="paste-special-apply"
            onClick={handleApply}
          >
            Paste
          </button>
        </div>
      </div>
    </div>
  );
};
