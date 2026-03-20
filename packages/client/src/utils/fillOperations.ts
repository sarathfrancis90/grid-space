/**
 * Fill operations — Fill Down, Fill Right, Fill Up, Fill Left, Fill Series.
 * Pure utility functions that perform fill logic on cell data.
 */
import { useCellStore } from "../stores/cellStore";
import { useUIStore } from "../stores/uiStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import { useHistoryStore } from "../stores/historyStore";
import type { CellData } from "../types/grid";

interface FillRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

function getSelectionRange(): FillRange | null {
  const ui = useUIStore.getState();
  if (ui.selections.length === 0) return null;
  const sel = ui.selections[ui.selections.length - 1];
  return {
    startRow: Math.min(sel.start.row, sel.end.row),
    startCol: Math.min(sel.start.col, sel.end.col),
    endRow: Math.max(sel.start.row, sel.end.row),
    endCol: Math.max(sel.start.col, sel.end.col),
  };
}

function copyCellData(cell: CellData | undefined): CellData {
  if (!cell) return { value: null };
  return {
    value: cell.value,
    formula: cell.formula,
    format: cell.format ? { ...cell.format } : undefined,
    comment: cell.comment,
    hyperlink: cell.hyperlink,
    note: cell.note,
  };
}

/**
 * Fill Down: Copy the first row of selection into all rows below within the selection.
 */
export function fillDown(): void {
  const range = getSelectionRange();
  if (!range) return;
  if (range.startRow === range.endRow) return; // Need at least 2 rows

  const sid = useSpreadsheetStore.getState().activeSheetId;
  const cellStore = useCellStore.getState();
  useHistoryStore.getState().pushUndo();

  for (let col = range.startCol; col <= range.endCol; col++) {
    const sourceCell = cellStore.getCell(sid, range.startRow, col);
    const data = copyCellData(sourceCell);
    for (let row = range.startRow + 1; row <= range.endRow; row++) {
      cellStore.setCell(sid, row, col, { ...data });
    }
  }
}

/**
 * Fill Right: Copy the first column of selection into all columns to the right.
 */
export function fillRight(): void {
  const range = getSelectionRange();
  if (!range) return;
  if (range.startCol === range.endCol) return;

  const sid = useSpreadsheetStore.getState().activeSheetId;
  const cellStore = useCellStore.getState();
  useHistoryStore.getState().pushUndo();

  for (let row = range.startRow; row <= range.endRow; row++) {
    const sourceCell = cellStore.getCell(sid, row, range.startCol);
    const data = copyCellData(sourceCell);
    for (let col = range.startCol + 1; col <= range.endCol; col++) {
      cellStore.setCell(sid, row, col, { ...data });
    }
  }
}

/**
 * Fill Up: Copy the last row of selection into all rows above.
 */
export function fillUp(): void {
  const range = getSelectionRange();
  if (!range) return;
  if (range.startRow === range.endRow) return;

  const sid = useSpreadsheetStore.getState().activeSheetId;
  const cellStore = useCellStore.getState();
  useHistoryStore.getState().pushUndo();

  for (let col = range.startCol; col <= range.endCol; col++) {
    const sourceCell = cellStore.getCell(sid, range.endRow, col);
    const data = copyCellData(sourceCell);
    for (let row = range.startRow; row < range.endRow; row++) {
      cellStore.setCell(sid, row, col, { ...data });
    }
  }
}

/**
 * Fill Left: Copy the last column of selection into all columns to the left.
 */
export function fillLeft(): void {
  const range = getSelectionRange();
  if (!range) return;
  if (range.startCol === range.endCol) return;

  const sid = useSpreadsheetStore.getState().activeSheetId;
  const cellStore = useCellStore.getState();
  useHistoryStore.getState().pushUndo();

  for (let row = range.startRow; row <= range.endRow; row++) {
    const sourceCell = cellStore.getCell(sid, row, range.endCol);
    const data = copyCellData(sourceCell);
    for (let col = range.startCol; col < range.endCol; col++) {
      cellStore.setCell(sid, row, col, { ...data });
    }
  }
}

export type FillSeriesType = "linear" | "growth" | "date";
export type FillSeriesDateUnit = "day" | "weekday" | "month" | "year";

export interface FillSeriesConfig {
  type: FillSeriesType;
  stepValue: number;
  stopValue?: number;
  dateUnit?: FillSeriesDateUnit;
}

/**
 * Fill Series: Generate a series of values based on config.
 * Uses the selection range; fills from the first cell downward.
 */
export function fillSeries(config: FillSeriesConfig): void {
  const range = getSelectionRange();
  if (!range) return;

  const sid = useSpreadsheetStore.getState().activeSheetId;
  const cellStore = useCellStore.getState();
  const startCell = cellStore.getCell(sid, range.startRow, range.startCol);
  const startValue = Number(startCell?.value ?? 0);

  useHistoryStore.getState().pushUndo();

  const totalCells =
    (range.endRow - range.startRow + 1) * (range.endCol - range.startCol + 1);

  let idx = 0;
  for (let row = range.startRow; row <= range.endRow; row++) {
    for (let col = range.startCol; col <= range.endCol; col++) {
      let newValue: number;
      if (config.type === "linear") {
        newValue = startValue + config.stepValue * idx;
      } else if (config.type === "growth") {
        newValue = startValue * Math.pow(config.stepValue, idx);
      } else {
        // date: treat startValue as a simple number for now
        newValue = startValue + config.stepValue * idx;
      }

      if (config.stopValue !== undefined && newValue > config.stopValue) {
        break;
      }

      cellStore.setCell(sid, row, col, { value: newValue });
      idx++;

      if (idx >= totalCells) break;
    }
  }
}
