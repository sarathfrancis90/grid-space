import { useEffect, useRef, useCallback } from "react";
import { useCellStore } from "../stores/cellStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import { useGridStore } from "../stores/gridStore";
import { useCloudStore } from "../stores/cloudStore";
import { useAuthStore } from "../stores/authStore";
import type { CellData } from "../types/grid";

const AUTO_SAVE_DELAY_MS = 2000;

/** Produce a content-based fingerprint of the cells map */
function cellFingerprint(
  sheetCells: Map<string, CellData> | undefined,
): string {
  if (!sheetCells || sheetCells.size === 0) return "";
  const entries: string[] = [];
  for (const [key, cell] of sheetCells) {
    entries.push(
      `${key}:${JSON.stringify(cell.value ?? "")}:${cell.formula ?? ""}`,
    );
  }
  return entries.join("|");
}

/**
 * Auto-save hook: monitors cell changes and debounces saves to the backend.
 * Should be used once in the SpreadsheetEditorPage.
 */
export function useAutoSave(spreadsheetId: string | undefined): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const cells = useCellStore((s) => s.cells);
  const activeSheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const saveSheetData = useCloudStore((s) => s.saveSheetData);
  const currentSpreadsheet = useCloudStore((s) => s.currentSpreadsheet);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousFingerprintRef = useRef<string>("");
  const isFirstRenderRef = useRef(true);
  const doSaveRef = useRef<() => void>(() => {});

  const doSave = useCallback(() => {
    if (!spreadsheetId || !activeSheetId || !isAuthenticated) return;
    if (!currentSpreadsheet) return;

    const sheetCells = cells.get(activeSheetId);
    if (!sheetCells) return;

    // Convert Map to plain object for JSON serialization
    const cellData: Record<string, unknown> = {};
    for (const [key, value] of sheetCells) {
      cellData[key] = value;
    }

    // Include column widths and row heights as metadata
    const gridState = useGridStore.getState();
    const columnMeta: Record<string, unknown> = {};
    for (const [col, width] of gridState.columnWidths) {
      columnMeta[String(col)] = { width };
    }
    const rowMeta: Record<string, unknown> = {};
    for (const [row, height] of gridState.rowHeights) {
      rowMeta[String(row)] = { height };
    }

    saveSheetData(spreadsheetId, activeSheetId, cellData, columnMeta, rowMeta);
  }, [
    spreadsheetId,
    activeSheetId,
    isAuthenticated,
    currentSpreadsheet,
    cells,
    saveSheetData,
  ]);

  // Keep ref in sync so the unmount effect always calls the latest version
  doSaveRef.current = doSave;

  useEffect(() => {
    // Skip the very first render (initial hydration)
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      const sheetCells = cells.get(activeSheetId);
      previousFingerprintRef.current = cellFingerprint(sheetCells);
      return;
    }

    if (!spreadsheetId || !isAuthenticated || !currentSpreadsheet) return;

    // Content-based change detection
    const sheetCells = cells.get(activeSheetId);
    const currentFP = cellFingerprint(sheetCells);

    if (currentFP === previousFingerprintRef.current) {
      return;
    }

    previousFingerprintRef.current = currentFP;

    // Debounce the save
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      doSave();
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [
    cells,
    activeSheetId,
    spreadsheetId,
    isAuthenticated,
    currentSpreadsheet,
    doSave,
  ]);

  // Save on unmount (navigating away)
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      // Use ref to get the latest doSave, avoiding stale closure
      doSaveRef.current();
    };
  }, []);
}
