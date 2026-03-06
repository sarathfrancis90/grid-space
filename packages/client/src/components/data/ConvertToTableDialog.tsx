import { useState, useMemo, useEffect } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useCellStore } from "../../stores/cellStore";
import { useTableStore } from "../../stores/tableStore";
import { getCellKey } from "../../utils/coordinates";
import { getTableStyleColors } from "../../utils/structuredRef";
import type { TableStylePreset } from "../../types/grid";

const STYLE_PRESETS: { value: TableStylePreset; label: string }[] = [
  { value: "blue-medium-1", label: "Blue Medium 1" },
  { value: "blue-medium-2", label: "Blue Medium 2" },
  { value: "green-medium-1", label: "Green Medium 1" },
  { value: "green-medium-2", label: "Green Medium 2" },
  { value: "orange-medium-1", label: "Orange Medium 1" },
  { value: "orange-medium-2", label: "Orange Medium 2" },
  { value: "grey-medium-1", label: "Grey Medium 1" },
  { value: "grey-medium-2", label: "Grey Medium 2" },
  { value: "purple-medium-1", label: "Purple Medium 1" },
  { value: "red-medium-1", label: "Red Medium 1" },
];

function detectHeaders(
  cells: Map<string, { value: string | number | boolean | null }>,
  startRow: number,
  startCol: number,
  endCol: number,
): boolean {
  let textCount = 0;
  const colCount = endCol - startCol + 1;
  for (let c = startCol; c <= endCol; c++) {
    const cell = cells.get(getCellKey(startRow, c));
    if (cell?.value != null && typeof cell.value === "string") {
      textCount++;
    }
  }
  return colCount > 0 && textCount / colCount >= 0.5;
}

export function ConvertToTableDialog() {
  const isOpen = useUIStore((s) => s.isConvertToTableOpen);
  const close = useUIStore((s) => s.setConvertToTableOpen);
  const selections = useUIStore((s) => s.selections);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);

  const [tableName, setTableName] = useState("");
  const [selectedPreset, setSelectedPreset] =
    useState<TableStylePreset>("blue-medium-1");

  const selection =
    selections.length > 0 ? selections[selections.length - 1] : null;

  const autoDetected = useMemo(() => {
    if (!selection) return true;
    const cells = useCellStore.getState().cells.get(sheetId) ?? new Map();
    const startRow = Math.min(selection.start.row, selection.end.row);
    const startCol = Math.min(selection.start.col, selection.end.col);
    const endCol = Math.max(selection.start.col, selection.end.col);
    return detectHeaders(cells, startRow, startCol, endCol);
  }, [selection, sheetId]);

  const [hasHeaders, setHasHeaders] = useState(autoDetected);

  useEffect(() => {
    setHasHeaders(autoDetected);
  }, [autoDetected]);

  if (!isOpen) return null;

  if (!selection) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
        data-testid="convert-to-table-overlay"
      >
        <div
          className="w-96 rounded-lg bg-white p-6 shadow-xl"
          data-testid="convert-to-table-dialog"
        >
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Convert to Table
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Please select a range of cells first.
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => close(false)}
              className="rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
              data-testid="convert-to-table-cancel"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const startRow = Math.min(selection.start.row, selection.end.row);
  const startCol = Math.min(selection.start.col, selection.end.col);
  const endRow = Math.max(selection.start.row, selection.end.row);
  const endCol = Math.max(selection.start.col, selection.end.col);

  const handleCreate = () => {
    const cells = useCellStore.getState().cells.get(sheetId) ?? new Map();
    const name = tableName.trim() || undefined;

    const created = useTableStore
      .getState()
      .convertSelectionToTable(
        sheetId,
        startRow,
        startCol,
        endRow,
        endCol,
        cells,
        hasHeaders,
        name,
      );

    if (created && selectedPreset !== "blue-medium-1") {
      useTableStore.getState().setStylePreset(created.id, selectedPreset);
    }

    setTableName("");
    close(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      data-testid="convert-to-table-overlay"
    >
      <div
        className="w-[420px] rounded-lg bg-white p-6 shadow-xl"
        data-testid="convert-to-table-dialog"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Convert to Table
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Range
            </label>
            <div
              className="rounded border bg-gray-50 px-3 py-2 text-sm text-gray-700"
              data-testid="table-range-display"
            >
              Row {startRow + 1}, Col {startCol + 1} to Row {endRow + 1}, Col{" "}
              {endCol + 1}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Table Name (optional)
            </label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="e.g., Sales"
              className="w-full rounded border px-3 py-2 text-sm outline-none focus:border-blue-400"
              data-testid="table-name-input"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hasHeaders}
              onChange={(e) => setHasHeaders(e.target.checked)}
              data-testid="has-headers-checkbox"
            />
            My data has headers
            {autoDetected && (
              <span className="text-xs text-gray-400">(auto-detected)</span>
            )}
          </label>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Style
            </label>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((preset) => {
                const colors = getTableStyleColors(preset.value);
                return (
                  <button
                    key={preset.value}
                    title={preset.label}
                    onClick={() => setSelectedPreset(preset.value)}
                    className={`h-7 w-7 rounded border-2 ${
                      selectedPreset === preset.value
                        ? "border-blue-500"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: colors.headerBg }}
                    data-testid={`table-style-${preset.value}`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => {
              setTableName("");
              close(false);
            }}
            className="rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
            data-testid="convert-to-table-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            data-testid="convert-to-table-confirm"
          >
            Create Table
          </button>
        </div>
      </div>
    </div>
  );
}
