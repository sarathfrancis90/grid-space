/**
 * Main toolbar — formatting buttons, font/size/color pickers, alignment, number formats.
 * Includes undo/redo, merge, borders, word wrap, decimal adjust, paint format, clear formatting.
 */
import { useCallback, useState, useRef, useEffect } from "react";
import { useFormatStore } from "../../stores/formatStore";
import { useUIStore } from "../../stores/uiStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useCellStore } from "../../stores/cellStore";
import { useHistoryStore } from "../../stores/historyStore";
import { ColorPicker } from "./ColorPicker";
import { NUMBER_FORMATS } from "../../utils/numberFormat";
import type { NumberFormatKey } from "../../utils/numberFormat";
import type { CellFormat, BorderSide } from "../../types/grid";

const FONT_FAMILIES = [
  "Arial",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Helvetica",
  "Trebuchet MS",
  "Comic Sans MS",
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72];

function getSelectionFormat(): CellFormat | undefined {
  const ui = useUIStore.getState();
  const sheetId = useSpreadsheetStore.getState().activeSheetId;
  if (!sheetId || ui.selections.length === 0) return undefined;
  const sel = ui.selections[ui.selections.length - 1];
  const cell = useCellStore
    .getState()
    .getCell(sheetId, sel.start.row, sel.start.col);
  return cell?.format;
}

/** Thin vertical divider between toolbar groups */
function Divider() {
  return <div className="w-px h-5 bg-gray-300 mx-1" />;
}

