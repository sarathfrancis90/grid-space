/**
 * Array functions: SORT, FILTER, UNIQUE, TRANSPOSE
 */
import type { FormulaValue } from "../../../types/formula";
import type { FormulaFunction, FormulaError } from "./helpers";
import {
  flattenArgs,
  is2DArray,
  requireNumber,
  isFormulaError,
} from "./helpers";

function fnSORT(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;
  if (is2DArray(args[0])) {
    const data = (args[0] as unknown as FormulaValue[][]).map((row) => [
      ...row,
    ]);
    const colIdx = args.length > 1 ? requireNumber(args[1]) : 1;
    if (isFormulaError(colIdx)) return colIdx;
    const ascending =
      args.length > 2 ? args[2] !== false && args[2] !== 0 : true;
    const col = (colIdx as number) - 1;
    data.sort((a, b) => {
      const va = a[col] ?? null;
      const vb = b[col] ?? null;
      const na = typeof va === "number" ? va : NaN;
      const nb = typeof vb === "number" ? vb : NaN;
      if (!isNaN(na) && !isNaN(nb)) return ascending ? na - nb : nb - na;
      const sa = String(va ?? "");
      const sb = String(vb ?? "");
      return ascending ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
    return data as unknown as FormulaValue;
  }
  // Flat array
  const flat = flattenArgs([args[0]]);
  const ascending = args.length > 2 ? args[2] !== false && args[2] !== 0 : true;
  flat.sort((a, b) => {
    const na = typeof a === "number" ? a : NaN;
    const nb = typeof b === "number" ? b : NaN;
    if (!isNaN(na) && !isNaN(nb)) return ascending ? na - nb : nb - na;
    return ascending
      ? String(a ?? "").localeCompare(String(b ?? ""))
      : String(b ?? "").localeCompare(String(a ?? ""));
  });
  return flat as unknown as FormulaValue;
}

function fnFILTER(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  if (is2DArray(args[0])) {
    const data = args[0] as unknown as FormulaValue[][];
    const include = flattenArgs([args[1]]);
    const result = data.filter(
      (_, i) =>
        i < include.length &&
        include[i] !== false &&
        include[i] !== 0 &&
        include[i] !== null,
    );
    if (result.length === 0) {
      return args.length > 2 ? args[2] : ("#N/A" as FormulaError);
    }
    return result as unknown as FormulaValue;
  }
  const flat = flattenArgs([args[0]]);
  const include = flattenArgs([args[1]]);
  const result = flat.filter(
    (_, i) =>
      i < include.length &&
      include[i] !== false &&
      include[i] !== 0 &&
      include[i] !== null,
  );
  if (result.length === 0) {
    return args.length > 2 ? args[2] : ("#N/A" as FormulaError);
  }
  return result as unknown as FormulaValue;
}

function fnUNIQUE(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;
  const flat = flattenArgs([args[0]]);
  const seen = new Set<string>();
  const result: FormulaValue[] = [];
  for (const val of flat) {
    const key = String(val);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(val);
    }
  }
  return result as unknown as FormulaValue;
}

function fnTRANSPOSE(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;
  if (is2DArray(args[0])) {
    const data = args[0] as unknown as FormulaValue[][];
    const rows = data.length;
    const cols = data[0]?.length ?? 0;
    const result: FormulaValue[][] = [];
    for (let c = 0; c < cols; c++) {
      const row: FormulaValue[] = [];
      for (let r = 0; r < rows; r++) {
        row.push(data[r][c] ?? null);
      }
      result.push(row);
    }
    return result as unknown as FormulaValue;
  }
  // Single row/column — just return as-is
  return args[0];
}

/**
 * FLATTEN(range1, [range2, ...])
 * Flattens nested arrays/ranges into a single flat column.
 */
function fnFLATTEN(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;
  const flat = flattenArgs(args);
  // Return as a column (2D array of single-element rows)
  return flat.map((v) => [v]) as unknown as FormulaValue;
}

/**
 * TOCOL(array, [ignore], [scan_by_column])
 * Transforms a 2D array into a single column.
 * ignore: 0=keep all(default), 1=ignore blanks, 2=ignore errors, 3=ignore blanks+errors
 * scan_by_column: FALSE(default)=scan by row, TRUE=scan by column
 */
function fnTOCOL(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;
  const ignoreMode = args.length >= 2 ? requireNumber(args[1]) : 0;
  if (isFormulaError(ignoreMode)) return ignoreMode;
  const scanByCol = args.length >= 3 && (args[2] === true || args[2] === 1);

  let flat: FormulaValue[];
  if (is2DArray(args[0])) {
    const data = args[0] as unknown as FormulaValue[][];
    if (scanByCol) {
      flat = [];
      const cols = data[0]?.length ?? 0;
      for (let c = 0; c < cols; c++) {
        for (const row of data) {
          flat.push(row[c] ?? null);
        }
      }
    } else {
      flat = flattenArgs([args[0]]);
    }
  } else {
    flat = flattenArgs([args[0]]);
  }

  const filtered = filterByIgnoreMode(flat, ignoreMode as number);
  return filtered.map((v) => [v]) as unknown as FormulaValue;
}

/**
 * TOROW(array, [ignore], [scan_by_column])
 * Transforms a 2D array into a single row.
 */
function fnTOROW(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;
  const ignoreMode = args.length >= 2 ? requireNumber(args[1]) : 0;
  if (isFormulaError(ignoreMode)) return ignoreMode;
  const scanByCol = args.length >= 3 && (args[2] === true || args[2] === 1);

  let flat: FormulaValue[];
  if (is2DArray(args[0])) {
    const data = args[0] as unknown as FormulaValue[][];
    if (scanByCol) {
      flat = [];
      const cols = data[0]?.length ?? 0;
      for (let c = 0; c < cols; c++) {
        for (const row of data) {
          flat.push(row[c] ?? null);
        }
      }
    } else {
      flat = flattenArgs([args[0]]);
    }
  } else {
    flat = flattenArgs([args[0]]);
  }

  const filtered = filterByIgnoreMode(flat, ignoreMode as number);
  return [filtered] as unknown as FormulaValue;
}

/**
 * HSTACK(range1, [range2, ...])
 * Stacks arrays horizontally (side by side).
 */
function fnHSTACK(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;

  const arrays = args.map((a) => {
    if (is2DArray(a)) return a as unknown as FormulaValue[][];
    if (Array.isArray(a)) return (a as FormulaValue[]).map((v) => [v]);
    return [[a]];
  });

  // Find max rows
  const maxRows = Math.max(...arrays.map((a) => a.length));

  const result: FormulaValue[][] = [];
  for (let r = 0; r < maxRows; r++) {
    const row: FormulaValue[] = [];
    for (const arr of arrays) {
      const srcRow =
        r < arr.length ? arr[r] : arr[0].map(() => null as FormulaValue);
      row.push(...srcRow);
    }
    result.push(row);
  }

  return result as unknown as FormulaValue;
}

/**
 * VSTACK(range1, [range2, ...])
 * Stacks arrays vertically (on top of each other).
 */
function fnVSTACK(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;

  const arrays = args.map((a) => {
    if (is2DArray(a)) return a as unknown as FormulaValue[][];
    if (Array.isArray(a)) return (a as FormulaValue[]).map((v) => [v]);
    return [[a]];
  });

  // Find max cols
  const maxCols = Math.max(...arrays.map((a) => a[0]?.length ?? 0));

  const result: FormulaValue[][] = [];
  for (const arr of arrays) {
    for (const row of arr) {
      const paddedRow = [...row];
      while (paddedRow.length < maxCols) paddedRow.push(null);
      result.push(paddedRow);
    }
  }

  return result as unknown as FormulaValue;
}

/**
 * CHOOSECOLS(array, col1, [col2, ...])
 * Selects specific columns from an array.
 */
function fnCHOOSECOLS(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  if (!is2DArray(args[0])) return "#VALUE!" as FormulaError;

  const data = args[0] as unknown as FormulaValue[][];
  const totalCols = data[0]?.length ?? 0;
  const colIndices: number[] = [];

  for (let i = 1; i < args.length; i++) {
    const idx = requireNumber(args[i]);
    if (isFormulaError(idx)) return idx;
    const colIdx = idx as number;
    // Support negative indices (from end)
    const resolved = colIdx > 0 ? colIdx - 1 : totalCols + colIdx;
    if (resolved < 0 || resolved >= totalCols) return "#VALUE!" as FormulaError;
    colIndices.push(resolved);
  }

  const result: FormulaValue[][] = data.map((row) =>
    colIndices.map((c) => row[c] ?? null),
  );

  return result as unknown as FormulaValue;
}

/**
 * CHOOSEROWS(array, row1, [row2, ...])
 * Selects specific rows from an array.
 */
function fnCHOOSEROWS(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  if (!is2DArray(args[0])) return "#VALUE!" as FormulaError;

  const data = args[0] as unknown as FormulaValue[][];
  const totalRows = data.length;
  const rowIndices: number[] = [];

  for (let i = 1; i < args.length; i++) {
    const idx = requireNumber(args[i]);
    if (isFormulaError(idx)) return idx;
    const rowIdx = idx as number;
    const resolved = rowIdx > 0 ? rowIdx - 1 : totalRows + rowIdx;
    if (resolved < 0 || resolved >= totalRows) return "#VALUE!" as FormulaError;
    rowIndices.push(resolved);
  }

  const result: FormulaValue[][] = rowIndices.map((r) => [...data[r]]);
  return result as unknown as FormulaValue;
}

/**
 * WRAPCOLS(array, wrap_count, [pad_with])
 * Wraps a flat array into columns of wrap_count elements.
 */
function fnWRAPCOLS(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const wrapCount = requireNumber(args[1]);
  if (isFormulaError(wrapCount)) return wrapCount;
  if ((wrapCount as number) < 1) return "#VALUE!" as FormulaError;

  const flat = flattenArgs([args[0]]);
  const wrap = wrapCount as number;
  const padWith = args.length >= 3 ? args[2] : null;

  // Pad to fill complete columns
  while (flat.length % wrap !== 0) flat.push(padWith);

  const numCols = flat.length / wrap;
  const result: FormulaValue[][] = [];

  for (let r = 0; r < wrap; r++) {
    const row: FormulaValue[] = [];
    for (let c = 0; c < numCols; c++) {
      row.push(flat[c * wrap + r]);
    }
    result.push(row);
  }

  return result as unknown as FormulaValue;
}

/**
 * WRAPROWS(array, wrap_count, [pad_with])
 * Wraps a flat array into rows of wrap_count elements.
 */
function fnWRAPROWS(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const wrapCount = requireNumber(args[1]);
  if (isFormulaError(wrapCount)) return wrapCount;
  if ((wrapCount as number) < 1) return "#VALUE!" as FormulaError;

  const flat = flattenArgs([args[0]]);
  const wrap = wrapCount as number;
  const padWith = args.length >= 3 ? args[2] : null;

  // Pad to fill complete rows
  while (flat.length % wrap !== 0) flat.push(padWith);

  const result: FormulaValue[][] = [];
  for (let i = 0; i < flat.length; i += wrap) {
    result.push(flat.slice(i, i + wrap));
  }

  return result as unknown as FormulaValue;
}

/**
 * Helper: filter values based on ignore mode (for TOCOL/TOROW).
 * 0=keep all, 1=ignore blanks, 2=ignore errors, 3=ignore blanks+errors
 */
function filterByIgnoreMode(
  values: FormulaValue[],
  mode: number,
): FormulaValue[] {
  if (mode === 0) return values;
  return values.filter((v) => {
    if ((mode & 1) !== 0 && (v === null || v === "")) return false;
    if ((mode & 2) !== 0 && isFormulaError(v)) return false;
    return true;
  });
}

export const arrayFunctions: Record<string, FormulaFunction> = {
  SORT: fnSORT,
  FILTER: fnFILTER,
  UNIQUE: fnUNIQUE,
  TRANSPOSE: fnTRANSPOSE,
  FLATTEN: fnFLATTEN,
  TOCOL: fnTOCOL,
  TOROW: fnTOROW,
  HSTACK: fnHSTACK,
  VSTACK: fnVSTACK,
  CHOOSECOLS: fnCHOOSECOLS,
  CHOOSEROWS: fnCHOOSEROWS,
  WRAPCOLS: fnWRAPCOLS,
  WRAPROWS: fnWRAPROWS,
};
