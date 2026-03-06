/**
 * Lookup & reference functions: VLOOKUP, HLOOKUP, INDEX, MATCH, XLOOKUP,
 * ROW, COLUMN, ROWS, COLUMNS, CHOOSE, ADDRESS, LOOKUP
 *
 * NOTE: ROW, COLUMN, OFFSET, and INDIRECT are handled specially in the
 * evaluator (evaluator.ts) because they need AST-level access or cell context.
 * The ROW/COLUMN stubs here remain for the registry but delegate to the evaluator.
 */
import type { FormulaValue } from "../../../types/formula";
import type { FormulaFunction, FormulaError } from "./helpers";
import {
  requireNumber,
  is2DArray,
  flattenArgs,
  isFormulaError,
  compareValues,
} from "./helpers";

/** Extract 2D array from an argument (range args arrive as FormulaValue[][]). */
function to2D(val: FormulaValue): FormulaValue[][] | null {
  if (is2DArray(val)) return val as unknown as FormulaValue[][];
  if (Array.isArray(val)) {
    // Flat array → treat as single column
    return (val as FormulaValue[]).map((v) => [v]);
  }
  return null;
}

function fnVLOOKUP(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const searchKey = args[0];
  const range = to2D(args[1]);
  if (!range) return "#VALUE!" as FormulaError;
  const colIndex = requireNumber(args[2]);
  if (isFormulaError(colIndex)) return colIndex;
  const isSorted = args.length > 3 ? args[3] !== false && args[3] !== 0 : true;

  const col = (colIndex as number) - 1; // 0-based
  if (col < 0 || (range[0] && col >= range[0].length))
    return "#REF!" as FormulaError;

  if (isSorted) {
    // Binary search on first column (assumes sorted ascending)
    let bestRow = -1;
    for (let i = 0; i < range.length; i++) {
      const cmp = compareValues(range[i][0], searchKey);
      if (cmp === 0) {
        bestRow = i;
        break;
      }
      if (cmp <= 0) bestRow = i;
      else break;
    }
    if (bestRow === -1) return "#N/A" as FormulaError;
    return range[bestRow][col] ?? null;
  }

  // Exact match
  for (let i = 0; i < range.length; i++) {
    if (compareValues(range[i][0], searchKey) === 0) {
      return range[i][col] ?? null;
    }
  }
  return "#N/A" as FormulaError;
}

function fnHLOOKUP(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const searchKey = args[0];
  const range = to2D(args[1]);
  if (!range) return "#VALUE!" as FormulaError;
  const rowIndex = requireNumber(args[2]);
  if (isFormulaError(rowIndex)) return rowIndex;
  const isSorted = args.length > 3 ? args[3] !== false && args[3] !== 0 : true;

  const row = (rowIndex as number) - 1;
  if (row < 0 || row >= range.length) return "#REF!" as FormulaError;

  const firstRow = range[0] ?? [];
  if (isSorted) {
    let bestCol = -1;
    for (let j = 0; j < firstRow.length; j++) {
      const cmp = compareValues(firstRow[j], searchKey);
      if (cmp === 0) {
        bestCol = j;
        break;
      }
      if (cmp <= 0) bestCol = j;
      else break;
    }
    if (bestCol === -1) return "#N/A" as FormulaError;
    return range[row][bestCol] ?? null;
  }

  for (let j = 0; j < firstRow.length; j++) {
    if (compareValues(firstRow[j], searchKey) === 0) {
      return range[row][j] ?? null;
    }
  }
  return "#N/A" as FormulaError;
}

function fnINDEX(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const range = to2D(args[0]);
  if (!range) return "#VALUE!" as FormulaError;
  const rowNum = requireNumber(args[1]);
  if (isFormulaError(rowNum)) return rowNum;
  const colNum = args.length > 2 ? requireNumber(args[2]) : 1;
  if (isFormulaError(colNum)) return colNum;

  const r = (rowNum as number) - 1;
  const c = (colNum as number) - 1;
  if (r < 0 || r >= range.length) return "#REF!" as FormulaError;
  if (c < 0 || (range[0] && c >= range[0].length))
    return "#REF!" as FormulaError;
  return range[r][c] ?? null;
}

