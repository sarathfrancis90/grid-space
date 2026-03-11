/**
 * Fill operations — Fill Down, Fill Right, Fill Up, Fill Left, Fill Series.
 * Used by Edit > Fill submenu and keyboard shortcuts (Ctrl+D, Ctrl+R).
 */
import type { CellData, CellFormat } from "../types/grid";
import { useCellStore } from "../stores/cellStore";
import { useUIStore } from "../stores/uiStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import { useHistoryStore } from "../stores/historyStore";

export type FillDirection = "down" | "right" | "up" | "left";

export interface FillSeriesOptions {
  type: "linear" | "growth" | "date";
  stepValue: number;
  stopValue: number | null;
}

/** Get the normalized selection bounds */
function getSelectionBounds(): {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
  sheetId: string;
} | null {
  const ui = useUIStore.getState();
  if (ui.selections.length === 0) return null;
  const sel = ui.selections[ui.selections.length - 1];
  const sheetId = useSpreadsheetStore.getState().activeSheetId;
  return {
    minRow: Math.min(sel.start.row, sel.end.row),
    maxRow: Math.max(sel.start.row, sel.end.row),
    minCol: Math.min(sel.start.col, sel.end.col),
    maxCol: Math.max(sel.start.col, sel.end.col),
    sheetId,
  };
}

/** Deep-clone a CellData value for filling */
function cloneCellData(cell: CellData): CellData {
  const clone: CellData = { value: cell.value };
  if (cell.formula !== undefined) clone.formula = cell.formula;
  if (cell.format) clone.format = { ...cell.format } as CellFormat;
  return clone;
}

/**
 * Fill Down — copies the first row of the selection into all rows below it.
 */
export function fillDown(): void {
  const bounds = getSelectionBounds();
  if (!bounds || bounds.minRow === bounds.maxRow) return;

  const { minRow, maxRow, minCol, maxCol, sheetId } = bounds;
  const cs = useCellStore.getState();
  useHistoryStore.getState().pushUndo();

  const updates: Array<{ row: number; col: number; data: CellData }> = [];
  for (let col = minCol; col <= maxCol; col++) {
    const sourceCell = cs.getCell(sheetId, minRow, col);
    const fillData: CellData = sourceCell
      ? cloneCellData(sourceCell)
      : { value: null };
    for (let row = minRow + 1; row <= maxRow; row++) {
      updates.push({ row, col, data: cloneCellData(fillData) });
    }
  }
  cs.setCellBatch(sheetId, updates);
}

/**
 * Fill Right — copies the first column of the selection into all columns to the right.
 */
export function fillRight(): void {
  const bounds = getSelectionBounds();
  if (!bounds || bounds.minCol === bounds.maxCol) return;

  const { minRow, maxRow, minCol, maxCol, sheetId } = bounds;
  const cs = useCellStore.getState();
  useHistoryStore.getState().pushUndo();

  const updates: Array<{ row: number; col: number; data: CellData }> = [];
  for (let row = minRow; row <= maxRow; row++) {
    const sourceCell = cs.getCell(sheetId, row, minCol);
    const fillData: CellData = sourceCell
      ? cloneCellData(sourceCell)
      : { value: null };
    for (let col = minCol + 1; col <= maxCol; col++) {
      updates.push({ row, col, data: cloneCellData(fillData) });
    }
  }
  cs.setCellBatch(sheetId, updates);
}

/**
 * Fill Up — copies the last row of the selection into all rows above it.
 */
export function fillUp(): void {
  const bounds = getSelectionBounds();
  if (!bounds || bounds.minRow === bounds.maxRow) return;

  const { minRow, maxRow, minCol, maxCol, sheetId } = bounds;
  const cs = useCellStore.getState();
  useHistoryStore.getState().pushUndo();

  const updates: Array<{ row: number; col: number; data: CellData }> = [];
  for (let col = minCol; col <= maxCol; col++) {
    const sourceCell = cs.getCell(sheetId, maxRow, col);
    const fillData: CellData = sourceCell
      ? cloneCellData(sourceCell)
      : { value: null };
    for (let row = minRow; row < maxRow; row++) {
      updates.push({ row, col, data: cloneCellData(fillData) });
    }
  }
  cs.setCellBatch(sheetId, updates);
}

/**
 * Fill Left — copies the last column of the selection into all columns to the left.
 */
export function fillLeft(): void {
  const bounds = getSelectionBounds();
  if (!bounds || bounds.minCol === bounds.maxCol) return;

  const { minRow, maxRow, minCol, maxCol, sheetId } = bounds;
  const cs = useCellStore.getState();
  useHistoryStore.getState().pushUndo();

  const updates: Array<{ row: number; col: number; data: CellData }> = [];
  for (let row = minRow; row <= maxRow; row++) {
    const sourceCell = cs.getCell(sheetId, row, maxCol);
    const fillData: CellData = sourceCell
      ? cloneCellData(sourceCell)
      : { value: null };
    for (let col = minCol; col < maxCol; col++) {
      updates.push({ row, col, data: cloneCellData(fillData) });
    }
  }
  cs.setCellBatch(sheetId, updates);
}

/**
 * Fill Series — generates a linear or growth series starting from the first cell.
 * Direction is always down within the selection.
 */
export function fillSeries(options: FillSeriesOptions): void {
  const bounds = getSelectionBounds();
  if (!bounds) return;

  const { minRow, maxRow, minCol, maxCol, sheetId } = bounds;
  const cs = useCellStore.getState();
  useHistoryStore.getState().pushUndo();

  const updates: Array<{ row: number; col: number; data: CellData }> = [];

  for (let col = minCol; col <= maxCol; col++) {
    const sourceCell = cs.getCell(sheetId, minRow, col);
    const startValue =
      sourceCell && typeof sourceCell.value === "number" ? sourceCell.value : 0;
    const format = sourceCell?.format ? { ...sourceCell.format } : undefined;

    for (let row = minRow; row <= maxRow; row++) {
      const step = row - minRow;
      let value: number;

      if (options.type === "growth") {
        value = startValue * Math.pow(options.stepValue, step);
      } else {
        // linear or date (date treated as linear with step in days)
        value = startValue + options.stepValue * step;
      }

      if (options.stopValue !== null && value > options.stopValue) {
        break;
      }

      const cellData: CellData = { value };
      if (format) cellData.format = { ...format };
      updates.push({ row, col, data: cellData });
    }
  }

  cs.setCellBatch(sheetId, updates);
}

/** Perform a fill operation by direction */
export function performFill(direction: FillDirection): void {
  switch (direction) {
    case "down":
      fillDown();
      break;
    case "right":
      fillRight();
      break;
    case "up":
      fillUp();
      break;
    case "left":
      fillLeft();
      break;
  }
}
