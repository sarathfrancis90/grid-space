import { useMemo } from "react";
import { useCellStore } from "../stores/cellStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import { colToLetter } from "../utils/coordinates";

export interface SheetRow {
  row: number;
  values: (string | number | boolean | null)[];
}

export interface SheetDataResult {
  headers: string[];
  rows: SheetRow[];
  lastRow: number;
  lastCol: number;
}

export function useSheetData(): SheetDataResult {
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const cells = useCellStore((s) => s.cells);
  const getCell = useCellStore((s) => s.getCell);
  const getLastDataPosition = useCellStore((s) => s.getLastDataPosition);

  return useMemo(() => {
    const { row: lastRow, col: lastCol } = getLastDataPosition(sheetId);

    const headers: string[] = [];
    for (let c = 0; c <= lastCol; c++) {
      const cell = getCell(sheetId, 0, c);
      headers.push(
        cell?.value != null ? String(cell.value) : `Column ${colToLetter(c)}`,
      );
    }

    const rows: SheetRow[] = [];
    for (let r = 1; r <= lastRow; r++) {
      const values: (string | number | boolean | null)[] = [];
      for (let c = 0; c <= lastCol; c++) {
        const cell = getCell(sheetId, r, c);
        values.push(cell?.value ?? null);
      }
      rows.push({ row: r, values });
    }

    return { headers, rows, lastRow, lastCol };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetId, cells, getCell, getLastDataPosition]);
}
