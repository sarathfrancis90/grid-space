/**
 * Main toolbar — formatting buttons, font/size/color pickers, alignment, number formats.
 */
import { useCallback } from "react";
import { useFormatStore } from "../../stores/formatStore";
import { useUIStore } from "../../stores/uiStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useCellStore } from "../../stores/cellStore";
import { ColorPicker } from "./ColorPicker";
import { NUMBER_FORMATS } from "../../utils/numberFormat";
import type { NumberFormatKey } from "../../utils/numberFormat";
import type { CellFormat } from "../../types/grid";

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

export function Toolbar() {
  const toggleFormat = useFormatStore((s) => s.toggleFormatOnSelection);
  const setFormat = useFormatStore((s) => s.setFormatOnSelection);

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

  const currentFormat = getSelectionFormat();

  return (
    <div
      data-testid="toolbar"
      className="flex items-center gap-1 px-2 py-1 bg-gray-50 border-b border-gray-300 flex-wrap"
    >
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

      <div className="w-px h-5 bg-gray-300 mx-1" />

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

      <div className="w-px h-5 bg-gray-300 mx-1" />

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

      <div className="w-px h-5 bg-gray-300 mx-1" />

      {/* Horizontal alignment */}
      <button
        data-testid="align-left-button"
        className={`w-7 h-7 flex items-center justify-center rounded text-xs hover:bg-gray-200 ${
          currentFormat?.horizontalAlign === "left" ? "bg-gray-300" : ""
        }`}
        onClick={() => handleHAlign("left")}
        title="Align left"
        type="button"
      >
        ≡
      </button>
      <button
        data-testid="align-center-button"
        className={`w-7 h-7 flex items-center justify-center rounded text-xs hover:bg-gray-200 ${
          currentFormat?.horizontalAlign === "center" ? "bg-gray-300" : ""
        }`}
        onClick={() => handleHAlign("center")}
        title="Align center"
        type="button"
      >
        ≡
      </button>
      <button
        data-testid="align-right-button"
        className={`w-7 h-7 flex items-center justify-center rounded text-xs hover:bg-gray-200 ${
          currentFormat?.horizontalAlign === "right" ? "bg-gray-300" : ""
        }`}
        onClick={() => handleHAlign("right")}
        title="Align right"
        type="button"
      >
        ≡
      </button>

      <div className="w-px h-5 bg-gray-300 mx-1" />

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
        ⊤
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
        ⊟
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
        ⊥
      </button>

      <div className="w-px h-5 bg-gray-300 mx-1" />

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
    </div>
  );
}
