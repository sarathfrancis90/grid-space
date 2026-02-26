/**
 * Utility functions for cell reference parsing and conversion.
 * Pure functions — no DOM, no React.
 */

/**
 * Convert a column letter (A, B, ..., Z, AA, AB, ...) to a 0-based index.
 */
export function colLetterToIndex(letters: string): number {
  let result = 0;
  for (let i = 0; i < letters.length; i++) {
    result = result * 26 + (letters.charCodeAt(i) - 64);
  }
  return result - 1; // 0-based
}

/**
 * Convert a 0-based column index to column letters (A, B, ..., Z, AA, ...).
 */
export function colIndexToLetter(index: number): string {
  let result = "";
  let n = index + 1; // 1-based
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

/**
 * Build a cell ID string from sheet, col, row.
 * Format: "Sheet1!A1" or "A1" if no sheet.
 */
export function cellId(
  sheet: string | undefined,
  col: number,
  row: number,
): string {
  const ref = `${colIndexToLetter(col)}${row + 1}`;
  return sheet ? `${sheet}!${ref}` : ref;
}

/**
 * Parse a cell ID string like "A1" or "Sheet1!A1" into components.
 */
export function parseCellId(id: string): {
  sheet?: string;
  col: number;
  row: number;
} {
  const bangIndex = id.indexOf("!");
  const sheet = bangIndex >= 0 ? id.substring(0, bangIndex) : undefined;
  const ref = bangIndex >= 0 ? id.substring(bangIndex + 1) : id;
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid cell reference: ${id}`);
  }
  return {
    sheet,
    col: colLetterToIndex(match[1]),
    row: parseInt(match[2], 10) - 1,
  };
}
