/**
 * ImportDialog — File > Import dialog for uploading CSV/XLSX/TSV/ODS files
 * with format detection, import mode selection, and data preview.
 */
import { useState, useCallback, useRef } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useCellStore } from "../../stores/cellStore";
import { useHistoryStore } from "../../stores/historyStore";
import { parseCSV, detectDelimiter } from "../../utils/fileOps";
import type { CellData } from "../../types/grid";

type ImportMode = "new-sheet" | "replace-sheet" | "append";
type Separator = "auto" | "comma" | "tab" | "semicolon";

interface ParsedData {
  rows: string[][];
  fileName: string;
  format: string;
}

const ACCEPTED_FORMATS = ".csv,.tsv,.xlsx,.xls,.ods";
const SEPARATOR_MAP: Record<Exclude<Separator, "auto">, string> = {
  comma: ",",
  tab: "\t",
  semicolon: ";",
};

export function ImportDialog() {
  const isOpen = useUIStore((s) => s.isImportDialogOpen);
  const close = useUIStore((s) => s.setImportDialogOpen);

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("new-sheet");
  const [separator, setSeparator] = useState<Separator>("auto");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setFile(null);
    setParsedData(null);
    setImportMode("new-sheet");
    setSeparator("auto");
    setError(null);
    setIsProcessing(false);
    setIsDragging(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    close(false);
  }, [reset, close]);

  const getFileFormat = (name: string): string => {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    if (ext === "csv") return "csv";
    if (ext === "tsv") return "tsv";
    if (ext === "xlsx" || ext === "xls") return "xlsx";
    if (ext === "ods") return "ods";
    return "unknown";
  };

  const parseFile = useCallback(async (f: File, sep: Separator) => {
    setError(null);
    setIsProcessing(true);

    try {
      const format = getFileFormat(f.name);

      if (format === "csv" || format === "tsv") {
        const text = await f.text();
        const delimiter =
          sep === "auto"
            ? format === "tsv"
              ? "\t"
              : detectDelimiter(text)
            : SEPARATOR_MAP[sep];
        const rows = parseCSV(text, delimiter);
        setParsedData({ rows, fileName: f.name, format });
      } else if (format === "xlsx" || format === "ods") {
        const buffer = await f.arrayBuffer();
        const { importXLSX } = await import("../../utils/fileOps");
        const sheets = await importXLSX(buffer);
        if (sheets.length === 0) {
          setError("No data found in file.");
          setParsedData(null);
          return;
        }
        // Convert first sheet cells to rows for preview
        const sheet = sheets[0];
        const rows = cellMapToRows(sheet.cells);
        setParsedData({ rows, fileName: f.name, format });
      } else {
        setError("Unsupported file format. Please use CSV, TSV, XLSX, or ODS.");
        setParsedData(null);
      }
    } catch {
      setError("Failed to parse file. Please check the file format.");
      setParsedData(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileSelect = useCallback(
    (f: File) => {
      setFile(f);
      parseFile(f, separator);
    },
    [parseFile, separator],
  );

  const handleSeparatorChange = useCallback(
    (newSep: Separator) => {
      setSeparator(newSep);
      if (file) {
        parseFile(file, newSep);
      }
    },
    [file, parseFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [handleFileSelect],
  );

  const handleImport = useCallback(async () => {
    if (!file || !parsedData) return;

    setIsProcessing(true);
    try {
      const format = getFileFormat(file.name);
      const spreadsheetStore = useSpreadsheetStore.getState();
      const cellStore = useCellStore.getState();

      useHistoryStore.getState().pushUndo();

      if (format === "xlsx" || format === "ods") {
        const buffer = await file.arrayBuffer();
        const { importXLSX } = await import("../../utils/fileOps");
        const sheets = await importXLSX(buffer);

        if (importMode === "new-sheet") {
          for (const sheet of sheets) {
            spreadsheetStore.addSheet(sheet.name);
            const allSheets = useSpreadsheetStore.getState().sheets;
            const newSheet = allSheets[allSheets.length - 1];
            const updates = cellMapToUpdates(sheet.cells);
            cellStore.setCellBatch(newSheet.id, updates);
          }
        } else if (importMode === "replace-sheet") {
          const sid = spreadsheetStore.activeSheetId;
          cellStore.clearSheet(sid);
          if (sheets.length > 0) {
            const updates = cellMapToUpdates(sheets[0].cells);
            cellStore.setCellBatch(sid, updates);
          }
        } else {
          // append
          const sid = spreadsheetStore.activeSheetId;
          const existingCells = cellStore.cells.get(sid);
          const startRow = getMaxRow(existingCells) + 1;
          if (sheets.length > 0) {
            const updates = cellMapToUpdates(sheets[0].cells, startRow);
            cellStore.setCellBatch(sid, updates);
          }
        }
      } else {
        // CSV/TSV
        const rows = parsedData.rows;

        if (importMode === "new-sheet") {
          const sheetName = file.name.replace(/\.[^.]+$/, "") || "Imported";
          spreadsheetStore.addSheet(sheetName);
          const allSheets = useSpreadsheetStore.getState().sheets;
          const newSheet = allSheets[allSheets.length - 1];
          const updates = rowsToUpdates(rows);
          cellStore.setCellBatch(newSheet.id, updates);
        } else if (importMode === "replace-sheet") {
          const sid = spreadsheetStore.activeSheetId;
          cellStore.clearSheet(sid);
          const updates = rowsToUpdates(rows);
          cellStore.setCellBatch(sid, updates);
        } else {
          // append
          const sid = spreadsheetStore.activeSheetId;
          const existingCells = cellStore.cells.get(sid);
          const startRow = getMaxRow(existingCells) + 1;
          const updates = rowsToUpdates(rows, startRow);
          cellStore.setCellBatch(sid, updates);
        }
      }

      handleClose();
    } catch {
      setError("Failed to import file.");
    } finally {
      setIsProcessing(false);
    }
  }, [file, parsedData, importMode, handleClose]);

  if (!isOpen) return null;

  const isCsvLike =
    parsedData && (parsedData.format === "csv" || parsedData.format === "tsv");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      data-testid="import-dialog-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        data-testid="import-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Import file</h2>
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
          {/* Drop zone / file picker */}
          {!parsedData && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              data-testid="import-drop-zone"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
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
                Drag and drop a file here, or{" "}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => inputRef.current?.click()}
                  data-testid="import-browse-button"
                >
                  browse
                </button>
              </p>
              <p className="mt-1 text-xs text-gray-400">CSV, TSV, XLSX, ODS</p>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_FORMATS}
                className="hidden"
                data-testid="import-file-input"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
            </div>
          )}

          {isProcessing && !parsedData && (
            <p className="text-sm text-gray-500 text-center">Parsing file...</p>
          )}

          {error && (
            <p className="text-sm text-red-500" data-testid="import-error">
              {error}
            </p>
          )}

          {/* File info & options */}
          {parsedData && (
            <>
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
                <svg
                  className="h-5 w-5 text-green-600 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium text-gray-900 truncate"
                    data-testid="import-file-name"
                  >
                    {parsedData.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {parsedData.rows.length} rows,{" "}
                    {parsedData.rows[0]?.length ?? 0} columns
                  </p>
                </div>
                <button
                  type="button"
                  className="ml-auto text-xs text-blue-600 hover:text-blue-700"
                  onClick={() => {
                    setFile(null);
                    setParsedData(null);
                    setError(null);
                  }}
                  data-testid="import-change-file"
                >
                  Change file
                </button>
              </div>

              {/* Separator selector for CSV/TSV */}
              {isCsvLike && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Separator
                  </label>
                  <select
                    value={separator}
                    onChange={(e) =>
                      handleSeparatorChange(e.target.value as Separator)
                    }
                    className="block w-48 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    data-testid="import-separator-select"
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="comma">Comma (,)</option>
                    <option value="tab">Tab</option>
                    <option value="semicolon">Semicolon (;)</option>
                  </select>
                </div>
              )}

              {/* Import mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Import location
                </label>
                <div className="space-y-2">
                  {(
                    [
                      ["new-sheet", "Insert new sheet(s)"],
                      ["replace-sheet", "Replace current sheet"],
                      ["append", "Append to current sheet"],
                    ] as [ImportMode, string][]
                  ).map(([mode, label]) => (
                    <label
                      key={mode}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="import-mode"
                        value={mode}
                        checked={importMode === mode}
                        onChange={() => setImportMode(mode)}
                        className="text-blue-600"
                        data-testid={`import-mode-${mode}`}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preview
                </label>
                <div
                  className="border border-gray-200 rounded-lg overflow-auto max-h-48"
                  data-testid="import-preview"
                >
                  <table className="text-xs w-full border-collapse">
                    <tbody>
                      {parsedData.rows.slice(0, 10).map((row, ri) => (
                        <tr
                          key={ri}
                          className={ri === 0 ? "bg-gray-50 font-medium" : ""}
                        >
                          {row.map((cell, ci) => (
                            <td
                              key={ci}
                              className="border-b border-r border-gray-100 px-2 py-1 truncate max-w-[150px]"
                              title={cell}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedData.rows.length > 10 && (
                    <p className="text-xs text-gray-400 px-2 py-1">
                      ... and {parsedData.rows.length - 10} more rows
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            data-testid="import-cancel-button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!parsedData || isProcessing}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="import-confirm-button"
          >
            {isProcessing ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Convert cell map (row,col -> CellData) to 2D string array for preview */
function cellMapToRows(cells: Map<string, CellData>): string[][] {
  let maxRow = 0;
  let maxCol = 0;
  for (const key of cells.keys()) {
    const [r, c] = key.split(",").map(Number);
    if (r > maxRow) maxRow = r;
    if (c > maxCol) maxCol = c;
  }
  const rows: string[][] = [];
  for (let r = 0; r <= maxRow; r++) {
    const row: string[] = [];
    for (let c = 0; c <= maxCol; c++) {
      const cell = cells.get(`${r},${c}`);
      row.push(cell?.value != null ? String(cell.value) : "");
    }
    rows.push(row);
  }
  return rows;
}

/** Convert cell map to batch update format */
function cellMapToUpdates(
  cells: Map<string, CellData>,
  rowOffset: number = 0,
): Array<{ row: number; col: number; data: CellData }> {
  const updates: Array<{ row: number; col: number; data: CellData }> = [];
  for (const [key, data] of cells) {
    const [r, c] = key.split(",").map(Number);
    updates.push({ row: r + rowOffset, col: c, data });
  }
  return updates;
}

/** Convert 2D string array to batch update format */
function rowsToUpdates(
  rows: string[][],
  rowOffset: number = 0,
): Array<{ row: number; col: number; data: CellData }> {
  const updates: Array<{ row: number; col: number; data: CellData }> = [];
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const val = rows[r][c];
      if (val !== "") {
        const numVal = Number(val);
        const value = val !== "" && !isNaN(numVal) ? numVal : val;
        updates.push({
          row: r + rowOffset,
          col: c,
          data: { value },
        });
      }
    }
  }
  return updates;
}

/** Get max row index from a cell map */
function getMaxRow(cells: Map<string, CellData> | undefined): number {
  if (!cells || cells.size === 0) return -1;
  let maxRow = 0;
  for (const key of cells.keys()) {
    const r = parseInt(key.split(",")[0], 10);
    if (r > maxRow) maxRow = r;
  }
  return maxRow;
}
