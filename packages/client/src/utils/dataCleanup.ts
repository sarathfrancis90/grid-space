import type { CellData } from "../types/grid";
import { getCellKey } from "./coordinates";

/**
 * Split text in a column by delimiter into multiple columns.
 * Returns new cells to set.
 */
export function splitTextToColumns(
  cells: Map<string, CellData>,
  sheetId: string,
  col: number,
  startRow: number,
  endRow: number,
  delimiter: string,
): { row: number; col: number; data: CellData }[] {
  const results: { row: number; col: number; data: CellData }[] = [];
  void sheetId;

  for (let r = startRow; r <= endRow; r++) {
    const cell = cells.get(getCellKey(r, col));
    if (!cell || cell.value == null) continue;

    const parts = String(cell.value).split(delimiter);
    for (let i = 0; i < parts.length; i++) {
      results.push({
        row: r,
        col: col + i,
        data: { value: parts[i].trim() },
      });
    }
  }

  return results;
}

/**
 * Find duplicate rows based on specified columns.
 * Returns set of row indices that are duplicates (keeps first occurrence).
 */
export function findDuplicateRows(
  cells: Map<string, CellData>,
  startRow: number,
  endRow: number,
  cols: number[],
): Set<number> {
  const seen = new Set<string>();
  const duplicates = new Set<number>();

  for (let r = startRow; r <= endRow; r++) {
    const key = cols
      .map((c) => {
        const cell = cells.get(getCellKey(r, c));
        return cell?.value != null ? String(cell.value) : "";
      })
      .join("|||");

    if (seen.has(key)) {
      duplicates.add(r);
    } else {
      seen.add(key);
    }
  }

  return duplicates;
}

/**
 * Remove duplicate rows from cell data. Returns new cells without duplicates.
 */
export function removeDuplicateRows(
  cells: Map<string, CellData>,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
  keyCols: number[],
): { newCells: Map<string, CellData>; removedCount: number } {
  const duplicates = findDuplicateRows(cells, startRow, endRow, keyCols);
  const newCells = new Map<string, CellData>();

  // Copy non-duplicate rows, shifting up
  let writeRow = startRow;
  for (let r = startRow; r <= endRow; r++) {
    if (duplicates.has(r)) continue;
    for (let c = startCol; c <= endCol; c++) {
      const cell = cells.get(getCellKey(r, c));
      if (cell) {
        newCells.set(getCellKey(writeRow, c), cell);
      }
    }
    writeRow++;
  }

  return { newCells, removedCount: duplicates.size };
}

/**
 * Trim whitespace from all cells in range.
 * Returns cells that were modified.
 */
export function trimWhitespace(
  cells: Map<string, CellData>,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
): { row: number; col: number; data: CellData }[] {
  const results: { row: number; col: number; data: CellData }[] = [];

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = cells.get(getCellKey(r, c));
      if (!cell || cell.value == null || typeof cell.value !== "string")
        continue;

      const trimmed = cell.value.trim().replace(/\s+/g, " ");
      if (trimmed !== cell.value) {
        results.push({
          row: r,
          col: c,
          data: { ...cell, value: trimmed },
        });
      }
    }
  }

  return results;
}