function fnMATCH(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const searchKey = args[0];
  const flat = flattenArgs([args[1]]);
  const matchType = args.length > 2 ? requireNumber(args[2]) : 1;
  if (isFormulaError(matchType)) return matchType;

  if (matchType === 0) {
    // Exact match
    for (let i = 0; i < flat.length; i++) {
      if (compareValues(flat[i], searchKey) === 0) return i + 1;
    }
    return "#N/A" as FormulaError;
  }

  if ((matchType as number) === 1) {
    // Sorted ascending, find largest <= searchKey
    let best = -1;
    for (let i = 0; i < flat.length; i++) {
      if (compareValues(flat[i], searchKey) <= 0) best = i;
      else break;
    }
    return best >= 0 ? best + 1 : ("#N/A" as FormulaError);
  }

  // matchType === -1: sorted descending, find smallest >= searchKey
  let best = -1;
  for (let i = 0; i < flat.length; i++) {
    if (compareValues(flat[i], searchKey) >= 0) best = i;
    else break;
  }
  return best >= 0 ? best + 1 : ("#N/A" as FormulaError);
}

function fnXLOOKUP(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const searchKey = args[0];
  const lookupFlat = flattenArgs([args[1]]);
  const returnFlat = flattenArgs([args[2]]);
  const notFound = args.length > 3 ? args[3] : ("#N/A" as FormulaError);

  for (let i = 0; i < lookupFlat.length; i++) {
    if (compareValues(lookupFlat[i], searchKey) === 0) {
      return i < returnFlat.length ? returnFlat[i] : ("#N/A" as FormulaError);
    }
  }
  return notFound;
}

// ROW/COLUMN are now handled in evaluator.ts with full context.
// These stubs exist only for the function registry.
function fnROW(...args: FormulaValue[]): FormulaValue {
  if (args.length === 0) return 1;
  return "#VALUE!" as FormulaError;
}

function fnCOLUMN(...args: FormulaValue[]): FormulaValue {
  if (args.length === 0) return 1;
  return "#VALUE!" as FormulaError;
}

function fnROWS(...args: FormulaValue[]): FormulaValue {
  const range = to2D(args[0]);
  if (range) return range.length;
  const flat = Array.isArray(args[0]) ? (args[0] as FormulaValue[]) : null;
  if (flat) return flat.length;
  return 1;
}

function fnCOLUMNS(...args: FormulaValue[]): FormulaValue {
  const range = to2D(args[0]);
  if (range && range[0]) return range[0].length;
  return 1;
}

function fnCHOOSE(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const idx = requireNumber(args[0]);
  if (isFormulaError(idx)) return idx;
  const index = idx as number;
  if (index < 1 || index >= args.length) return "#VALUE!" as FormulaError;
  return args[index];
}

/**
 * ADDRESS(row, column, [abs_num], [a1], [sheet])
 * Creates a cell address string from row/column numbers.
 * row: 1-based row number
 * column: 1-based column number
 * abs_num: 1=absolute (default), 2=abs row/rel col, 3=rel row/abs col, 4=relative
 * a1: true for A1 notation (default), false for R1C1
 * sheet: optional sheet name
 */
function fnADDRESS(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const rowNum = requireNumber(args[0]);
  if (isFormulaError(rowNum)) return rowNum;
  const colNum = requireNumber(args[1]);
  if (isFormulaError(colNum)) return colNum;

  const row = rowNum as number;
  const col = colNum as number;
  if (row < 1 || col < 1) return "#VALUE!" as FormulaError;

  const absNum =
    args.length > 2 && args[2] !== null ? requireNumber(args[2]) : 1;
  if (isFormulaError(absNum)) return absNum;
  const abs = absNum as number;
  if (abs < 1 || abs > 4) return "#VALUE!" as FormulaError;

  const a1 =
    args.length > 3 && args[3] !== null
      ? args[3] !== false && args[3] !== 0
      : true;
  const sheet = args.length > 4 && args[4] !== null ? String(args[4]) : null;

  let result: string;
  if (a1) {
    // A1 notation
    const colLetter = colIndexToLetterLocal(col - 1);
    const colPrefix = abs === 1 || abs === 3 ? "$" : "";
    const rowPrefix = abs === 1 || abs === 2 ? "$" : "";
    result = `${colPrefix}${colLetter}${rowPrefix}${row}`;
  } else {
    // R1C1 notation
    const rowPrefix = abs === 1 || abs === 2 ? "" : "[";
    const rowSuffix = abs === 1 || abs === 2 ? "" : "]";
    const colPrefix = abs === 1 || abs === 3 ? "" : "[";
    const colSuffix = abs === 1 || abs === 3 ? "" : "]";
    result = `R${rowPrefix}${row}${rowSuffix}C${colPrefix}${col}${colSuffix}`;
  }

  if (sheet) {
    // Quote sheet name if it contains spaces
    const quotedSheet = sheet.includes(" ") ? `'${sheet}'` : sheet;
    result = `${quotedSheet}!${result}`;
  }

  return result;
}

