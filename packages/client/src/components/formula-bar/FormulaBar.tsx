/**
 * FormulaBar — name box + formula display + inline editing.
 * S7-001 to S7-005
 */
import { useState, useCallback, useRef, useMemo } from "react";
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

  // Subscribe to cell data reactively instead of using getState() during render
  const cellData = useCellStore((s) => {
    if (!selectedCell) return undefined;
    return s.getCell(sheetId, selectedCell.row, selectedCell.col);
  });

  const [nameBoxEditing, setNameBoxEditing] = useState(false);
  const [nameBoxValue, setNameBoxValue] = useState("");
  const nameBoxRef = useRef<HTMLInputElement>(null);
  const formulaInputRef = useRef<HTMLInputElement>(null);

  // Build cell address string
  const cellAddress = selectedCell
    ? `${colToLetter(selectedCell.col)}${selectedCell.row + 1}`
    : "";

  const displayValue = isEditing
    ? editValue
    : (cellData?.formula ?? String(cellData?.value ?? ""));

  // Select raw ranges Map and derive array with useMemo to avoid new array every render
  const ranges = useNamedRangeStore((s) => s.ranges);
  const namedRanges = useMemo(() => Array.from(ranges.values()), [ranges]);
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
      className="flex items-center border-b border-gray-200 bg-gray-50 h-7"
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
          className="h-full w-full bg-white px-2 text-xs text-center font-medium outline-none border border-gray-300"
        />
      </div>

      {/* fx label */}
      <div className="flex-shrink-0 px-2 text-gray-400 text-[13px] italic select-none">
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
        className="flex-1 h-full bg-transparent px-2 text-[13px] outline-none focus:border-b focus:border-blue-400"
        readOnly={!isEditing}
      />
    </div>
  );
}