export function Toolbar() {
  const toggleFormat = useFormatStore((s) => s.toggleFormatOnSelection);
  const setFormat = useFormatStore((s) => s.setFormatOnSelection);
  const mergeSelection = useFormatStore((s) => s.mergeSelection);
  const clearFormatting = useFormatStore((s) => s.clearFormattingOnSelection);
  const startPaintFormat = useFormatStore((s) => s.startPaintFormat);
  const paintFormatMode = useFormatStore((s) => s.paintFormatMode);
  const cancelPaintFormat = useFormatStore((s) => s.cancelPaintFormat);
  const setBordersOnSelection = useFormatStore((s) => s.setBordersOnSelection);
  const setBordersAllOnSelection = useFormatStore(
    (s) => s.setBordersAllOnSelection,
  );
  const clearBordersOnSelection = useFormatStore(
    (s) => s.clearBordersOnSelection,
  );

  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);

  const [bordersOpen, setBordersOpen] = useState(false);
  const bordersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        bordersRef.current &&
        !bordersRef.current.contains(e.target as Node)
      ) {
        setBordersOpen(false);
      }
    }
    if (bordersOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [bordersOpen]);

  const handleBold = useCallback(() => toggleFormat("bold"), [toggleFormat]);
  const handleItalic = useCallback(
    () => toggleFormat("italic"),
    [toggleFormat],
  );
  const handleUnderline = useCallback(
    () => toggleFormat("underline"),
    [toggleFormat],
  );
  const handleStrikethrough = useCallback(
    () => toggleFormat("strikethrough"),
    [toggleFormat],
  );

  const handleFontFamily = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFormat({ fontFamily: e.target.value });
    },
    [setFormat],
  );

  const handleFontSize = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFormat({ fontSize: Number(e.target.value) });
    },
    [setFormat],
  );

  const handleTextColor = useCallback(
    (color: string) => {
      setFormat({ textColor: color });
    },
    [setFormat],
  );

  const handleBgColor = useCallback(
    (color: string) => {
      setFormat({ backgroundColor: color });
    },
    [setFormat],
  );

  const handleHAlign = useCallback(
    (align: CellFormat["horizontalAlign"]) => {
      setFormat({ horizontalAlign: align });
    },
    [setFormat],
  );

  const handleVAlign = useCallback(
    (align: CellFormat["verticalAlign"]) => {
      setFormat({ verticalAlign: align });
    },
    [setFormat],
  );

  const handleNumberFormat = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const key = e.target.value as NumberFormatKey;
      setFormat({ numberFormat: NUMBER_FORMATS[key] });
    },
    [setFormat],
  );

  const handleWrapText = useCallback(() => {
    const current = getSelectionFormat();
    const next = current?.wrapText === "wrap" ? "overflow" : "wrap";
    setFormat({ wrapText: next });
  }, [setFormat]);

  const handleIncreaseDecimal = useCallback(() => {
    const current = getSelectionFormat();
    const fmt = current?.numberFormat ?? "";
    const decimalMatch = fmt.match(/\.(\d*)/);
    const currentDecimals = decimalMatch ? decimalMatch[1].length : 0;
    const newDecimals = Math.min(currentDecimals + 1, 10);
    const intPart = "0";
    setFormat({
      numberFormat: `${intPart}.${"0".repeat(newDecimals)}`,
    });
  }, [setFormat]);

  const handleDecreaseDecimal = useCallback(() => {
    const current = getSelectionFormat();
    const fmt = current?.numberFormat ?? "";
    const decimalMatch = fmt.match(/\.(\d*)/);
    const currentDecimals = decimalMatch ? decimalMatch[1].length : 0;
    if (currentDecimals <= 0) return;
    const newDecimals = currentDecimals - 1;
    const intPart = "0";
    if (newDecimals === 0) {
      setFormat({ numberFormat: intPart });
    } else {
      setFormat({
        numberFormat: `${intPart}.${"0".repeat(newDecimals)}`,
      });
    }
  }, [setFormat]);

  const handlePaintFormat = useCallback(() => {
    if (paintFormatMode !== "off") {
      cancelPaintFormat();
    } else {
      startPaintFormat(false);
    }
  }, [paintFormatMode, startPaintFormat, cancelPaintFormat]);

  const handleBorderOption = useCallback(
    (option: string) => {
      const border: BorderSide = { color: "#000000", style: "thin" };
      switch (option) {
        case "all":
          setBordersAllOnSelection(border);
          break;
        case "none":
          clearBordersOnSelection();
          break;
        case "top":
          setBordersOnSelection(["top"], border);
          break;
        case "bottom":
          setBordersOnSelection(["bottom"], border);
          break;
        case "left":
          setBordersOnSelection(["left"], border);
          break;
        case "right":
          setBordersOnSelection(["right"], border);
          break;
      }
      setBordersOpen(false);
    },
    [setBordersOnSelection, setBordersAllOnSelection, clearBordersOnSelection],
  );

  const currentFormat = getSelectionFormat();

  return (
    <div
      data-testid="toolbar"
      className="flex items-center gap-1 px-2 py-1 bg-gray-50 border-b border-gray-300 flex-wrap"
    >
      {/* Undo / Redo */}
      <button
        data-testid="undo-button"
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200"
        onClick={undo}
        title="Undo (Ctrl+Z)"
        type="button"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 10h10a5 5 0 0 1 0 10H9" />
          <polyline points="3 10 7 6" />
          <polyline points="3 10 7 14" />
        </svg>
      </button>
      <button
        data-testid="redo-button"
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200"
        onClick={redo}
        title="Redo (Ctrl+Y)"
        type="button"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 10H11a5 5 0 0 0 0 10h4" />
          <polyline points="21 10 17 6" />
          <polyline points="21 10 17 14" />
        </svg>
      </button>

      {/* Paint format */}
      <button
        data-testid="paint-format-button"
        className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 ${
          paintFormatMode !== "off" ? "bg-blue-200" : ""
        }`}
        onClick={handlePaintFormat}
        title="Paint format"
        type="button"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 3H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
          <path d="M10 9v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-3" />
        </svg>
      </button>

      <Divider />

      {/* Font family */}
      <select
        data-testid="font-family-picker"
        className="h-7 border border-gray-300 rounded text-xs px-1 bg-white"
        value={currentFormat?.fontFamily ?? "Arial"}
        onChange={handleFontFamily}
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>

      {/* Font size */}
      <select
        data-testid="font-size-picker"
        className="h-7 w-14 border border-gray-300 rounded text-xs px-1 bg-white"
        value={currentFormat?.fontSize ?? 10}
        onChange={handleFontSize}
      >
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <Divider />

      {/* Bold / Italic / Underline / Strikethrough */}
      <button
        data-testid="bold-button"
        className={`w-7 h-7 flex items-center justify-center rounded text-sm font-bold hover:bg-gray-200 ${
          currentFormat?.bold ? "bg-gray-300" : ""
        }`}
        onClick={handleBold}
        title="Bold (Ctrl+B)"
        type="button"
      >
        B
      </button>
      <button
        data-testid="italic-button"
        className={`w-7 h-7 flex items-center justify-center rounded text-sm italic hover:bg-gray-200 ${
          currentFormat?.italic ? "bg-gray-300" : ""
        }`}
        onClick={handleItalic}
        title="Italic (Ctrl+I)"
        type="button"
      >
        I
      </button>
      <button
        data-testid="underline-button"
        className={`w-7 h-7 flex items-center justify-center rounded text-sm underline hover:bg-gray-200 ${
          currentFormat?.underline ? "bg-gray-300" : ""
        }`}
        onClick={handleUnderline}
        title="Underline (Ctrl+U)"
        type="button"
      >
        U
      </button>
      <button
        data-testid="strikethrough-button"
        className={`w-7 h-7 flex items-center justify-center rounded text-sm line-through hover:bg-gray-200 ${
          currentFormat?.strikethrough ? "bg-gray-300" : ""
        }`}
        onClick={handleStrikethrough}
        title="Strikethrough"
        type="button"
      >
        S
      </button>

      <Divider />

      {/* Text color */}
      <ColorPicker
        currentColor={currentFormat?.textColor ?? "#000000"}
        onColorChange={handleTextColor}
        label="Text color"
      />

      {/* Background color */}
      <ColorPicker
        currentColor={currentFormat?.backgroundColor ?? "#ffffff"}
        onColorChange={handleBgColor}
        label="Fill color"
      />

      <Divider />

      {/* Borders dropdown */}
      <div ref={bordersRef} className="relative inline-block">
        <button
          data-testid="borders-button"
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200"
          onClick={() => setBordersOpen(!bordersOpen)}
          title="Borders"
          type="button"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="1" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="12" y1="3" x2="12" y2="21" />
          </svg>
        </button>
        {bordersOpen && (
          <div
            data-testid="borders-dropdown"
            className="absolute z-50 top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-[140px]"
          >
            {[
              { key: "all", label: "All borders" },
              { key: "top", label: "Top border" },
              { key: "bottom", label: "Bottom border" },
              { key: "left", label: "Left border" },
              { key: "right", label: "Right border" },
              { key: "none", label: "No borders" },
            ].map((opt) => (
              <button
                key={opt.key}
                data-testid={`border-${opt.key}`}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50"
                onClick={() => handleBorderOption(opt.key)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Merge cells */}
      <button
        data-testid="merge-cells-button"
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200"
        onClick={mergeSelection}
        title="Merge cells"
        type="button"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="1" />
          <path d="M9 12h6M9 12l2-2M9 12l2 2M15 12l-2-2M15 12l-2 2" />
        </svg>
      </button>

      <Divider />

      {/* Horizontal alignment — distinct SVG icons */}
      <button
        data-testid="align-left-button"
        className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 ${
          currentFormat?.horizontalAlign === "left" ? "bg-gray-300" : ""
        }`}
        onClick={() => handleHAlign("left")}
        title="Align left"
        type="button"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="10" x2="15" y2="10" />
          <line x1="3" y1="14" x2="18" y2="14" />
          <line x1="3" y1="18" x2="12" y2="18" />
        </svg>
      </button>
      <button
        data-testid="align-center-button"
        className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 ${
          currentFormat?.horizontalAlign === "center" ? "bg-gray-300" : ""
        }`}
        onClick={() => handleHAlign("center")}
        title="Align center"
        type="button"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="6" y1="10" x2="18" y2="10" />
          <line x1="4" y1="14" x2="20" y2="14" />
          <line x1="8" y1="18" x2="16" y2="18" />
        </svg>
      </button>
      <button
        data-testid="align-right-button"
        className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 ${
          currentFormat?.horizontalAlign === "right" ? "bg-gray-300" : ""
        }`}
        onClick={() => handleHAlign("right")}
        title="Align right"
        type="button"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="9" y1="10" x2="21" y2="10" />
          <line x1="6" y1="14" x2="21" y2="14" />
          <line x1="12" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <Divider />

      {/* Vertical alignment */}
      <button
        data-testid="valign-top-button"
        className={`w-7 h-7 flex items-center justify-center rounded text-xs hover:bg-gray-200 ${
          currentFormat?.verticalAlign === "top" ? "bg-gray-300" : ""
        }`}
        onClick={() => handleVAlign("top")}
        title="Align top"
        type="button"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="4" y1="4" x2="20" y2="4" />
          <polyline points="8 10 12 6 16 10" />
          <line x1="12" y1="6" x2="12" y2="20" />
        </svg>
      </button>
      <button
        data-testid="valign-middle-button"
        className={`w-7 h-7 flex items-center justify-center rounded text-xs hover:bg-gray-200 ${
          currentFormat?.verticalAlign === "middle" ? "bg-gray-300" : ""
        }`}
        onClick={() => handleVAlign("middle")}
        title="Align middle"
        type="button"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="4" y1="12" x2="20" y2="12" />
          <polyline points="8 8 12 4 16 8" />
          <polyline points="8 16 12 20 16 16" />
        </svg>
      </button>
      <button
        data-testid="valign-bottom-button"
        className={`w-7 h-7 flex items-center justify-center rounded text-xs hover:bg-gray-200 ${
          currentFormat?.verticalAlign === "bottom" ? "bg-gray-300" : ""
        }`}
        onClick={() => handleVAlign("bottom")}
        title="Align bottom"
        type="button"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="4" y1="20" x2="20" y2="20" />
          <polyline points="8 14 12 18 16 14" />
          <line x1="12" y1="4" x2="12" y2="18" />
        </svg>
      </button>

      <Divider />

      {/* Word wrap */}
      <button
        data-testid="word-wrap-button"
        className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 ${
          currentFormat?.wrapText === "wrap" ? "bg-gray-300" : ""
        }`}
        onClick={handleWrapText}
        title="Word wrap"
        type="button"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M3 12h15a3 3 0 0 1 0 6h-4" />
          <polyline points="14 15 11 18 14 21" />
        </svg>
      </button>

      <Divider />

      {/* Increase / Decrease decimal */}
      <button
        data-testid="decrease-decimal-button"
        className="w-7 h-7 flex items-center justify-center rounded text-xs hover:bg-gray-200"
        onClick={handleDecreaseDecimal}
        title="Decrease decimal places"
        type="button"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <text x="1" y="16" fontSize="11" fontFamily="Arial">
            .0
          </text>
          <path
            d="M18 8l4 4-4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </button>
      <button
        data-testid="increase-decimal-button"
        className="w-7 h-7 flex items-center justify-center rounded text-xs hover:bg-gray-200"
        onClick={handleIncreaseDecimal}
        title="Increase decimal places"
        type="button"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <text x="1" y="16" fontSize="11" fontFamily="Arial">
            .00
          </text>
          <path
            d="M22 8l-4 4 4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </button>

      <Divider />

      {/* Number format */}
      <select
        data-testid="number-format-picker"
        className="h-7 border border-gray-300 rounded text-xs px-1 bg-white"
        value={
          Object.entries(NUMBER_FORMATS).find(
            ([, v]) => v === (currentFormat?.numberFormat ?? "General"),
          )?.[0] ?? "General"
        }
        onChange={handleNumberFormat}
      >
        <option value="General">General</option>
        <option value="Number">Number</option>
        <option value="Currency">Currency</option>
        <option value="Percent">Percent</option>
        <option value="Date">Date</option>
        <option value="DateLong">Date (long)</option>
        <option value="Time">Time</option>
        <option value="Time12">Time (12h)</option>
        <option value="Scientific">Scientific</option>
      </select>

      <Divider />

      {/* Clear formatting */}
      <button
        data-testid="clear-formatting-button"
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200"
        onClick={clearFormatting}
        title="Clear formatting"
        type="button"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 7h16" />
          <path d="M10 4v3" />
          <path d="M12 20l4-13" />
          <line x1="4" y1="20" x2="20" y2="4" stroke="red" strokeWidth="2" />
        </svg>
      </button>
    </div>
  );
}
