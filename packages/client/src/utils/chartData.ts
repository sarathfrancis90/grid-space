/**
 * Utility to extract chart data from cell ranges.
 */
import type { SelectionRange, CellData } from "../types/grid";
import { getCellKey } from "./coordinates";

export interface ChartDataset {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
  }[];
}

const DEFAULT_COLORS = [
  "#4285f4",
  "#ea4335",
  "#fbbc04",
  "#34a853",
  "#ff6d01",
  "#46bdc6",
  "#7baaf7",
  "#f07b72",
  "#fcd04f",
  "#71c287",
];

export function extractChartData(
  range: SelectionRange,
  getCellValue: (row: number, col: number) => CellData | undefined,
): ChartDataset {
  const minRow = Math.min(range.start.row, range.end.row);
  const maxRow = Math.max(range.start.row, range.end.row);
  const minCol = Math.min(range.start.col, range.end.col);
  const maxCol = Math.max(range.start.col, range.end.col);

  const numRows = maxRow - minRow + 1;
  const numCols = maxCol - minCol + 1;

  // Try to detect if first row is headers
  const firstRowValues: string[] = [];
  let firstRowAllText = true;
  for (let c = minCol; c <= maxCol; c++) {
    const cell = getCellValue(minRow, c);
    const val = cell?.value ?? "";
    firstRowValues.push(String(val));
    if (typeof cell?.value === "number") {
      firstRowAllText = false;
    }
  }

  // Try to detect if first column is labels
  const firstColValues: string[] = [];
  let firstColAllText = true;
  for (let r = minRow; r <= maxRow; r++) {
    const cell = getCellValue(r, minCol);
    const val = cell?.value ?? "";
    firstColValues.push(String(val));
    if (typeof cell?.value === "number") {
      firstColAllText = false;
    }
  }

  const hasHeaders = firstRowAllText && numRows > 1;
  const hasLabels = firstColAllText && numCols > 1;

  const dataStartRow = hasHeaders ? minRow + 1 : minRow;
  const dataStartCol = hasLabels ? minCol + 1 : minCol;

  // Extract labels (from first column or generate)
  const labels: string[] = [];
  for (let r = dataStartRow; r <= maxRow; r++) {
    if (hasLabels) {
      const cell = getCellValue(r, minCol);
      labels.push(String(cell?.value ?? `Row ${r - dataStartRow + 1}`));
    } else {
      labels.push(`Row ${r - dataStartRow + 1}`);
    }
  }

  // Extract datasets (one per data column)
  const datasets: ChartDataset["datasets"] = [];
  for (let c = dataStartCol; c <= maxCol; c++) {
    const label = hasHeaders
      ? firstRowValues[c - minCol]
      : `Series ${c - dataStartCol + 1}`;
    const data: number[] = [];
    for (let r = dataStartRow; r <= maxRow; r++) {
      const cell = getCellValue(r, c);
      const numVal = Number(cell?.value);
      data.push(isNaN(numVal) ? 0 : numVal);
    }
    const colorIdx = (c - dataStartCol) % DEFAULT_COLORS.length;
    datasets.push({
      label,
      data,
      backgroundColor: DEFAULT_COLORS.map(
        (_, i) => DEFAULT_COLORS[(colorIdx + i) % DEFAULT_COLORS.length],
      ),
      borderColor: DEFAULT_COLORS[colorIdx],
    });
  }

  return { labels, datasets };
}

export { DEFAULT_COLORS, getCellKey };
