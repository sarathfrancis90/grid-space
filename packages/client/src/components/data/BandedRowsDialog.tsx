/**
 * BandedRowsDialog — pick alternating row color pairs and apply/remove them.
 */
import { useState } from "react";
import { useFormatStore } from "../../stores/formatStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useUIStore } from "../../stores/uiStore";
import { useCellStore } from "../../stores/cellStore";
import { useHistoryStore } from "../../stores/historyStore";

interface BandedRowsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PRESETS: [string, string][] = [
  ["#ffffff", "#e8f0fe"], // white / light blue
  ["#ffffff", "#f3f4f6"], // white / light gray
  ["#ffffff", "#fef3c7"], // white / light yellow
  ["#ffffff", "#d1fae5"], // white / light green
  ["#ffffff", "#fce7f3"], // white / light pink
  ["#f9fafb", "#e0e7ff"], // near-white / light indigo
];

export function BandedRowsDialog({ isOpen, onClose }: BandedRowsDialogProps) {
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const existing = useFormatStore((s) =>
    sheetId ? s.getAlternatingColors(sheetId) : null,
  );
  const [selectedPair, setSelectedPair] = useState<[string, string]>(
    existing ?? COLOR_PRESETS[0],
  );

  if (!isOpen) return null;

  const handleApply = () => {
    if (!sheetId) return;
    useHistoryStore.getState().pushUndo();
    useFormatStore.getState().setAlternatingColors(sheetId, selectedPair);

    // Apply background colors to existing data rows
    const ui = useUIStore.getState();
    const sel = ui.selections[ui.selections.length - 1];
    const cellStore = useCellStore.getState();
    const lastPos = cellStore.getLastDataPosition(sheetId);
    const startRow = sel ? Math.min(sel.start.row, sel.end.row) : 0;
    const endRow = sel ? Math.max(sel.end.row, lastPos.row) : lastPos.row;
    const startCol = sel ? Math.min(sel.start.col, sel.end.col) : 0;
    const endCol = sel ? Math.max(sel.end.col, lastPos.col) : lastPos.col;

    const formatStore = useFormatStore.getState();
    for (let r = startRow; r <= endRow; r++) {
      const color =
        (r - startRow) % 2 === 0 ? selectedPair[0] : selectedPair[1];
      formatStore.setFormatForRange(sheetId, r, startCol, r, endCol, {
        backgroundColor: color,
      });
    }

    onClose();
  };

  const handleRemove = () => {
    if (!sheetId) return;
    useHistoryStore.getState().pushUndo();
    useFormatStore.getState().setAlternatingColors(sheetId, null);

    // Clear background colors from data range
    const ui = useUIStore.getState();
    const sel = ui.selections[ui.selections.length - 1];
    const cellStore = useCellStore.getState();
    const lastPos = cellStore.getLastDataPosition(sheetId);
    const startRow = sel ? Math.min(sel.start.row, sel.end.row) : 0;
    const endRow = sel ? Math.max(sel.end.row, lastPos.row) : lastPos.row;
    const startCol = sel ? Math.min(sel.start.col, sel.end.col) : 0;
    const endCol = sel ? Math.max(sel.end.col, lastPos.col) : lastPos.col;

    const formatStore = useFormatStore.getState();
    formatStore.setFormatForRange(sheetId, startRow, startCol, endRow, endCol, {
      backgroundColor: undefined,
    });

    onClose();
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
      data-testid="banded-rows-overlay"
      onClick={onClose}
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
        data-testid="banded-rows-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-lg font-semibold mb-4"
          style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}
        >
          Alternating Colors
        </h2>

        <div className="space-y-2 mb-4" style={{ marginBottom: "16px" }}>
          {COLOR_PRESETS.map((pair, idx) => (
            <label
              key={idx}
              className="flex items-center gap-3 cursor-pointer p-1 rounded hover:bg-gray-50"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <input
                type="radio"
                name="banded-pair"
                checked={
                  selectedPair[0] === pair[0] && selectedPair[1] === pair[1]
                }
                onChange={() => setSelectedPair(pair)}
                data-testid={`banded-pair-${idx}`}
              />
              <div
                style={{
                  display: "flex",
                  gap: "2px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "16px",
                    backgroundColor: pair[0],
                  }}
                />
                <div
                  style={{
                    width: "40px",
                    height: "16px",
                    backgroundColor: pair[1],
                  }}
                />
              </div>
            </label>
          ))}
        </div>

        <div
          className="flex justify-between"
          style={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <button
            className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
            style={{
              padding: "8px 12px",
              fontSize: "14px",
              color: "#dc2626",
              border: "1px solid #fca5a5",
              borderRadius: "4px",
            }}
            data-testid="banded-rows-remove"
            onClick={handleRemove}
          >
            Remove
          </button>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
              }}
              data-testid="banded-rows-cancel"
              onClick={onClose}
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
              data-testid="banded-rows-apply"
              onClick={handleApply}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
