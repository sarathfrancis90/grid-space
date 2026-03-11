/**
 * FormulaBar — name box + formula display + inline editing.
 * S7-001 to S7-005
 *
 * Enhancements:
 * - Expand/collapse chevron for multi-line formulas
 * - fx dropdown opens function picker
 * - Formula error indicator (red warning icon)
 * - Name box dropdown listing named ranges
 */
import { useState, useCallback, useRef, useMemo } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useNamedRangeStore } from "../../stores/namedRangeStore";
import { colToLetter, cellRefToPosition } from "../../utils/coordinates";
import { isFormulaError } from "../../types/formula";
import { FunctionPicker } from "./FunctionPicker";

export function FormulaBar() {
  const selectedCell = useUIStore((s) => s.selectedCell);
  const isEditing = useUIStore((s) => s.isEditing);
  const editValue = useUIStore((s) => s.editValue);
  const startEditing = useUIStore((s) => s.startEditing);
  const setEditValue = useUIStore((s) => s.setEditValue);
  const commitEdit = useUIStore((s) => s.commitEdit);
  const setSelectedCell = useUIStore((s) => s.setSelectedCell);
  const isExpanded = useUIStore((s) => s.isFormulaBarExpanded);
  const setExpanded = useUIStore((s) => s.setFormulaBarExpanded);
  const isFunctionPickerOpen = useUIStore((s) => s.isFunctionPickerOpen);
  const setFunctionPickerOpen = useUIStore((s) => s.setFunctionPickerOpen);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);

  // Subscribe to cell data reactively instead of using getState() during render
  const cellData = useCellStore((s) => {
    if (!selectedCell) return undefined;
    return s.getCell(sheetId, selectedCell.row, selectedCell.col);
  });

  const [nameBoxEditing, setNameBoxEditing] = useState(false);
  const [nameBoxValue, setNameBoxValue] = useState("");
  const [nameBoxDropdownOpen, setNameBoxDropdownOpen] = useState(false);
  const nameBoxRef = useRef<HTMLInputElement>(null);
  const formulaInputRef = useRef<HTMLTextAreaElement>(null);

  // Build cell address string
  const cellAddress = selectedCell
    ? `${colToLetter(selectedCell.col)}${selectedCell.row + 1}`
    : "";

  const displayValue = isEditing
    ? editValue
    : (cellData?.formula ?? String(cellData?.value ?? ""));

  // Detect formula error on active cell
  const hasFormulaError =
    cellData?.formula !== undefined &&
    cellData?.value !== undefined &&
    isFormulaError(cellData.value);

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
    // Delay closing dropdown so clicks inside it can fire
    setTimeout(() => setNameBoxDropdownOpen(false), 150);
  }, []);

  const handleNameBoxKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
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
        setNameBoxDropdownOpen(false);
        nameBoxRef.current?.blur();
      } else if (e.key === "Escape") {
        setNameBoxEditing(false);
        setNameBoxDropdownOpen(false);
        nameBoxRef.current?.blur();
      }
    },
    [nameBoxValue, setSelectedCell, sheetId],
  );

  const handleNamedRangeSelect = useCallback(
    (name: string) => {
      const range = useNamedRangeStore.getState().resolveRange(name);
      if (range && range.sheetId === sheetId) {
        setSelectedCell(range.start);
      }
      setNameBoxDropdownOpen(false);
      setNameBoxEditing(false);
    },
    [setSelectedCell, sheetId],
  );

  const handleFormulaFocus = useCallback(() => {
    if (!selectedCell || isEditing) return;
    startEditing(
      selectedCell,
      cellData?.formula ?? String(cellData?.value ?? ""),
    );
  }, [selectedCell, isEditing, startEditing, cellData]);

  const handleFormulaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditValue(e.target.value);
    },
    [setEditValue],
  );

  const handleFormulaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        commitEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        useUIStore.getState().cancelEdit();
      }
    },
    [commitEdit],
  );

  const handleFxClick = useCallback(() => {
    setFunctionPickerOpen(!isFunctionPickerOpen);
  }, [setFunctionPickerOpen, isFunctionPickerOpen]);

  const handleFunctionSelect = useCallback(
    (funcName: string) => {
      setFunctionPickerOpen(false);
      if (!selectedCell) return;
      if (!isEditing) {
        startEditing(selectedCell, `=${funcName}(`);
      } else {
        setEditValue(editValue + `${funcName}(`);
      }
      formulaInputRef.current?.focus();
    },
    [
      setFunctionPickerOpen,
      selectedCell,
      isEditing,
      startEditing,
      setEditValue,
      editValue,
    ],
  );

  const barHeight = isExpanded ? 68 : 30;

  return (
    <div
      data-testid="formula-bar"
      className="flex items-stretch border-b border-gray-200 bg-white relative"
      style={{ minHeight: `${barHeight}px` }}
    >
      {/* Name box with dropdown */}
      <div
        className="flex-shrink-0 border-r border-gray-300 relative"
        style={{ width: "clamp(56px, 15vw, 96px)" }}
      >
        <div className="flex items-center h-full">
          <input
            ref={nameBoxRef}
            data-testid="name-box"
            type="text"
            value={nameBoxEditing ? nameBoxValue : nameBoxDisplay}
            onChange={(e) => setNameBoxValue(e.target.value)}
            onFocus={handleNameBoxFocus}
            onBlur={handleNameBoxBlur}
            onKeyDown={handleNameBoxKeyDown}
            className="h-full w-full bg-white px-1 text-xs text-center font-medium outline-none"
            style={{ padding: "0 4px" }}
          />
          {/* Name box dropdown arrow */}
          <button
            data-testid="name-box-dropdown-btn"
            onClick={() => setNameBoxDropdownOpen(!nameBoxDropdownOpen)}
            className="flex-shrink-0 flex items-center justify-center h-full hover:bg-gray-100"
            style={{ width: 16, padding: 0 }}
            title="Show named ranges"
          >
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
              <path
                d="M0.5 0.5L4 4L7.5 0.5"
                stroke="#5f6368"
                strokeWidth="1.2"
              />
            </svg>
          </button>
        </div>

        {/* Name box dropdown */}
        {nameBoxDropdownOpen && namedRanges.length > 0 && (
          <div
            data-testid="name-box-dropdown"
            className="absolute left-0 top-full z-50 mt-0.5 bg-white border border-gray-300 rounded shadow-lg"
            style={{ minWidth: 160, maxHeight: 200, overflowY: "auto" }}
          >
            {namedRanges.map((r) => (
              <div
                key={r.name}
                data-testid={`named-range-item-${r.name}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleNamedRangeSelect(r.name);
                }}
                className="px-3 py-1.5 text-xs cursor-pointer hover:bg-blue-50"
              >
                <span className="font-medium">{r.name}</span>
                <span className="ml-2 text-gray-400">
                  {colToLetter(r.startCol)}
                  {r.startRow + 1}:{colToLetter(r.endCol)}
                  {r.endRow + 1}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* fx button with error indicator and function picker */}
      <div className="flex-shrink-0 relative flex items-center border-r border-gray-200 hidden sm:flex">
        {/* Formula error indicator */}
        {hasFormulaError && (
          <div
            data-testid="formula-error-indicator"
            className="flex items-center justify-center"
            style={{ width: 18, padding: "0 2px" }}
            title={`Formula error: ${String(cellData?.value)}`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1L13 12H1L7 1Z"
                fill="#ea4335"
                stroke="#ea4335"
                strokeWidth="0.5"
              />
              <text
                x="7"
                y="10.5"
                textAnchor="middle"
                fill="white"
                fontSize="8"
                fontWeight="bold"
              >
                !
              </text>
            </svg>
          </div>
        )}

        {/* fx button */}
        <button
          data-testid="fx-button"
          onClick={handleFxClick}
          className="flex items-center justify-center text-gray-500 text-[13px] italic select-none hover:bg-gray-100 cursor-pointer h-full"
          style={{
            width: 32,
            padding: "0 8px",
            color: isFunctionPickerOpen ? "#1a73e8" : "#5f6368",
          }}
          title="Insert function"
        >
          <span className="italic">fx</span>
        </button>

        {/* Function picker dropdown */}
        {isFunctionPickerOpen && (
          <FunctionPicker
            onSelect={handleFunctionSelect}
            onClose={() => setFunctionPickerOpen(false)}
          />
        )}
      </div>

      {/* Formula input (textarea for multi-line when expanded) */}
      <div className="flex-1 flex items-stretch min-w-0">
        <textarea
          ref={formulaInputRef}
          data-testid="formula-input"
          value={displayValue}
          onChange={handleFormulaChange}
          onFocus={handleFormulaFocus}
          onKeyDown={handleFormulaKeyDown}
          className="flex-1 bg-white px-2 text-[13px] outline-none resize-none"
          style={{
            padding: "6px 8px",
            lineHeight: "18px",
          }}
          readOnly={!isEditing}
          rows={isExpanded ? 3 : 1}
        />
      </div>

      {/* Expand/collapse chevron */}
      <button
        data-testid="formula-bar-expand-btn"
        onClick={() => setExpanded(!isExpanded)}
        className="flex-shrink-0 flex items-center justify-center hover:bg-gray-100 border-l border-gray-200"
        style={{ width: 20, padding: 0 }}
        title={isExpanded ? "Collapse formula bar" : "Expand formula bar"}
      >
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          style={{
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
          }}
        >
          <path d="M1 1L5 5L9 1" stroke="#5f6368" strokeWidth="1.5" />
        </svg>
      </button>
    </div>
  );
}
