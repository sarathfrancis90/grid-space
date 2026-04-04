/**
 * NamedRangesPanel — right sidebar for managing named ranges.
 * Create, edit, delete, and jump to named ranges.
 */
import React, { useState, useCallback } from "react";
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

/** Inline edit form for a named range */
const RangeEditForm = React.memo(function RangeEditForm({
  editNameValue,
  editRangeValue,
  onRangeChange,
  onSave,
  onCancel,
}: {
  editNameValue: string;
  editRangeValue: string;
  onRangeChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <input
        type="text"
        value={editNameValue}
        disabled
        className="w-full rounded border border-gray-300 bg-gray-100 px-2 py-1 text-[13px]"
        data-testid="named-range-edit-name"
      />
      <input
        type="text"
        value={editRangeValue}
        onChange={(e) => onRangeChange(e.target.value)}
        className="w-full rounded border border-gray-300 px-2 py-1 text-[13px]"
        data-testid="named-range-edit-range"
      />
      <div className="flex justify-end gap-1.5">
        <button
          onClick={onCancel}
          className="cursor-pointer rounded border border-gray-300 bg-white px-2.5 py-1 text-xs"
          data-testid="named-range-edit-cancel"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="cursor-pointer rounded border-none bg-blue-600 px-2.5 py-1 text-xs text-white"
          data-testid="named-range-edit-save"
        >
          Save
        </button>
      </div>
    </div>
  );
});

/** Single named range row */
const RangeListItem = React.memo(function RangeListItem({
  range,
  onJump,
  onEdit,
  onDelete,
}: {
  range: NamedRange;
  onJump: (range: NamedRange) => void;
  onEdit: (range: NamedRange) => void;
  onDelete: (name: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => onJump(range)}
        className="flex-1 cursor-pointer border-none bg-transparent p-0 text-left"
        data-testid={`named-range-jump-${range.name}`}
      >
        <div className="text-[13px] font-medium">{range.name}</div>
        <div className="text-xs text-gray-500">{formatRange(range)}</div>
      </button>
      <div className="flex gap-1">
        <button
          onClick={() => onEdit(range)}
          className="cursor-pointer border-none bg-transparent px-1.5 py-0.5 text-xs text-blue-600"
          data-testid={`named-range-edit-${range.name}`}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(range.name)}
          className="cursor-pointer border-none bg-transparent px-1.5 py-0.5 text-xs text-red-500"
          data-testid={`named-range-delete-${range.name}`}
        >
          Delete
        </button>
      </div>
    </div>
  );
});

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
    if (useNamedRangeStore.getState().getRange(name)) {
      setError("A named range with this name already exists.");
      return;
    }
    const parsed = parseRangeInput(rangeInput);
    if (!parsed) {
      setError("Invalid range. Use format like A1:C5.");
      return;
    }
    setError("");
    addRange({ name, sheetId: sheetId ?? "sheet1", ...parsed });
    setNameInput("");
    setRangeInput("");
  }, [nameInput, rangeInput, sheetId, addRange]);

  const handleDelete = useCallback(
    (name: string) => {
      removeRange(name);
      if (editingName === name) setEditingName(null);
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
      className="fixed right-0 top-0 z-40 flex h-full w-80 flex-col border-l border-gray-200 bg-white shadow-lg"
      data-testid="named-ranges-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <h2 className="m-0 text-base font-semibold">Named ranges</h2>
        <button
          onClick={() => close(false)}
          className="cursor-pointer border-none bg-transparent p-1 text-lg text-gray-500"
          data-testid="named-ranges-close"
          aria-label="Close named ranges panel"
        >
          &times;
        </button>
      </div>

      {/* Range list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {ranges.length === 0 ? (
          <p
            className="mt-6 text-center text-[13px] text-gray-500"
            data-testid="named-ranges-empty"
          >
            No named ranges defined yet.
          </p>
        ) : (
          ranges.map((range) => (
            <div
              key={range.name}
              className="border-b border-gray-100 py-2"
              data-testid={`named-range-item-${range.name}`}
            >
              {editingName === range.name ? (
                <RangeEditForm
                  editNameValue={editNameValue}
                  editRangeValue={editRangeValue}
                  onRangeChange={setEditRangeValue}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <RangeListItem
                  range={range}
                  onJump={handleJumpToRange}
                  onEdit={handleStartEdit}
                  onDelete={handleDelete}
                />
              )}
            </div>
          ))
        )}
      </div>

      {/* Add new range form */}
      <div className="border-t border-gray-200 p-4">
        <div className="mb-2 text-[13px] font-medium">Add a named range</div>
        <input
          type="text"
          placeholder="Name (e.g. SalesData)"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          className="mb-1.5 w-full rounded border border-gray-300 px-2.5 py-1.5 text-[13px]"
          data-testid="named-range-name-input"
        />
        <input
          type="text"
          placeholder="Range (e.g. A1:C5)"
          value={rangeInput}
          onChange={(e) => setRangeInput(e.target.value)}
          className="mb-1.5 w-full rounded border border-gray-300 px-2.5 py-1.5 text-[13px]"
          data-testid="named-range-range-input"
        />
        {error && (
          <p
            className="mb-1.5 text-[11px] text-red-500"
            data-testid="named-range-error"
          >
            {error}
          </p>
        )}
        <button
          onClick={handleAdd}
          className="w-full cursor-pointer rounded border-none bg-blue-600 py-2 text-[13px] text-white"
          data-testid="named-range-add-button"
        >
          Add range
        </button>
      </div>
    </div>
  );
}
