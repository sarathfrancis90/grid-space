/**
 * FormulaBar — name box + formula display + inline editing.
 * S7-001 to S7-005
 * Enhanced: expand/collapse, fx dropdown, error indicator, name box dropdown.
 */
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useNamedRangeStore } from "../../stores/namedRangeStore";
import { colToLetter, cellRefToPosition } from "../../utils/coordinates";
import { isFormulaError } from "../../types/formula";
import { FunctionPicker } from "./FunctionPicker";

const COLLAPSED_HEIGHT = 30;
const EXPANDED_HEIGHT = 90;

export function FormulaBar() {
  const selectedCell = useUIStore((s) => s.selectedCell);
  const isEditing = useUIStore((s) => s.isEditing);
  const editValue = useUIStore((s) => s.editValue);
  const startEditing = useUIStore((s) => s.startEditing);
  const setEditValue = useUIStore((s) => s.setEditValue);
  const commitEdit = useUIStore((s) => s.commitEdit);
  const setSelectedCell = useUIStore((s) => s.setSelectedCell);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);

  const cellData = useCellStore((s) => {
    if (!selectedCell) return undefined;
    return s.getCell(sheetId, selectedCell.row, selectedCell.col);
  });

  const [nameBoxEditing, setNameBoxEditing] = useState(false);
  const [nameBoxValue, setNameBoxValue] = useState("");
  const [nameBoxDropdownOpen, setNameBoxDropdownOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [functionPickerOpen, setFunctionPickerOpen] = useState(false);
  const nameBoxRef = useRef<HTMLInputElement>(null);
  const formulaInputRef = useRef<HTMLTextAreaElement>(null);
  const nameBoxContainerRef = useRef<HTMLDivElement>(null);
  const fxContainerRef = useRef<HTMLDivElement>(null);

  const cellAddress = selectedCell
    ? `${colToLetter(selectedCell.col)}${selectedCell.row + 1}`
    : "";

  const displayValue = isEditing
    ? editValue
    : (cellData?.formula ?? String(cellData?.value ?? ""));

  // Detect formula error on active cell
  const hasFormulaError =
    cellData?.formula !== undefined && isFormulaError(cellData?.value);

  // Named ranges
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

  // Close dropdowns on outside click
  useEffect(() => {
    if (!nameBoxDropdownOpen && !functionPickerOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        nameBoxDropdownOpen &&
        nameBoxContainerRef.current &&
        !nameBoxContainerRef.current.contains(target)
      ) {
        setNameBoxDropdownOpen(false);
      }
      if (
        functionPickerOpen &&
        fxContainerRef.current &&
        !fxContainerRef.current.contains(target)
      ) {
        setFunctionPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [nameBoxDropdownOpen, functionPickerOpen]);

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
        e.stopPropagation();
        const val = nameBoxValue.trim().toUpperCase();
        try {
          const pos = cellRefToPosition(val);
          setSelectedCell(pos);
        } catch {
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

  const handleNameBoxDropdownSelect = useCallback(
    (name: string) => {
      const range = useNamedRangeStore.getState().resolveRange(name);
      if (range && range.sheetId === sheetId) {
        setSelectedCell(range.start);
      }
      setNameBoxDropdownOpen(false);
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

  const handleFunctionSelect = useCallback(
    (funcName: string) => {
      setFunctionPickerOpen(false);
      if (!selectedCell) return;
      const formula = `=${funcName}(`;
      if (!isEditing) {
        startEditing(selectedCell, formula);
      } else {
        setEditValue(editValue + funcName + "(");
      }
      formulaInputRef.current?.focus();
    },
    [selectedCell, isEditing, startEditing, setEditValue, editValue],
  );

  const barHeight = expanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;

  return (
    <div
      data-testid="formula-bar"
      className="flex items-stretch border-b border-gray-200 bg-white"
      style={{ height: barHeight, minHeight: barHeight }}
    >
      {/* Name box with dropdown */}
      <div
        ref={nameBoxContainerRef}
        className="relative flex-shrink-0 border-r border-gray-300 h-full flex items-center"
        style={{ width: "clamp(56px, 15vw, 110px)" }}
      >
        <input
          ref={nameBoxRef}
          data-testid="name-box"
          type="text"
          value={nameBoxEditing ? nameBoxValue : nameBoxDisplay}
          onChange={(e) => setNameBoxValue(e.target.value)}
          onFocus={handleNameBoxFocus}
          onBlur={handleNameBoxBlur}
          onKeyDown={handleNameBoxKeyDown}
          className="h-full flex-1 bg-white px-2 text-xs text-center font-medium outline-none"
          style={{ padding: "0 4px 0 8px", minWidth: 0 }}
        />
        <button
          data-testid="name-box-dropdown-toggle"
          onMouseDown={(e) => {
            e.preventDefault();
            setNameBoxDropdownOpen((v) => !v);
          }}
          className="flex-shrink-0 h-full flex items-center justify-center text-gray-400 hover:text-gray-600"
          style={{ width: 16 }}
          title="Named ranges"
        >
          <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor">
            <path d="M0 0l4 5 4-5z" />
          </svg>
        </button>

        {/* Name box dropdown */}
        {nameBoxDropdownOpen && (
          <div
            data-testid="name-box-dropdown"
            className="absolute z-50 bg-white border border-gray-300 rounded shadow-lg"
            style={{ top: "100%", left: 0, width: 200, maxHeight: 200 }}
          >
            {namedRanges.length === 0 ? (
              <div className="p-2 text-xs text-gray-500">
                No named ranges defined
              </div>
            ) : (
              <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
                {namedRanges.map((r) => (
                  <div
                    key={r.name}
                    data-testid={`name-box-dropdown-item-${r.name}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleNameBoxDropdownSelect(r.name);
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
        )}
      </div>

      {/* fx button with error indicator */}
      <div
        ref={fxContainerRef}
        className="relative flex-shrink-0 flex items-center justify-center border-r border-gray-200 select-none hidden sm:flex"
        style={{ width: 40 }}
      >
        {hasFormulaError && (
          <span
            data-testid="formula-error-indicator"
            className="absolute top-0.5 right-0.5"
            title={`Formula error: ${String(cellData?.value)}`}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="#dc2626"
              strokeWidth="1.5"
            >
              <circle cx="5" cy="5" r="4" />
              <line x1="5" y1="3" x2="5" y2="5.5" />
              <circle cx="5" cy="7" r="0.5" fill="#dc2626" />
            </svg>
          </span>
        )}
        <button
          data-testid="fx-button"
          onMouseDown={(e) => {
            e.preventDefault();
            setFunctionPickerOpen((v) => !v);
          }}
          className="text-gray-500 hover:text-blue-600 text-[13px] italic cursor-pointer"
          style={{ color: "#5f6368" }}
          title="Insert function"
        >
          fx
        </button>

        {functionPickerOpen && (
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
            overflow: expanded ? "auto" : "hidden",
            whiteSpace: expanded ? "pre-wrap" : "nowrap",
          }}
          readOnly={!isEditing}
          rows={expanded ? 4 : 1}
        />
      </div>

      {/* Expand/collapse chevron */}
      <button
        data-testid="formula-bar-expand-toggle"
        onMouseDown={(e) => {
          e.preventDefault();
          setExpanded((v) => !v);
        }}
        className="flex-shrink-0 flex items-center justify-center border-l border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
        style={{ width: 20 }}
        title={expanded ? "Collapse formula bar" : "Expand formula bar"}
      >
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="currentColor"
          style={{
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 150ms",
          }}
        >
          <path d="M0 0l5 6 5-6z" />
        </svg>
      </button>
    </div>
  );
}
