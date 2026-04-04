/**
 * NamedRangesPanel — Right sidebar for managing named ranges.
 * List, create, edit, delete, and jump to named ranges.
 */
import { useState, useCallback, useMemo } from "react";
import { useNamedRangeStore } from "../../stores/namedRangeStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useUIStore } from "../../stores/uiStore";
import { colToLetter } from "../../utils/coordinates";
import type { NamedRange } from "../../types/grid";

function rangeToA1(range: NamedRange): string {
  const startCol = colToLetter(range.startCol);
  const endCol = colToLetter(range.endCol);
  return `${startCol}${range.startRow + 1}:${endCol}${range.endRow + 1}`;
}

function parseA1Range(input: string): {
  startCol: number;
  startRow: number;
  endCol: number;
  endRow: number;
} | null {
  const match = input
    .trim()
    .toUpperCase()
    .match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  if (!match) return null;
  const letterToCol = (letter: string): number => {
    let col = 0;
    for (let i = 0; i < letter.length; i++) {
      col = col * 26 + (letter.charCodeAt(i) - 64);
    }
    return col - 1;
  };
  return {
    startCol: letterToCol(match[1]),
    startRow: parseInt(match[2], 10) - 1,
    endCol: letterToCol(match[3]),
    endRow: parseInt(match[4], 10) - 1,
  };
}

function isValidName(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

export function NamedRangesPanel() {
  const isOpen = useUIStore((s) => s.isNamedRangesPanelOpen);
  const closePanel = useUIStore((s) => s.setNamedRangesPanelOpen);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const rangesMap = useNamedRangeStore((s) => s.ranges);
  const addRange = useNamedRangeStore((s) => s.addRange);
  const removeRange = useNamedRangeStore((s) => s.removeRange);
  const updateRange = useNamedRangeStore((s) => s.updateRange);
  const setSelectedCell = useUIStore((s) => s.setSelectedCell);
  const setSelections = useUIStore((s) => s.setSelections);

  const allRanges = useMemo(() => Array.from(rangesMap.values()), [rangesMap]);

  const [newName, setNewName] = useState("");
  const [newRange, setNewRange] = useState("");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRange, setEditRange] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = useCallback(() => {
    setError(null);
    const trimmedName = newName.trim();
    if (!trimmedName) {
      setError("Name is required");
      return;
    }
    if (!isValidName(trimmedName)) {
      setError("Invalid name. Use letters, digits, and underscores.");
      return;
    }
    if (rangesMap.has(trimmedName)) {
      setError("Name already exists");
      return;
    }
    const parsed = parseA1Range(newRange);
    if (!parsed) {
      setError("Invalid range. Use format like A1:B10");
      return;
    }
    addRange({
      name: trimmedName,
      sheetId,
      ...parsed,
    });
    setNewName("");
    setNewRange("");
  }, [newName, newRange, sheetId, rangesMap, addRange]);

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
    setEditName(range.name);
    setEditRange(rangeToA1(range));
    setError(null);
  }, []);

  const handleSaveEdit = useCallback(
    (originalName: string) => {
      setError(null);
      const parsed = parseA1Range(editRange);
      if (!parsed) {
        setError("Invalid range format");
        return;
      }
      updateRange(originalName, parsed);
      setEditingName(null);
    },
    [editRange, updateRange],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingName(null);
    setError(null);
  }, []);

  const handleJumpToRange = useCallback(
    (range: NamedRange) => {
      setSelectedCell({ row: range.startRow, col: range.startCol });
      setSelections([
        {
          start: { row: range.startRow, col: range.startCol },
          end: { row: range.endRow, col: range.endCol },
        },
      ]);
    },
    [setSelectedCell, setSelections],
  );

  if (!isOpen) return null;

  return (
    <div
      data-testid="named-ranges-panel"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "320px",
        height: "100%",
        backgroundColor: "white",
        borderLeft: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
        boxShadow: "-2px 0 8px rgba(0,0,0,0.08)",
      }}
    >
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
        <h2 style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>
          Named ranges
        </h2>
        <button
          data-testid="named-ranges-close"
          onClick={() => closePanel(false)}
          type="button"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            color: "#6b7280",
            padding: "4px",
          }}
        >
          &#10005;
        </button>
      </div>

      {/* Add new range form */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input
            data-testid="named-range-name-input"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            style={{
              flex: 1,
              height: "32px",
              padding: "0 8px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          />
          <input
            data-testid="named-range-range-input"
            type="text"
            value={newRange}
            onChange={(e) => setNewRange(e.target.value)}
            placeholder="A1:B10"
            style={{
              flex: 1,
              height: "32px",
              padding: "0 8px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          />
        </div>
        <button
          data-testid="named-range-add-btn"
          onClick={handleAdd}
          type="button"
          style={{
            width: "100%",
            height: "32px",
            backgroundColor: "#2563eb",
            color: "white",
            borderRadius: "4px",
            fontSize: "12px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Add range
        </button>
        {error && (
          <p
            data-testid="named-range-error"
            style={{
              marginTop: "4px",
              fontSize: "11px",
              color: "#ef4444",
            }}
          >
            {error}
          </p>
        )}
      </div>

      {/* Ranges list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {allRanges.length === 0 && (
          <p
            data-testid="named-ranges-empty"
            style={{
              textAlign: "center",
              padding: "24px 0",
              fontSize: "12px",
              color: "#9ca3af",
            }}
          >
            No named ranges defined
          </p>
        )}
        {allRanges.map((range) => (
          <div
            key={range.name}
            data-testid={`named-range-row-${range.name}`}
            style={{
              padding: "8px",
              borderBottom: "1px solid #f3f4f6",
              fontSize: "12px",
            }}
          >
            {editingName === range.name ? (
              <div>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "6px",
                  }}
                >
                  <input
                    data-testid="named-range-edit-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      flex: 1,
                      height: "28px",
                      padding: "0 6px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                    disabled
                  />
                  <input
                    data-testid="named-range-edit-range"
                    type="text"
                    value={editRange}
                    onChange={(e) => setEditRange(e.target.value)}
                    style={{
                      flex: 1,
                      height: "28px",
                      padding: "0 6px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    data-testid="named-range-save-edit"
                    onClick={() => handleSaveEdit(range.name)}
                    type="button"
                    style={{
                      padding: "4px 12px",
                      backgroundColor: "#2563eb",
                      color: "white",
                      borderRadius: "4px",
                      fontSize: "11px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Save
                  </button>
                  <button
                    data-testid="named-range-cancel-edit"
                    onClick={handleCancelEdit}
                    type="button"
                    style={{
                      padding: "4px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      background: "white",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{ flex: 1, cursor: "pointer" }}
                  onClick={() => handleJumpToRange(range)}
                  data-testid={`named-range-jump-${range.name}`}
                >
                  <div style={{ fontWeight: 500 }}>{range.name}</div>
                  <div style={{ color: "#6b7280", fontSize: "11px" }}>
                    {rangeToA1(range)}
                  </div>
                </div>
                <button
                  data-testid={`named-range-edit-${range.name}`}
                  onClick={() => handleStartEdit(range)}
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#6b7280",
                    fontSize: "14px",
                    padding: "4px",
                  }}
                  title="Edit"
                >
                  &#9998;
                </button>
                <button
                  data-testid={`named-range-delete-${range.name}`}
                  onClick={() => handleDelete(range.name)}
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#ef4444",
                    fontSize: "14px",
                    padding: "4px",
                  }}
                  title="Delete"
                >
                  &#10005;
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
