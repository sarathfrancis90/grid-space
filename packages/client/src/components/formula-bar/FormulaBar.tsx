/**
 * FormulaBar — name box + formula display + inline editing.
 * S7-001 to S7-005
 */
import { useState, useCallback, useRef } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useNamedRangeStore } from "../../stores/namedRangeStore";
import { colToLetter, cellRefToPosition } from "../../utils/coordinates";

export function FormulaBar() {
  const selectedCell = useUIStore((s) => s.selectedCell);
  const isEditing = useUIStore((s) => s.isEditing);
  const editValue = useUIStore((s) => s.editValue);
  const startEditing = useUIStore((s) => s.startEditing);
  const setEditValue = useUIStore((s) => s.setEditValue);
  const commitEdit = useUIStore((s) => s.commitEdit);
  const setSelectedCell = useUIStore((s) => s.setSelectedCell);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);

  const [nameBoxEditing, setNameBoxEditing] = useState(false);
  const [nameBoxValue, setNameBoxValue] = useState("");
  const nameBoxRef = useRef<HTMLInputElement>(null);
  const formulaInputRef = useRef<HTMLInputElement>(null);

  // Build cell address string
  const cellAddress = selectedCell
    ? `${colToLetter(selectedCell.col)}${selectedCell.row + 1}`
    : "";

  // Get current cell data
  const cellData = selectedCell
    ? useCellStore
        .getState()
        .getCell(sheetId, selectedCell.row, selectedCell.col)
    : undefined;

  const displayValue = isEditing
    ? editValue
    : (cellData?.formula ?? String(cellData?.value ?? ""));

  // Check for named range names for the name box
  const namedRanges = useNamedRangeStore((s) => s.getAllRanges());
  const namedRangeName = selectedCell
    ? namedRanges.find(
        (r) =>
          r.sheetId === sheetId &&
          r.startRow === selectedCell.row &&
          r.startCol === selectedCell.col &&
          r.endRow === selectedCell.row &&
          r.endCol === selectedCell.col,
      )?.name
    : undefined;

  const nameBoxDisplay = namedRangeName ?? cellAddress;

  const handleNameBoxFocus = useCallback(() => {
    setNameBoxEditing(true);
    setNameBoxValue(nameBoxDisplay);
  }, [nameBoxDisplay]);

  const handleNameBoxBlur = useCallback(() => {
    setNameBoxEditing(false);
  }, []);

  const handleNameBoxKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const val = nameBoxValue.trim().toUpperCase();
        // Try to navigate to cell reference
        try {
          const pos = cellRefToPosition(val);
          setSelectedCell(pos);
        } catch {
          // Try named range
          const range = useNamedRangeStore.getState().resolveRange(val);
          if (range && range.sheetId === sheetId) {
            setSelectedCell(range.start);
          }
        }
        setNameBoxEditing(false);
        nameBoxRef.current?.blur();
      } else if (e.key === "Escape") {
        setNameBoxEditing(false);
        nameBoxRef.current?.blur();
      }
    },
    [nameBoxValue, setSelectedCell, sheetId],
  );

  const handleFormulaFocus = useCallback(() => {
    if (!selectedCell || isEditing) return;
    startEditing(
      selectedCell,
      cellData?.formula ?? String(cellData?.value ?? ""),
    );
  }, [selectedCell, isEditing, startEditing, cellData]);

  const handleFormulaChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditValue(e.target.value);
    },
    [setEditValue],
  );

  const handleFormulaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        useUIStore.getState().cancelEdit();
      }
    },
    [commitEdit],
  );

  return (
    <div
      data-testid="formula-bar"
      className="flex items-center border-b border-gray-300 bg-white h-8"
    >
      {/* Name box */}
      <div className="flex-shrink-0 w-24 border-r border-gray-300">
        <input
          ref={nameBoxRef}
          data-testid="name-box"
          type="text"
          value={nameBoxEditing ? nameBoxValue : nameBoxDisplay}
          onChange={(e) => setNameBoxValue(e.target.value)}
          onFocus={handleNameBoxFocus}
          onBlur={handleNameBoxBlur}
          onKeyDown={handleNameBoxKeyDown}
          className="w-full h-full px-2 text-xs text-center font-medium outline-none"
        />
      </div>

      {/* fx label */}
      <div className="flex-shrink-0 px-2 text-gray-400 text-sm font-bold select-none">
        fx
      </div>

      {/* Formula input */}
      <input
        ref={formulaInputRef}
        data-testid="formula-input"
        type="text"
        value={displayValue}
        onChange={handleFormulaChange}
        onFocus={handleFormulaFocus}
        onKeyDown={handleFormulaKeyDown}
        className="flex-1 h-full px-2 text-sm outline-none"
        readOnly={!isEditing}
      />
    </div>
  );
}