/** Convert 0-based column index to letter (A, B, ..., Z, AA, ...) */
function colIndexToLetterLocal(index: number): string {
  let result = "";
  let n = index + 1;
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

/**
 * LOOKUP(search_key, search_range, [result_range])
 * Searches for a key in a range and returns the corresponding value.
 * If result_range is omitted, returns from the last column/row of search_range.
 */
function fnLOOKUP(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const searchKey = args[0];
  const searchRange = to2D(args[1]);
  if (!searchRange) return "#VALUE!" as FormulaError;

  const resultRange = args.length > 2 ? to2D(args[2]) : null;

  // Determine if search range is a vector (single row or single column)
  const isRow = searchRange.length === 1;
  const isCol = searchRange[0] && searchRange[0].length === 1;

  if (isRow) {
    // Search in single row, return from result range or last row of search range
    const searchArr = searchRange[0];
    const resultArr = resultRange ? (resultRange[0] ?? []) : searchArr; // If no result_range and single row, return from same row
    // Binary search (data assumed sorted ascending)
    let best = -1;
    for (let i = 0; i < searchArr.length; i++) {
      const cmp = compareValues(searchArr[i], searchKey);
      if (cmp === 0) {
        best = i;
        break;
      }
      if (cmp <= 0) best = i;
      else break;
    }
    if (best === -1) return "#N/A" as FormulaError;
    return resultArr[best] ?? ("#N/A" as FormulaError);
  }

  if (isCol || !isRow) {
    // Search in first column, return from result range or last column
    const returnCol = resultRange ? 0 : (searchRange[0]?.length ?? 1) - 1;
    let best = -1;
    for (let i = 0; i < searchRange.length; i++) {
      const cmp = compareValues(searchRange[i][0], searchKey);
      if (cmp === 0) {
        best = i;
        break;
      }
      if (cmp <= 0) best = i;
      else break;
    }
    if (best === -1) return "#N/A" as FormulaError;

    if (resultRange) {
      // Return from last column of result range at same row
      const lastCol = (resultRange[0]?.length ?? 1) - 1;
      return resultRange[best]?.[lastCol] ?? ("#N/A" as FormulaError);
    }
    return searchRange[best][returnCol] ?? ("#N/A" as FormulaError);
  }

  return "#N/A" as FormulaError;
}

// Stubs for OFFSET and INDIRECT — actual implementation is in evaluator.ts
function fnOFFSET(..._args: FormulaValue[]): FormulaValue {
  return "#VALUE!" as FormulaError;
}

function fnINDIRECT(..._args: FormulaValue[]): FormulaValue {
  return "#REF!" as FormulaError;
}

export const lookupFunctions: Record<string, FormulaFunction> = {
  VLOOKUP: fnVLOOKUP,
  HLOOKUP: fnHLOOKUP,
  INDEX: fnINDEX,
  MATCH: fnMATCH,
  XLOOKUP: fnXLOOKUP,
  ROW: fnROW,
  COLUMN: fnCOLUMN,
  ROWS: fnROWS,
  COLUMNS: fnCOLUMNS,
  CHOOSE: fnCHOOSE,
  ADDRESS: fnADDRESS,
  LOOKUP: fnLOOKUP,
  OFFSET: fnOFFSET,
  INDIRECT: fnINDIRECT,
};
