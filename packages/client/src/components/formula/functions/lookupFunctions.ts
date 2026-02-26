/**
 * Lookup & reference functions: VLOOKUP, HLOOKUP, INDEX, MATCH, XLOOKUP,
 * OFFSET, INDIRECT, ROW, COLUMN, ROWS, COLUMNS, CHOOSE
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

function fnROW(...args: FormulaValue[]): FormulaValue {
  // When called without args in a formula, ideally returns the current row.
  // With a cell ref arg, the evaluator passes the resolved value (not the ref).
  // We return 1 as default — proper implementation needs evaluator context.
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
};
