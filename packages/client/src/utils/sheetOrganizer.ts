/**
 * Sheet Organizer — contextual suggestions for organizing sheet data.
 *
 * Analyzes a sheet's contents and suggests organizational improvements:
 * - Detect if row 0 looks like headers and suggest bold/freeze
 * - Detect categories that could benefit from sorting/grouping
 * - Suggest adding header row if missing
 */

import type { CellData } from "../types/grid";
import { detectColumnTypes, type ColumnType } from "./dataAnalysis";

export type OrganizeSuggestionType =
  | "add-header-format"
  | "freeze-header"
  | "sort-column"
  | "add-filter";

export interface OrganizeSuggestion {
  type: OrganizeSuggestionType;
  description: string;
  /** Column index if relevant */
  column?: number;
  /** Priority 1=highest */
  priority: number;
}

interface CellGetter {
  (row: number, col: number): CellData | undefined;
}

/**
 * Check if the first row looks like a header row.
 * Heuristics:
 * - All values are text (strings, no numbers)
 * - Values are unique
 * - Values are relatively short (< 50 chars)
 * - Row 1+ has different types (numbers, mixed, etc.)
 */
function isLikelyHeaderRow(
  headerValues: (string | number | boolean | null)[],
  dataValues: (string | number | boolean | null)[][],
): boolean {
  const nonEmpty = headerValues.filter(
    (v) => v !== null && v !== undefined && String(v).trim() !== "",
  );
  if (nonEmpty.length === 0) return false;

  // Headers should be mostly text
  const textCount = nonEmpty.filter(
    (v) => typeof v === "string" && isNaN(Number(v)),
  ).length;
  if (textCount < nonEmpty.length * 0.7) return false;

  // Headers should be unique
  const uniqueSet = new Set(nonEmpty.map(String));
  if (uniqueSet.size < nonEmpty.length * 0.8) return false;

  // Headers should be short
  const allShort = nonEmpty.every((v) => String(v).length < 50);
  if (!allShort) return false;

  // Data rows should have at least some non-text values or different pattern
  if (dataValues.length > 0) {
    const colTypes = detectColumnTypes(dataValues);
    const hasNonText = colTypes.some(
      (t) => t === "number" || t === "date" || t === "boolean" || t === "mixed",
    );
    if (hasNonText) return true;
  }

  return nonEmpty.length >= 2;
}

/**
 * Analyze the sheet and generate organization suggestions.
 *
 * @param getCell - Function to retrieve cell data
 * @param maxRow - Last row with data (0-indexed)
 * @param maxCol - Last column with data (0-indexed)
 * @returns Array of suggestions sorted by priority
 */
export function analyzeSheetOrganization(
  getCell: CellGetter,
  maxRow: number,
  maxCol: number,
): OrganizeSuggestion[] {
  if (maxRow < 1 || maxCol < 0) return [];

  const suggestions: OrganizeSuggestion[] = [];

  // Collect header row values
  const headerRow: (string | number | boolean | null)[] = [];
  for (let c = 0; c <= maxCol; c++) {
    const cell = getCell(0, c);
    headerRow.push(cell?.value ?? null);
  }

  // Collect data rows (rows 1+)
  const dataRows: (string | number | boolean | null)[][] = [];
  const dataEnd = Math.min(maxRow, 100); // Sample up to 100 rows
  for (let r = 1; r <= dataEnd; r++) {
    const row: (string | number | boolean | null)[] = [];
    for (let c = 0; c <= maxCol; c++) {
      const cell = getCell(r, c);
      row.push(cell?.value ?? null);
    }
    dataRows.push(row);
  }

  const hasHeader = isLikelyHeaderRow(headerRow, dataRows);

  if (hasHeader) {
    // Check if header is already bold
    const headerCell = getCell(0, 0);
    if (!headerCell?.format?.bold) {
      suggestions.push({
        type: "add-header-format",
        description: "Format row 1 as a header (bold text, background color)",
        priority: 1,
      });
    }

    suggestions.push({
      type: "freeze-header",
      description: "Freeze the header row so it stays visible when scrolling",
      priority: 2,
    });

    // Suggest filter
    if (dataRows.length >= 5) {
      suggestions.push({
        type: "add-filter",
        description: "Add filter dropdowns to the header row",
        priority: 3,
      });
    }

    // Suggest sorting for specific column types
    if (dataRows.length >= 3) {
      const colTypes = detectColumnTypes(dataRows);
      for (let c = 0; c <= maxCol; c++) {
        const colType: ColumnType | undefined = colTypes[c];
        if (colType === "number" || colType === "date" || colType === "text") {
          const headerName =
            headerRow[c] != null ? String(headerRow[c]) : `Column ${c + 1}`;
          suggestions.push({
            type: "sort-column",
            column: c,
            description: `Sort by "${headerName}" (${colType} column)`,
            priority: 4,
          });
        }
      }
    }
  }

  return suggestions.sort((a, b) => a.priority - b.priority);
}
