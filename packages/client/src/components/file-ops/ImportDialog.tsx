/**
 * ImportDialog — File > Import dialog for importing CSV/XLSX/TSV/ODS files.
 * Supports multiple import modes and separator detection with data preview.
 */
import React, { useState, useCallback, useRef } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useHistoryStore } from "../../stores/historyStore";
import { useGridStore } from "../../stores/gridStore";
import { parseCSV, detectDelimiter, importXLSX } from "../../utils/fileOps";
import type { CellData } from "../../types/grid";

type ImportMode =
  | "create-new"
  | "insert-sheet"
  | "replace-sheet"
  | "append-sheet";

type SeparatorType = "auto" | "comma" | "tab" | "semicolon";

const SEPARATOR_MAP: Record<Exclude<SeparatorType, "auto">, string> = {
  comma: ",",
  tab: "\t",
  semicolon: ";",
};

const ACCEPTED_EXTENSIONS = ".csv,.tsv,.xlsx,.xls,.ods";

function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function isTextFormat(ext: string): boolean {
  return ext === "csv" || ext === "tsv";
}

export const ImportDialog: React.FC = () => {
  const isOpen = useUIStore((s) => s.isImportDialogOpen);
  const close = useUIStore((s) => s.setImportDialogOpen);

  const [file, setFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("insert-sheet");
  const [separator, setSeparator] = useState<SeparatorType>("auto");
  const [previewData, setPreviewData] = useState<string[][] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setFile(null);
    setPreviewData(null);
    setError(null);
    setSeparator("auto");
    setImportMode("insert-sheet");
    setIsDragging(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    close(false);
  }, [resetState, close]);

  const processTextFile = useCallback(async (f: File, sep: SeparatorType) => {
    try {
      const text = await f.text();
      const delim = sep === "auto" ? detectDelimiter(text) : SEPARATOR_MAP[sep];
      const rows = parseCSV(text, delim);
      setPreviewData(rows.slice(0, 10));
      setError(null);
    } catch {
      setError("Failed to parse file. Please check the format.");
      setPreviewData(null);
    }
  }, []);

  const processFile = useCallback(
    async (f: File) => {
      setFile(f);
      setError(null);

      const ext = getFileExtension(f.name);
      if (isTextFormat(ext)) {
        if (ext === "tsv") setSeparator("tab");
        await processTextFile(f, ext === "tsv" ? "tab" : separator);
      } else if (ext === "xlsx" || ext === "xls" || ext === "ods") {
        try {
          const buffer = await f.arrayBuffer();
          const sheets = await importXLSX(buffer);
          if (sheets.length > 0) {
            const firstSheet = sheets[0];
            const rows: string[][] = [];
            let maxRow = 0;
            let maxCol = 0;
            for (const key of firstSheet.cells.keys()) {
              const [r, c] = key.split(",").map(Number);
              if (r > maxRow) maxRow = r;
              if (c > maxCol) maxCol = c;
            }
            for (let r = 0; r <= Math.min(maxRow, 9); r++) {
              const row: string[] = [];
              for (let c = 0; c <= maxCol; c++) {
                const cell = firstSheet.cells.get(`${r},${c}`);
                row.push(cell?.value != null ? String(cell.value) : "");
              }
              rows.push(row);
            }
            setPreviewData(rows);
          }
          setError(null);
        } catch {
          setError("Failed to parse file. Please check the format.");
          setPreviewData(null);
        }
      } else {
        setError(
          `Unsupported file format: .${ext}. Use CSV, TSV, XLSX, or ODS.`,
        );
        setPreviewData(null);
      }
    },
    [separator, processTextFile],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) processFile(f);
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) processFile(f);
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleSeparatorChange = useCallback(
    (newSep: SeparatorType) => {
      setSeparator(newSep);
      if (file && isTextFormat(getFileExtension(file.name))) {
        processTextFile(file, newSep);
      }
    },
    [file, processTextFile],
  );

  const handleImport = useCallback(async () => {
    if (!file) return;

    const ext = getFileExtension(file.name);
    const cellStore = useCellStore.getState();
    const spreadsheetStore = useSpreadsheetStore.getState();
    const gridStore = useGridStore.getState();

    useHistoryStore.getState().pushUndo();

    try {
      if (isTextFormat(ext)) {
        const text = await file.text();
        const delim =
          separator === "auto"
            ? detectDelimiter(text)
            : SEPARATOR_MAP[separator];
        const rows = parseCSV(text, delim);
        importRows(
          rows,
          file.name.replace(/\.[^.]+$/, ""),
          importMode,
          cellStore,
          spreadsheetStore,
          gridStore,
        );
      } else {
        const buffer = await file.arrayBuffer();
        const sheets = await importXLSX(buffer);
        if (sheets.length === 0) {
          setError("No data found in file.");
          return;
        }
        importSheets(
          sheets,
          importMode,
          cellStore,
          spreadsheetStore,
          gridStore,
        );
      }
      handleClose();
    } catch {
      setError("Failed to import file. Please try again.");
    }
  }, [file, separator, importMode, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      data-testid="import-dialog-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="w-[560px] max-h-[80vh] bg-white rounded-xl shadow-2xl flex flex-col"
        data-testid="import-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Import file</h2>
          <button
            onClick={handleClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            data-testid="import-dialog-close"
            type="button"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            data-testid="import-drop-zone"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileSelect}
              className="hidden"
              data-testid="import-file-input"
            />
            {file ? (
              <div>
                <p className="text-sm font-medium text-gray-700">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <svg
                  className="mx-auto h-10 w-10 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  Drop a file here or click to browse
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  CSV, TSV, XLSX, ODS
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500" data-testid="import-error">
              {error}
            </p>
          )}

          {/* Options */}
          {file && (
            <div className="space-y-3">
              {/* Import mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Import location
                </label>
                <select
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value as ImportMode)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  data-testid="import-mode-select"
                >
                  <option value="create-new">Create new spreadsheet</option>
                  <option value="insert-sheet">Insert new sheet(s)</option>
                  <option value="replace-sheet">Replace current sheet</option>
                  <option value="append-sheet">Append to current sheet</option>
                </select>
              </div>

              {/* Separator (CSV/TSV only) */}
              {isTextFormat(getFileExtension(file.name)) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Separator
                  </label>
                  <select
                    value={separator}
                    onChange={(e) =>
                      handleSeparatorChange(e.target.value as SeparatorType)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    data-testid="import-separator-select"
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="comma">Comma</option>
                    <option value="tab">Tab</option>
                    <option value="semicolon">Semicolon</option>
                  </select>
                </div>
              )}

              {/* Preview */}
              {previewData && previewData.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preview (first {previewData.length} rows)
                  </label>
                  <div
                    className="border border-gray-200 rounded-md overflow-auto max-h-48"
                    data-testid="import-preview"
                  >
                    <table className="min-w-full text-xs">
                      <tbody>
                        {previewData.map((row, ri) => (
                          <tr
                            key={ri}
                            className={ri === 0 ? "bg-gray-50 font-medium" : ""}
                          >
                            {row.map((cell, ci) => (
                              <td
                                key={ci}
                                className="border-b border-r border-gray-100 px-2 py-1 whitespace-nowrap max-w-[150px] truncate"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            data-testid="import-cancel-btn"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || !!error}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="import-confirm-btn"
            type="button"
          >
            Import data
          </button>
        </div>
      </div>
    </div>
  );
};

/** Import parsed CSV/TSV rows into the spreadsheet */
function importRows(
  rows: string[][],
  sheetName: string,
  mode: ImportMode,
  cellStore: ReturnType<typeof useCellStore.getState>,
  spreadsheetStore: ReturnType<typeof useSpreadsheetStore.getState>,
  gridStore: ReturnType<typeof useGridStore.getState>,
): void {
  if (rows.length === 0) return;

  const maxCols = Math.max(...rows.map((r) => r.length));

  if (mode === "replace-sheet" || mode === "append-sheet") {
    const sid = spreadsheetStore.activeSheetId;
    const startRow =
      mode === "append-sheet" ? findLastRow(cellStore, sid) + 1 : 0;

    if (mode === "replace-sheet") {
      clearSheetCells(cellStore, sid);
    }

    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        const val = rows[r][c];
        if (val !== "") {
          cellStore.setCell(sid, startRow + r, c, {
            value: parseValue(val),
          });
        }
      }
    }

    ensureGridSize(gridStore, startRow + rows.length, maxCols);
  } else if (mode === "insert-sheet" || mode === "create-new") {
    spreadsheetStore.addSheet(sheetName);
    const sheets = useSpreadsheetStore.getState().sheets;
    const newSheet = sheets[sheets.length - 1];
    spreadsheetStore.setActiveSheet(newSheet.id);

    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        const val = rows[r][c];
        if (val !== "") {
          cellStore.setCell(newSheet.id, r, c, {
            value: parseValue(val),
          });
        }
      }
    }

    ensureGridSize(gridStore, rows.length, maxCols);
  }
}

/** Import XLSX/ODS sheets into the spreadsheet */
function importSheets(
  sheets: Array<{ name: string; cells: Map<string, CellData> }>,
  mode: ImportMode,
  cellStore: ReturnType<typeof useCellStore.getState>,
  spreadsheetStore: ReturnType<typeof useSpreadsheetStore.getState>,
  gridStore: ReturnType<typeof useGridStore.getState>,
): void {
  if (mode === "replace-sheet") {
    const sid = spreadsheetStore.activeSheetId;
    clearSheetCells(cellStore, sid);
    const firstSheet = sheets[0];
    let maxRow = 0;
    let maxCol = 0;
    for (const [key, data] of firstSheet.cells) {
      const [r, c] = key.split(",").map(Number);
      cellStore.setCell(sid, r, c, data);
      if (r > maxRow) maxRow = r;
      if (c > maxCol) maxCol = c;
    }
    ensureGridSize(gridStore, maxRow + 1, maxCol + 1);
  } else if (mode === "append-sheet") {
    const sid = spreadsheetStore.activeSheetId;
    const startRow = findLastRow(cellStore, sid) + 1;
    const firstSheet = sheets[0];
    let maxRow = 0;
    let maxCol = 0;
    for (const [key, data] of firstSheet.cells) {
      const [r, c] = key.split(",").map(Number);
      cellStore.setCell(sid, startRow + r, c, data);
      if (startRow + r > maxRow) maxRow = startRow + r;
      if (c > maxCol) maxCol = c;
    }
    ensureGridSize(gridStore, maxRow + 1, maxCol + 1);
  } else {
    // insert-sheet or create-new
    for (const sheet of sheets) {
      spreadsheetStore.addSheet(sheet.name);
      const allSheets = useSpreadsheetStore.getState().sheets;
      const newSheet = allSheets[allSheets.length - 1];

      let maxRow = 0;
      let maxCol = 0;
      for (const [key, data] of sheet.cells) {
        const [r, c] = key.split(",").map(Number);
        cellStore.setCell(newSheet.id, r, c, data);
        if (r > maxRow) maxRow = r;
        if (c > maxCol) maxCol = c;
      }

      // Switch to first imported sheet
      if (sheet === sheets[0]) {
        spreadsheetStore.setActiveSheet(newSheet.id);
        ensureGridSize(gridStore, maxRow + 1, maxCol + 1);
      }
    }
  }
}

function clearSheetCells(
  cellStore: ReturnType<typeof useCellStore.getState>,
  sheetId: string,
): void {
  const sheetCells = cellStore.cells.get(sheetId);
  if (sheetCells) {
    for (const key of Array.from(sheetCells.keys())) {
      const [r, c] = key.split(",").map(Number);
      cellStore.setCell(sheetId, r, c, { value: null });
    }
  }
}

function findLastRow(
  cellStore: ReturnType<typeof useCellStore.getState>,
  sheetId: string,
): number {
  const sheetCells = cellStore.cells.get(sheetId);
  if (!sheetCells) return -1;
  let maxRow = -1;
  for (const key of sheetCells.keys()) {
    const r = parseInt(key.split(",")[0], 10);
    if (r > maxRow) maxRow = r;
  }
  return maxRow;
}

function ensureGridSize(
  gridStore: ReturnType<typeof useGridStore.getState>,
  rows: number,
  cols: number,
): void {
  if (rows > gridStore.totalRows) {
    gridStore.setTotalRows(rows);
  }
  if (cols > gridStore.totalCols) {
    gridStore.setTotalCols(cols);
  }
}

function parseValue(val: string): string | number | boolean {
  if (val === "") return "";
  const num = Number(val);
  if (!isNaN(num) && val.trim() !== "") return num;
  if (val.toLowerCase() === "true") return true;
  if (val.toLowerCase() === "false") return false;
  return val;
}
