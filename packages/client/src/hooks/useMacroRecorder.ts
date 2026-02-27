/**
 * useMacroRecorder — subscribes to store changes during macro recording
 * and records them as MacroAction items.
 */
import { useEffect } from "react";
import { useMacroStore } from "../stores/macroStore";
import { useCellStore } from "../stores/cellStore";
import { useUIStore } from "../stores/uiStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import type { CellData, CellPosition } from "../types/grid";

export function useMacroRecorder(): void {
  const isRecording = useMacroStore((s) => s.isRecording);

  useEffect(() => {
    if (!isRecording) return;

    // Track cell changes
    const prevCells = new Map<string, Map<string, CellData>>();
    const currentCells = useCellStore.getState().cells;
    for (const [sheetId, sheetCells] of currentCells) {
      prevCells.set(sheetId, new Map(sheetCells));
    }

    const unsubCell = useCellStore.subscribe((state) => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      if (!sheetId) return;

      const currentSheet = state.cells.get(sheetId);
      const prevSheet = prevCells.get(sheetId);

      if (!currentSheet) return;

      // Detect new or changed cells
      for (const [key, data] of currentSheet) {
        const prev = prevSheet?.get(key);
        if (!prev || prev.value !== data.value) {
          const [row, col] = key.split(",").map(Number);
          useMacroStore.getState().recordAction({
            type: "setCellValue",
            row,
            col,
            sheetId,
            value: data.value,
          });
        }
        if (
          prev &&
          data.format &&
          JSON.stringify(prev.format) !== JSON.stringify(data.format)
        ) {
          const [row, col] = key.split(",").map(Number);
          useMacroStore.getState().recordAction({
            type: "setFormat",
            row,
            col,
            sheetId,
            format: data.format,
          });
        }
      }

      // Update tracking snapshot
      prevCells.set(sheetId, new Map(currentSheet));
    });

    // Track navigation
    let prevSelected: CellPosition | null = useUIStore.getState().selectedCell;

    const unsubUI = useUIStore.subscribe((state) => {
      if (
        state.selectedCell &&
        (state.selectedCell.row !== prevSelected?.row ||
          state.selectedCell.col !== prevSelected?.col)
      ) {
        useMacroStore.getState().recordAction({
          type: "navigate",
          row: state.selectedCell.row,
          col: state.selectedCell.col,
        });
        prevSelected = state.selectedCell;
      }
    });

    return () => {
      unsubCell();
      unsubUI();
    };
  }, [isRecording]);
}
