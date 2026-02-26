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

  if (!isOpen) return null;

  const handleApply = () => {
    performPasteSpecial(mode);
    close(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      data-testid="paste-special-overlay"
      onClick={() => close(false)}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-80"
        data-testid="paste-special-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Paste Special</h2>

        <div className="space-y-2 mb-6">
          {(["values", "format", "formula"] as const).map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="paste-mode"
                checked={mode === opt}
                onChange={() => setMode(opt)}
                data-testid={`paste-mode-${opt}`}
              />
              <span className="capitalize">
                {opt === "values"
                  ? "Values only"
                  : opt === "format"
                    ? "Format only"
                    : "Formulas only"}
              </span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
            data-testid="paste-special-cancel"
            onClick={() => close(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
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
