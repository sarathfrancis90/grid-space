import { useEffect, useRef, useCallback } from "react";
import { useCellStore } from "../stores/cellStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import { useCloudStore } from "../stores/cloudStore";
import { useAuthStore } from "../stores/authStore";

const AUTO_SAVE_DELAY_MS = 2000;

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
  const previousCellsRef = useRef<string>("");
  const isFirstRenderRef = useRef(true);

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

    saveSheetData(spreadsheetId, activeSheetId, cellData);
  }, [
    spreadsheetId,
    activeSheetId,
    isAuthenticated,
    currentSpreadsheet,
    cells,
    saveSheetData,
  ]);

  useEffect(() => {
    // Skip the very first render (initial hydration)
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      // Capture initial state fingerprint
      const sheetCells = cells.get(activeSheetId);
      previousCellsRef.current = sheetCells ? String(sheetCells.size) : "";
      return;
    }

    if (!spreadsheetId || !isAuthenticated || !currentSpreadsheet) return;

    // Simple change detection: check if cells Map reference or size changed
    const sheetCells = cells.get(activeSheetId);
    const currentFingerprint = sheetCells ? String(sheetCells.size) : "";

    // Only save when we detect actual changes
    if (
      currentFingerprint === previousCellsRef.current &&
      sheetCells?.size === 0
    ) {
      return;
    }

    previousCellsRef.current = currentFingerprint;

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
      // Trigger a final save on unmount
      doSave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
