/**
 * StatusBar — SUM/AVG/COUNT/MIN/MAX of current selection.
 * S7-016 to S7-017
 */
import { useMemo } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { getCellKey } from "../../utils/coordinates";

export function StatusBar() {
  const selections = useUIStore((s) => s.selections);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const sheetCells = useCellStore((s) => s.cells.get(sheetId));

  const stats = useMemo(() => {
    if (selections.length === 0) {
      return { sum: 0, avg: 0, count: 0, min: 0, max: 0, numCount: 0 };
    }

    const sel = selections[selections.length - 1];
    const minRow = Math.min(sel.start.row, sel.end.row);
    const maxRow = Math.max(sel.start.row, sel.end.row);
    const minCol = Math.min(sel.start.col, sel.end.col);
    const maxCol = Math.max(sel.start.col, sel.end.col);
    if (!sheetCells) {
      return { sum: 0, avg: 0, count: 0, min: 0, max: 0, numCount: 0 };
    }

    let sum = 0;
    let count = 0;
    let numCount = 0;
    let min = Infinity;
    let max = -Infinity;

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const cell = sheetCells.get(getCellKey(r, c));
        if (!cell || cell.value == null || cell.value === "") continue;
        count++;
        const num = Number(cell.value);
        if (!isNaN(num)) {
          sum += num;
          numCount++;
          if (num < min) min = num;
          if (num > max) max = num;
        }
      }
    }

    return {
      sum,
      avg: numCount > 0 ? sum / numCount : 0,
      count,
      min: numCount > 0 ? min : 0,
      max: numCount > 0 ? max : 0,
      numCount,
    };
  }, [selections, sheetId, sheetCells]);

  const isSingleCell =
    selections.length > 0 &&
    selections[0].start.row === selections[0].end.row &&
    selections[0].start.col === selections[0].end.col;

  if (isSingleCell || stats.count === 0) {
    return (
      <div
        data-testid="status-bar"
        className="flex items-center px-4 text-xs text-gray-500"
        style={{ padding: "0 16px", fontSize: "12px" }}
      >
        <span>Ready</span>
      </div>
    );
  }

  const fmt = (n: number) => {
    if (Number.isInteger(n)) return n.toString();
    return n.toFixed(2);
  };

  return (
    <div
      data-testid="status-bar"
      className="flex items-center px-4 text-xs text-gray-600 gap-5"
      style={{ padding: "0 16px", gap: "20px", fontSize: "12px" }}
    >
      <span
        data-testid="status-sum"
        className="font-medium"
        style={{ fontWeight: 500 }}
      >
        SUM: {fmt(stats.sum)}
      </span>
      <span data-testid="status-average">AVG: {fmt(stats.avg)}</span>
      <span data-testid="status-count">COUNT: {stats.count}</span>
      <span data-testid="status-min">MIN: {fmt(stats.min)}</span>
      <span data-testid="status-max">MAX: {fmt(stats.max)}</span>
    </div>
  );
}
