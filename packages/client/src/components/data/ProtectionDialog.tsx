/**
 * ProtectionDialog — manage protected ranges for the current sheet.
 * List existing ranges, add new ones by range reference, remove them.
 */
import { useState, useMemo } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useDataStore } from "../../stores/dataStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { cellRefToPosition, positionToCellRef } from "../../utils/coordinates";
import type { ProtectedRange } from "../../types/grid";

const EMPTY_RANGES: ProtectedRange[] = [];

export function ProtectionDialog() {
  const isOpen = useUIStore((s) => s.isProtectionDialogOpen);
  const close = useUIStore((s) => s.setProtectionDialogOpen);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const protectedRangesMap = useDataStore((s) => s.protectedRanges);
  const ranges = useMemo(
    () =>
      sheetId
        ? (protectedRangesMap.get(sheetId) ?? EMPTY_RANGES)
        : EMPTY_RANGES,
    [sheetId, protectedRangesMap],
  );

  const [rangeInput, setRangeInput] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const parseRange = (
    input: string,
  ): {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  } | null => {
    const trimmed = input.trim().toUpperCase();
    // Support A1:B5 format
    const parts = trimmed.split(":");
    if (parts.length === 2) {
      try {
        const start = cellRefToPosition(parts[0]);
        const end = cellRefToPosition(parts[1]);
        return {
          startRow: Math.min(start.row, end.row),
          startCol: Math.min(start.col, end.col),
          endRow: Math.max(start.row, end.row),
          endCol: Math.max(start.col, end.col),
        };
      } catch {
        return null;
      }
    }
    // Single cell: A1
    if (parts.length === 1) {
      try {
        const pos = cellRefToPosition(parts[0]);
        return {
          startRow: pos.row,
          startCol: pos.col,
          endRow: pos.row,
          endCol: pos.col,
        };
      } catch {
        return null;
      }
    }
    return null;
  };

  const handleAdd = () => {
    if (!sheetId) return;
    const parsed = parseRange(rangeInput);
    if (!parsed) {
      setError("Invalid range. Use format like A1:C5");
      return;
    }
    setError("");

    const newRange: ProtectedRange = {
      id: `prot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sheetId,
      ...parsed,
      description: description.trim() || undefined,
    };

    useDataStore.getState().addProtectedRange(newRange);
    setRangeInput("");
    setDescription("");
  };

  const handleRemove = (id: string) => {
    if (!sheetId) return;
    useDataStore.getState().removeProtectedRange(sheetId, id);
  };

  const formatRangeDisplay = (r: ProtectedRange): string => {
    const start = positionToCellRef({ row: r.startRow, col: r.startCol });
    const end = positionToCellRef({ row: r.endRow, col: r.endCol });
    return start === end ? start : `${start}:${end}`;
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
      data-testid="protection-overlay"
      onClick={() => close(false)}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-96"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          width: "384px",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
        data-testid="protection-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-lg font-semibold mb-4"
          style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}
        >
          Protected Ranges
        </h2>

        {/* Existing ranges list */}
        <div
          style={{
            maxHeight: "200px",
            overflowY: "auto",
            marginBottom: "16px",
          }}
        >
          {ranges.length === 0 ? (
            <p
              className="text-sm text-gray-500"
              style={{ fontSize: "13px", color: "#6b7280" }}
            >
              No protected ranges defined.
            </p>
          ) : (
            ranges.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-1.5 border-b border-gray-100"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid #f3f4f6",
                }}
                data-testid={`protected-range-${r.id}`}
              >
                <div>
                  <span
                    className="text-sm font-medium"
                    style={{ fontSize: "13px", fontWeight: 500 }}
                  >
                    {formatRangeDisplay(r)}
                  </span>
                  {r.description && (
                    <span
                      className="text-xs text-gray-400 ml-2"
                      style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                        marginLeft: "8px",
                      }}
                    >
                      {r.description}
                    </span>
                  )}
                </div>
                <button
                  className="text-xs text-red-500 hover:text-red-700"
                  style={{ fontSize: "12px", color: "#ef4444" }}
                  onClick={() => handleRemove(r.id)}
                  data-testid={`remove-protection-${r.id}`}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add new range */}
        <div style={{ marginBottom: "12px" }}>
          <label
            className="text-sm font-medium"
            style={{ fontSize: "13px", fontWeight: 500 }}
          >
            Add protected range
          </label>
          <input
            type="text"
            placeholder="e.g. A1:C5"
            value={rangeInput}
            onChange={(e) => setRangeInput(e.target.value)}
            className="w-full mt-1 px-3 py-1.5 text-sm border border-gray-300 rounded"
            style={{
              width: "100%",
              marginTop: "4px",
              padding: "6px 12px",
              fontSize: "13px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
            data-testid="protection-range-input"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full mt-1 px-3 py-1.5 text-sm border border-gray-300 rounded"
            style={{
              width: "100%",
              marginTop: "4px",
              padding: "6px 12px",
              fontSize: "13px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
            data-testid="protection-description-input"
          />
          {error && (
            <p
              className="text-xs text-red-500 mt-1"
              style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}
            >
              {error}
            </p>
          )}
        </div>

        <div
          className="flex justify-end gap-2"
          style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
        >
          <button
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
            }}
            data-testid="protection-close"
            onClick={() => close(false)}
          >
            Close
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
            data-testid="protection-add"
            onClick={handleAdd}
          >
            Add Range
          </button>
        </div>
      </div>
    </div>
  );
}
