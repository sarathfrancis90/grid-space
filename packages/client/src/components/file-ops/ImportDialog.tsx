/**
 * ImportDialog — file import with format detection, import mode selection,
 * separator config for CSV, and data preview.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useHistoryStore } from "../../stores/historyStore";
import { parseCSV, detectDelimiter, importXLSX } from "../../utils/fileOps";
import type { CellData } from "../../types/grid";

type ImportMode =
  | "create-spreadsheet"
  | "insert-sheet"
  | "replace-sheet"
  | "append-sheet";

type SeparatorOption = "auto" | "comma" | "tab" | "semicolon" | "custom";

interface ParsedSheet {
  name: string;
  rows: string[][];
}

const SEPARATOR_MAP: Record<string, string> = {
  comma: ",",
  tab: "\t",
  semicolon: ";",
};

const ACCEPTED_EXTENSIONS = ".csv,.tsv,.xlsx,.xls,.ods";
const MAX_PREVIEW_ROWS = 10;
const MAX_PREVIEW_COLS = 8;

export function ImportDialog() {
  const isOpen = useUIStore((s) => s.isImportDialogOpen);
  const [file, setFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("insert-sheet");
  const [separator, setSeparator] = useState<SeparatorOption>("auto");
  const [customSeparator, setCustomSeparator] = useState("");
  const [parsedSheets, setParsedSheets] = useState<ParsedSheet[]>([]);
  const [detectedFormat, setDetectedFormat] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setFile(null);
    setImportMode("insert-sheet");
    setSeparator("auto");
    setCustomSeparator("");
    setParsedSheets([]);
    setDetectedFormat("");
    setIsLoading(false);
    setError(null);
    setIsDragOver(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  const handleClose = useCallback(() => {
    useUIStore.getState().setImportDialogOpen(false);
  }, []);

  const detectFileFormat = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    if (ext === "csv") return "csv";
    if (ext === "tsv") return "tsv";
    if (ext === "xlsx" || ext === "xls") return "xlsx";
    if (ext === "ods") return "ods";
    return "csv";
  };

  const parseFile = useCallback(
    async (selectedFile: File, sep?: SeparatorOption) => {
      setIsLoading(true);
      setError(null);
      const format = detectFileFormat(selectedFile.name);
      setDetectedFormat(format);

      try {
        if (format === "xlsx" || format === "ods") {
          const buffer = await selectedFile.arrayBuffer();
          const sheets = await importXLSX(buffer);
          const parsed: ParsedSheet[] = sheets.map((s) => {
            const rows: string[][] = [];
            let maxRow = 0;
            let maxCol = 0;
            for (const key of s.cells.keys()) {
              const [r, c] = key.split(",").map(Number);
              if (r > maxRow) maxRow = r;
              if (c > maxCol) maxCol = c;
            }
            for (let r = 0; r <= maxRow; r++) {
              const row: string[] = [];
              for (let c = 0; c <= maxCol; c++) {
                const cell = s.cells.get(`${r},${c}`);
                row.push(cell?.value != null ? String(cell.value) : "");
              }
              rows.push(row);
            }
            return { name: s.name, rows };
          });
          setParsedSheets(parsed);
        } else {
          const text = await selectedFile.text();
          const effectiveSep = sep ?? separator;
          let delimiter: string;
          if (effectiveSep === "auto") {
            delimiter = format === "tsv" ? "\t" : detectDelimiter(text);
          } else if (effectiveSep === "custom") {
            delimiter = customSeparator || ",";
          } else {
            delimiter = SEPARATOR_MAP[effectiveSep] ?? ",";
          }
          const rows = parseCSV(text, delimiter);
          const name = selectedFile.name.replace(/\.[^.]+$/, "") || "Sheet";
          setParsedSheets([{ name, rows }]);
        }
      } catch {
        setError("Failed to parse file. Please check the file format.");
        setParsedSheets([]);
      } finally {
        setIsLoading(false);
      }
    },
    [separator, customSeparator],
  );

  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      setFile(selectedFile);
      parseFile(selectedFile);
    },
    [parseFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleSeparatorChange = useCallback(
    (newSep: SeparatorOption) => {
      setSeparator(newSep);
      if (file && (detectedFormat === "csv" || detectedFormat === "tsv")) {
        parseFile(file, newSep);
      }
    },
    [file, detectedFormat, parseFile],
  );

  const handleImport = useCallback(() => {
    if (parsedSheets.length === 0) return;

    const spreadsheetStore = useSpreadsheetStore.getState();
    const cellStore = useCellStore.getState();

    useHistoryStore.getState().pushUndo();

    if (importMode === "replace-sheet") {
      const sheetId = spreadsheetStore.activeSheetId;
      // Clear existing data
      const existingCells = cellStore.cells.get(sheetId);
      if (existingCells) {
        for (const key of existingCells.keys()) {
          const [r, c] = key.split(",").map(Number);
          cellStore.deleteCell(sheetId, r, c);
        }
      }
      // Write first parsed sheet data
      const sheet = parsedSheets[0];
      const updates: Array<{ row: number; col: number; data: CellData }> = [];
      for (let r = 0; r < sheet.rows.length; r++) {
        for (let c = 0; c < sheet.rows[r].length; c++) {
          const val = sheet.rows[r][c];
          if (val !== "") {
            const numVal = Number(val);
            updates.push({
              row: r,
              col: c,
              data: {
                value: !isNaN(numVal) && val.trim() !== "" ? numVal : val,
              },
            });
          }
        }
      }
      cellStore.setCellBatch(sheetId, updates);
    } else if (importMode === "append-sheet") {
      const sheetId = spreadsheetStore.activeSheetId;
      const { row: lastRow } = cellStore.getLastDataPosition(sheetId);
      const startRow = lastRow > 0 ? lastRow + 1 : 0;
      const sheet = parsedSheets[0];
      const updates: Array<{ row: number; col: number; data: CellData }> = [];
      for (let r = 0; r < sheet.rows.length; r++) {
        for (let c = 0; c < sheet.rows[r].length; c++) {
          const val = sheet.rows[r][c];
          if (val !== "") {
            const numVal = Number(val);
            updates.push({
              row: startRow + r,
              col: c,
              data: {
                value: !isNaN(numVal) && val.trim() !== "" ? numVal : val,
              },
            });
          }
        }
      }
      cellStore.setCellBatch(sheetId, updates);
    } else {
      // insert-sheet or create-spreadsheet — add new sheet(s)
      for (const sheet of parsedSheets) {
        spreadsheetStore.addSheet(sheet.name);
        const sheets = useSpreadsheetStore.getState().sheets;
        const newSheet = sheets[sheets.length - 1];
        const newSheetId = newSheet.id;
        cellStore.ensureSheet(newSheetId);
        const updates: Array<{ row: number; col: number; data: CellData }> = [];
        for (let r = 0; r < sheet.rows.length; r++) {
          for (let c = 0; c < sheet.rows[r].length; c++) {
            const val = sheet.rows[r][c];
            if (val !== "") {
              const numVal = Number(val);
              updates.push({
                row: r,
                col: c,
                data: {
                  value: !isNaN(numVal) && val.trim() !== "" ? numVal : val,
                },
              });
            }
          }
        }
        cellStore.setCellBatch(newSheetId, updates);
        spreadsheetStore.setActiveSheet(newSheetId);
      }
    }

    handleClose();
  }, [parsedSheets, importMode, handleClose]);

  if (!isOpen) return null;

  const isCsvFormat = detectedFormat === "csv" || detectedFormat === "tsv";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      data-testid="import-dialog-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      onKeyDown={() => {}}
      role="presentation"
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-[640px] max-h-[80vh] flex flex-col"
        data-testid="import-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Import file</h2>
          <button
            data-testid="import-dialog-close"
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            onClick={handleClose}
            type="button"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {/* Upload zone */}
          <div
            data-testid="import-upload-zone"
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragOver
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              className="hidden"
              onChange={handleInputChange}
              data-testid="import-file-input"
            />
            {file ? (
              <div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {detectedFormat.toUpperCase()} &middot;{" "}
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <p className="text-xs text-blue-500 mt-2">
                  Click or drop to replace
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600">
                  Drag and drop a file here, or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supports CSV, TSV, XLSX, ODS
                </p>
              </div>
            )}
          </div>

          {isLoading && (
            <p
              className="text-sm text-gray-500 mt-3"
              data-testid="import-loading"
            >
              Parsing file...
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 mt-3" data-testid="import-error">
              {error}
            </p>
          )}

          {file && !isLoading && !error && (
            <>
              {/* Import mode */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Import location
                </label>
                <select
                  data-testid="import-mode-select"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value as ImportMode)}
                >
                  <option value="insert-sheet">Insert new sheet(s)</option>
                  <option value="replace-sheet">Replace current sheet</option>
                  <option value="append-sheet">Append to current sheet</option>
                  <option value="create-spreadsheet">
                    Create new spreadsheet
                  </option>
                </select>
              </div>

              {/* Separator options for CSV/TSV */}
              {isCsvFormat && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Separator
                  </label>
                  <div
                    className="flex gap-3 flex-wrap"
                    data-testid="import-separator-options"
                  >
                    {(
                      [
                        ["auto", "Auto-detect"],
                        ["comma", "Comma"],
                        ["tab", "Tab"],
                        ["semicolon", "Semicolon"],
                        ["custom", "Custom"],
                      ] as const
                    ).map(([value, label]) => (
                      <label
                        key={value}
                        className="flex items-center gap-1 text-sm text-gray-700"
                      >
                        <input
                          type="radio"
                          name="separator"
                          value={value}
                          checked={separator === value}
                          onChange={() => handleSeparatorChange(value)}
                          data-testid={`import-sep-${value}`}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  {separator === "custom" && (
                    <input
                      data-testid="import-custom-separator"
                      className="mt-2 border border-gray-300 rounded px-3 py-1.5 text-sm w-20"
                      value={customSeparator}
                      onChange={(e) => {
                        setCustomSeparator(e.target.value);
                        if (file && e.target.value) {
                          parseFile(file, "custom");
                        }
                      }}
                      placeholder="e.g. |"
                      maxLength={3}
                    />
                  )}
                </div>
              )}

              {/* Preview */}
              {parsedSheets.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                    {parsedSheets.length > 1 &&
                      ` (${parsedSheets.length} sheets)`}
                  </label>
                  <div
                    className="border border-gray-200 rounded overflow-auto max-h-48"
                    data-testid="import-preview"
                  >
                    <table className="text-xs w-full border-collapse">
                      <tbody>
                        {parsedSheets[0].rows
                          .slice(0, MAX_PREVIEW_ROWS)
                          .map((row, ri) => (
                            <tr
                              key={ri}
                              className={
                                ri === 0 ? "bg-gray-50 font-medium" : ""
                              }
                            >
                              {row
                                .slice(0, MAX_PREVIEW_COLS)
                                .map((cell, ci) => (
                                  <td
                                    key={ci}
                                    className="border border-gray-200 px-2 py-1 truncate max-w-[120px]"
                                    title={cell}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              {row.length > MAX_PREVIEW_COLS && (
                                <td className="border border-gray-200 px-2 py-1 text-gray-400">
                                  ...
                                </td>
                              )}
                            </tr>
                          ))}
                        {parsedSheets[0].rows.length > MAX_PREVIEW_ROWS && (
                          <tr>
                            <td
                              colSpan={
                                Math.min(
                                  parsedSheets[0].rows[0]?.length ?? 1,
                                  MAX_PREVIEW_COLS,
                                ) + 1
                              }
                              className="text-center text-gray-400 py-1"
                            >
                              ...{" "}
                              {parsedSheets[0].rows.length - MAX_PREVIEW_ROWS}{" "}
                              more rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            data-testid="import-cancel-btn"
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            onClick={handleClose}
            type="button"
          >
            Cancel
          </button>
          <button
            data-testid="import-confirm-btn"
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleImport}
            disabled={parsedSheets.length === 0 || isLoading}
            type="button"
          >
            Import data
          </button>
        </div>
      </div>
    </div>
  );
}
