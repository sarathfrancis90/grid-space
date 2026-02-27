/**
 * RemoveDuplicatesDialog — detect and remove duplicate rows based on selected columns.
 */
import { useState, useMemo } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useCellStore } from "../../stores/cellStore";
import { useHistoryStore } from "../../stores/historyStore";
import { colToLetter } from "../../utils/coordinates";

export function RemoveDuplicatesDialog() {
  const isOpen = useUIStore((s) => s.isRemoveDuplicatesDialogOpen);
  const close = useUIStore((s) => s.setRemoveDuplicatesDialogOpen);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const selections = useUIStore((s) => s.selections);

  // Determine data range from selection
  const range = useMemo(() => {
    if (selections.length === 0) return null;
    const sel = selections[selections.length - 1];
    return {
      startRow: Math.min(sel.start.row, sel.end.row),
      startCol: Math.min(sel.start.col, sel.end.col),
      endRow: Math.max(sel.start.row, sel.end.row),
      endCol: Math.max(sel.start.col, sel.end.col),
    };
  }, [selections]);

  const columnCount = range ? range.endCol - range.startCol + 1 : 0;

  const [selectedCols, setSelectedCols] = useState<Set<number>>(() => {
    const s = new Set<number>();
    for (let i = 0; i < columnCount; i++) s.add(i);
    return s;
  });

  // Count duplicates for preview
  const duplicateCount = useMemo(() => {
    if (!sheetId || !range) return 0;
    const cellStore = useCellStore.getState();
    const seen = new Set<string>();
    let dupes = 0;
    for (let r = range.startRow; r <= range.endRow; r++) {
      const key = Array.from(selectedCols)
        .sort()
        .map((ci) => {
          const cell = cellStore.getCell(sheetId, r, range.startCol + ci);
          return String(cell?.value ?? "");
        })
        .join("\0");
      if (seen.has(key)) {
        dupes++;
      } else {
        seen.add(key);
      }
    }
    return dupes;
  }, [sheetId, range, selectedCols]);

  if (!isOpen) return null;

  const toggleCol = (colIdx: number) => {
    setSelectedCols((prev) => {
      const next = new Set(prev);
      if (next.has(colIdx)) next.delete(colIdx);
      else next.add(colIdx);
      return next;
    });
  };

  const handleRemove = () => {
    if (!sheetId || !range) return;
    useHistoryStore.getState().pushUndo();

    const cellStore = useCellStore.getState();
    const seen = new Set<string>();
    const rowsToDelete: number[] = [];

    for (let r = range.startRow; r <= range.endRow; r++) {
      const key = Array.from(selectedCols)
        .sort()
        .map((ci) => {
          const cell = cellStore.getCell(sheetId, r, range.startCol + ci);
          return String(cell?.value ?? "");
        })
        .join("\0");
      if (seen.has(key)) {
        rowsToDelete.push(r);
      } else {
        seen.add(key);
      }
    }

    // Delete duplicate rows from bottom to top so indices don't shift
    for (let i = rowsToDelete.length - 1; i >= 0; i--) {
      const row = rowsToDelete[i];
      // Clear the row cells
      for (let c = range.startCol; c <= range.endCol; c++) {
        cellStore.deleteCell(sheetId, row, c);
      }
    }

    // Shift remaining rows up
    if (rowsToDelete.length > 0) {
      const totalRows = range.endRow - range.startRow + 1;
      void totalRows;
      // Re-pack rows within the range
      const allRows: number[] = [];
      for (let r = range.startRow; r <= range.endRow; r++) {
        if (!rowsToDelete.includes(r)) allRows.push(r);
      }
      // Write back in order
      for (let i = 0; i < allRows.length; i++) {
        const srcRow = allRows[i];
        const destRow = range.startRow + i;
        if (srcRow !== destRow) {
          for (let c = range.startCol; c <= range.endCol; c++) {
            const cell = cellStore.getCell(sheetId, srcRow, c);
            if (cell) {
              cellStore.setCell(sheetId, destRow, c, cell);
            } else {
              cellStore.deleteCell(sheetId, destRow, c);
            }
          }
        }
      }
      // Clear leftover rows at the end
      for (let r = range.startRow + allRows.length; r <= range.endRow; r++) {
        for (let c = range.startCol; c <= range.endCol; c++) {
          cellStore.deleteCell(sheetId, r, c);
        }
      }
    }

    close(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.3)",
      }}
      data-testid="remove-duplicates-overlay"
      onClick={() => close(false)}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-80"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          width: "340px",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
        data-testid="remove-duplicates-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-lg font-semibold mb-4"
          style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}
        >
          Remove Duplicates
        </h2>

        {!range ? (
          <p className="text-sm text-gray-500" style={{ fontSize: "13px" }}>
            Please select a data range first.
          </p>
        ) : (
          <>
            <p
              className="text-sm text-gray-600 mb-3"
              style={{ fontSize: "13px", marginBottom: "12px" }}
            >
              Select columns to compare for duplicates:
            </p>
            <div
              style={{
                maxHeight: "200px",
                overflowY: "auto",
                marginBottom: "12px",
              }}
            >
              {Array.from({ length: columnCount }, (_, i) => (
                <label
                  key={i}
                  className="flex items-center gap-2 py-1 cursor-pointer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "4px 0",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCols.has(i)}
                    onChange={() => toggleCol(i)}
                    data-testid={`dup-col-${i}`}
                  />
                  <span className="text-sm">
                    Column {colToLetter(range.startCol + i)}
                  </span>
                </label>
              ))}
            </div>
            <p
              className="text-sm text-gray-500 mb-4"
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "16px",
              }}
              data-testid="duplicate-count"
            >
              {duplicateCount} duplicate row{duplicateCount !== 1 ? "s" : ""}{" "}
              found
            </p>
          </>
        )}

        <div
          className="flex justify-end gap-2"
          style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
        >
          <button
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
            }}
            data-testid="remove-duplicates-cancel"
            onClick={() => close(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: "4px",
            }}
            data-testid="remove-duplicates-apply"
            onClick={handleRemove}
            disabled={!range || duplicateCount === 0}
          >
            Remove {duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
