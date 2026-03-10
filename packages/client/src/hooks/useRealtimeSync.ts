import { useEffect, useRef } from "react";
import { useUIStore } from "../stores/uiStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import { useCellStore } from "../stores/cellStore";
import { useFormulaStore } from "../stores/formulaStore";
import {
  emitCursorMove,
  emitCellEditStart,
  emitCellEditEnd,
  emitTypingStart,
  emitTypingEnd,
  onRemoteCellUpdate,
} from "../services/realtimeService";
import { positionToCellRef, cellRefToPosition } from "../utils/coordinates";
import { cellId, parseCellId } from "../components/formula/cellUtils";
import type { CellValueGetter } from "../types/formula";

/**
 * Bridges local UI state with the WebSocket real-time layer.
 *
 * - Emits cursor moves when selectedCell changes
 * - Emits cell-edit-start / cell-edit-end when editing begins / ends
 * - Emits typing indicators while user is editing
 * - Applies remote cell updates from other collaborators to the local cell store
 */
export function useRealtimeSync(spreadsheetId: string | undefined): void {
  const prevCellRef = useRef<string | null>(null);
  const prevEditingRef = useRef(false);
  const prevEditingCellRef = useRef<string | null>(null);

  useEffect(() => {
    if (!spreadsheetId) return;

    const unsubUI = useUIStore.subscribe((state) => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;

      // --- Cursor move ---
      const cell = state.selectedCell;
      if (cell) {
        const ref = positionToCellRef(cell);
        if (ref !== prevCellRef.current) {
          prevCellRef.current = ref;

          let range: string | null = null;
          if (state.selections.length > 0) {
            const sel = state.selections[state.selections.length - 1];
            if (
              sel.start.row !== sel.end.row ||
              sel.start.col !== sel.end.col
            ) {
              range = `${positionToCellRef(sel.start)}:${positionToCellRef(sel.end)}`;
            }
          }
          emitCursorMove(spreadsheetId, sheetId, ref, range);
        }
      }

      // --- Editing start / end ---
      if (state.isEditing && !prevEditingRef.current && state.editingCell) {
        const ref = positionToCellRef(state.editingCell);
        prevEditingCellRef.current = ref;
        emitCellEditStart(spreadsheetId, sheetId, ref);
        emitTypingStart(spreadsheetId, sheetId, ref);
      } else if (
        !state.isEditing &&
        prevEditingRef.current &&
        prevEditingCellRef.current
      ) {
        emitCellEditEnd(spreadsheetId, sheetId, prevEditingCellRef.current);
        emitTypingEnd(spreadsheetId, sheetId, prevEditingCellRef.current);
        prevEditingCellRef.current = null;
      }
      prevEditingRef.current = state.isEditing;
    });

    // --- Remote cell updates ---
    const unsubRemote = onRemoteCellUpdate((data) => {
      const { sheetId, cell: cellRef, value, formula } = data;
      const pos = cellRefToPosition(cellRef);
      const cs = useCellStore.getState();
      const existing = cs.getCell(sheetId, pos.row, pos.col);

      cs.setCell(sheetId, pos.row, pos.col, {
        ...existing,
        value,
        formula,
      });

      // Recalculate dependents
      const key = cellId(undefined, pos.col, pos.row);
      const formulaState = useFormulaStore.getState();
      const activeSheetId = useSpreadsheetStore.getState().activeSheetId;

      const getCellValue: CellValueGetter = (sheet, refCol, refRow) => {
        const sid = sheet ?? activeSheetId;
        const c = useCellStore.getState().getCell(sid, refRow, refCol);
        if (!c) return null;
        if (typeof c.value === "number" || typeof c.value === "boolean")
          return c.value;
        if (c.value === null || c.value === "") return null;
        const num = Number(c.value);
        if (!isNaN(num)) return num;
        return c.value;
      };

      const getFormula = (cellKey: string) => {
        try {
          const parsed = parseCellId(cellKey);
          const sid = parsed.sheet ?? activeSheetId;
          return useCellStore.getState().getCell(sid, parsed.row, parsed.col)
            ?.formula;
        } catch {
          return undefined;
        }
      };

      const updates = formulaState.recalculate(key, getFormula, getCellValue);
      for (const [depKey, depValue] of updates) {
        try {
          const parsed = parseCellId(depKey);
          const sid = parsed.sheet ?? activeSheetId;
          const depCell = useCellStore
            .getState()
            .getCell(sid, parsed.row, parsed.col);
          useCellStore.getState().setCell(sid, parsed.row, parsed.col, {
            ...depCell,
            value: depValue,
          });
        } catch {
          // skip invalid cell keys
        }
      }
    });

    return () => {
      unsubUI();
      unsubRemote();
    };
  }, [spreadsheetId]);
}
