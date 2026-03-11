/**
 * NamedRangesPanel — right sidebar for managing named ranges.
 * Create, edit, delete, and jump to named ranges.
 */
import { useState, useCallback } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useNamedRangeStore } from "../../stores/namedRangeStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { cellRefToPosition, positionToCellRef } from "../../utils/coordinates";
import type { NamedRange } from "../../types/grid";

function formatRange(range: NamedRange): string {
  const start = positionToCellRef({ row: range.startRow, col: range.startCol });
  const end = positionToCellRef({ row: range.endRow, col: range.endCol });
  return start === end ? start : `${start}:${end}`;
}

function parseRangeInput(input: string): {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
} | null {
  const trimmed = input.trim().toUpperCase();
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
  if (parts.length === 1 && trimmed.length > 0) {
    try {
      const pos = cellRefToPosition(trimmed);
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
}

const NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_.]*$/;

export function NamedRangesPanel() {
  const isOpen = useUIStore((s) => s.isNamedRangesPanelOpen);
  const close = useUIStore((s) => s.setNamedRangesPanelOpen);
  const allRanges = useNamedRangeStore((s) => s.getAllRanges);
  const addRange = useNamedRangeStore((s) => s.addRange);
  const removeRange = useNamedRangeStore((s) => s.removeRange);
  const updateRange = useNamedRangeStore((s) => s.updateRange);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);

  const [nameInput, setNameInput] = useState("");
  const [rangeInput, setRangeInput] = useState("");
  const [error, setError] = useState("");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [editRangeValue, setEditRangeValue] = useState("");

  const ranges = allRanges();

  const handleAdd = useCallback(() => {
    const name = nameInput.trim();
    if (!name) {
      setError("Name is required.");
      return;
    }
    if (!NAME_PATTERN.test(name)) {
      setError(
        "Name must start with a letter or underscore, and contain only letters, digits, underscores, or dots.",
      );
      return;
    }
    const existing = useNamedRangeStore.getState().getRange(name);
    if (existing) {
      setError("A named range with this name already exists.");
      return;
    }
    const parsed = parseRangeInput(rangeInput);
    if (!parsed) {
      setError("Invalid range. Use format like A1:C5.");
      return;
    }
    setError("");
    addRange({
      name,
      sheetId: sheetId ?? "sheet1",
      ...parsed,
    });
    setNameInput("");
    setRangeInput("");
  }, [nameInput, rangeInput, sheetId, addRange]);

  const handleDelete = useCallback(
    (name: string) => {
      removeRange(name);
      if (editingName === name) {
        setEditingName(null);
      }
    },
    [removeRange, editingName],
  );

  const handleStartEdit = useCallback((range: NamedRange) => {
    setEditingName(range.name);
    setEditNameValue(range.name);
    setEditRangeValue(formatRange(range));
    setError("");
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingName) return;
    const parsed = parseRangeInput(editRangeValue);
    if (!parsed) {
      setError("Invalid range. Use format like A1:C5.");
      return;
    }
    setError("");
    updateRange(editingName, parsed);
    setEditingName(null);
  }, [editingName, editRangeValue, updateRange]);

  const handleCancelEdit = useCallback(() => {
    setEditingName(null);
    setError("");
  }, []);

  const handleJumpToRange = useCallback((range: NamedRange) => {
    const pos = { row: range.startRow, col: range.startCol };
    const endPos = { row: range.endRow, col: range.endCol };
    useUIStore.getState().setSelectedCell(pos);
    useUIStore.getState().setSelections([{ start: pos, end: endPos }]);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed top-0 right-0 h-full bg-white border-l border-gray-200 shadow-lg z-40"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100%",
        width: "320px",
        backgroundColor: "white",
        borderLeft: "1px solid #e5e7eb",
        boxShadow: "-4px 0 12px rgba(0,0,0,0.08)",
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
      }}
      data-testid="named-ranges-panel"
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
          Named ranges
        </h2>
        <button
          onClick={() => close(false)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "18px",
            color: "#6b7280",
            padding: "4px",
          }}
          data-testid="named-ranges-close"
          aria-label="Close named ranges panel"
        >
          ×
        </button>
      </div>

      {/* Range list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 16px",
        }}
      >
        {ranges.length === 0 ? (
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              textAlign: "center",
              marginTop: "24px",
            }}
            data-testid="named-ranges-empty"
          >
            No named ranges defined yet.
          </p>
        ) : (
          ranges.map((range) => (
            <div
              key={range.name}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid #f3f4f6",
              }}
              data-testid={`named-range-item-${range.name}`}
            >
              {editingName === range.name ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <input
                    type="text"
                    value={editNameValue}
                    disabled
                    style={{
                      padding: "4px 8px",
                      fontSize: "13px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      backgroundColor: "#f3f4f6",
                      boxSizing: "border-box",
                      width: "100%",
                    }}
                    data-testid="named-range-edit-name"
                  />
                  <input
                    type="text"
                    value={editRangeValue}
                    onChange={(e) => setEditRangeValue(e.target.value)}
                    style={{
                      padding: "4px 8px",
                      fontSize: "13px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      boxSizing: "border-box",
                      width: "100%",
                    }}
                    data-testid="named-range-edit-range"
                  />
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        padding: "4px 10px",
                        fontSize: "12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        background: "white",
                        cursor: "pointer",
                      }}
                      data-testid="named-range-edit-cancel"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      style={{
                        padding: "4px 10px",
                        fontSize: "12px",
                        backgroundColor: "#2563eb",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                      data-testid="named-range-edit-save"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <button
                    onClick={() => handleJumpToRange(range)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      padding: 0,
                      flex: 1,
                    }}
                    data-testid={`named-range-jump-${range.name}`}
                  >
                    <div style={{ fontSize: "13px", fontWeight: 500 }}>
                      {range.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      {formatRange(range)}
                    </div>
                  </button>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={() => handleStartEdit(range)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                        color: "#2563eb",
                        padding: "2px 6px",
                      }}
                      data-testid={`named-range-edit-${range.name}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(range.name)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                        color: "#ef4444",
                        padding: "2px 6px",
                      }}
                      data-testid={`named-range-delete-${range.name}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add new range form */}
      <div
        style={{
          padding: "16px",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>
          Add a named range
        </div>
        <input
          type="text"
          placeholder="Name (e.g. SalesData)"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          style={{
            width: "100%",
            padding: "6px 10px",
            fontSize: "13px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            boxSizing: "border-box",
            marginBottom: "6px",
          }}
          data-testid="named-range-name-input"
        />
        <input
          type="text"
          placeholder="Range (e.g. A1:C5)"
          value={rangeInput}
          onChange={(e) => setRangeInput(e.target.value)}
          style={{
            width: "100%",
            padding: "6px 10px",
            fontSize: "13px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            boxSizing: "border-box",
            marginBottom: "6px",
          }}
          data-testid="named-range-range-input"
        />
        {error && (
          <p
            style={{ fontSize: "11px", color: "#ef4444", marginBottom: "6px" }}
            data-testid="named-range-error"
          >
            {error}
          </p>
        )}
        <button
          onClick={handleAdd}
          style={{
            width: "100%",
            padding: "8px",
            fontSize: "13px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          data-testid="named-range-add-button"
        >
          Add range
        </button>
      </div>
    </div>
  );
}
