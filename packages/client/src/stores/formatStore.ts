/**
 * Format store — manages cell formatting state and operations.
 * Works with cellStore to apply format properties to cells.
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { CellFormat } from "../types/grid";
import { useCellStore } from "./cellStore";
import { useUIStore } from "./uiStore";
import { useSpreadsheetStore } from "./spreadsheetStore";
import { getCellKey } from "../utils/coordinates";

interface FormatState {
  /** Apply a partial format to a single cell */
  setFormat: (
    sheetId: string,
    row: number,
    col: number,
    format: Partial<CellFormat>,
  ) => void;
  /** Get the format of a single cell */
  getFormat: (
    sheetId: string,
    row: number,
    col: number,
  ) => CellFormat | undefined;
  /** Apply a partial format to all cells in a range */
  setFormatForRange: (
    sheetId: string,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
    format: Partial<CellFormat>,
  ) => void;
  /** Toggle a boolean format property on the current selection */
  toggleFormatOnSelection: (
    prop: "bold" | "italic" | "underline" | "strikethrough",
  ) => void;
  /** Set a format property on the current selection */
  setFormatOnSelection: (format: Partial<CellFormat>) => void;
}

export const useFormatStore = create<FormatState>()(
  immer((_set, _get) => ({
    setFormat: (
      sheetId: string,
      row: number,
      col: number,
      format: Partial<CellFormat>,
    ) => {
      const cellStore = useCellStore.getState();
      const key = getCellKey(row, col);
      const sheetCells = cellStore.cells.get(sheetId);
      const existing = sheetCells?.get(key);
      const currentFormat = existing?.format ?? {};
      const merged = { ...currentFormat, ...format };

      cellStore.setCell(sheetId, row, col, {
        value: existing?.value ?? null,
        formula: existing?.formula,
        format: merged,
        comment: existing?.comment,
      });
    },

    getFormat: (
      sheetId: string,
      row: number,
      col: number,
    ): CellFormat | undefined => {
      const cellStore = useCellStore.getState();
      return cellStore.getCell(sheetId, row, col)?.format;
    },

    setFormatForRange: (
      sheetId: string,
      startRow: number,
      startCol: number,
      endRow: number,
      endCol: number,
      format: Partial<CellFormat>,
    ) => {
      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      const minCol = Math.min(startCol, endCol);
      const maxCol = Math.max(startCol, endCol);

      const cellStore = useCellStore.getState();
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          const key = getCellKey(r, c);
          const sheetCells = cellStore.cells.get(sheetId);
          const existing = sheetCells?.get(key);
          const currentFormat = existing?.format ?? {};
          const merged = { ...currentFormat, ...format };

          cellStore.setCell(sheetId, r, c, {
            value: existing?.value ?? null,
            formula: existing?.formula,
            format: merged,
            comment: existing?.comment,
          });
        }
      }
    },

    toggleFormatOnSelection: (
      prop: "bold" | "italic" | "underline" | "strikethrough",
    ) => {
      const ui = useUIStore.getState();
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      if (!sheetId || ui.selections.length === 0) return;

      const sel = ui.selections[ui.selections.length - 1];
      const minRow = Math.min(sel.start.row, sel.end.row);
      const maxRow = Math.max(sel.start.row, sel.end.row);
      const minCol = Math.min(sel.start.col, sel.end.col);
      const maxCol = Math.max(sel.start.col, sel.end.col);

      // Check current value of first cell to determine toggle direction
      const cellStore = useCellStore.getState();
      const firstCell = cellStore.getCell(sheetId, minRow, minCol);
      const currentValue = firstCell?.format?.[prop] ?? false;
      const newValue = !currentValue;

      const formatStore = useFormatStore.getState();
      formatStore.setFormatForRange(sheetId, minRow, minCol, maxRow, maxCol, {
        [prop]: newValue,
      });
    },

    setFormatOnSelection: (format: Partial<CellFormat>) => {
      const ui = useUIStore.getState();
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      if (!sheetId || ui.selections.length === 0) return;

      const sel = ui.selections[ui.selections.length - 1];
      const formatStore = useFormatStore.getState();
      formatStore.setFormatForRange(
        sheetId,
        sel.start.row,
        sel.start.col,
        sel.end.row,
        sel.end.col,
        format,
      );
    },
  })),
);
