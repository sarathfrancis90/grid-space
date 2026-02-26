/**
 * Statistical functions: STDEV, VAR, MEDIAN, MODE, PERCENTILE,
 * QUARTILE, RANK, LARGE, SMALL, CORREL, FORECAST
 */
import type { FormulaValue } from "../../../types/formula";
import type { FormulaFunction, FormulaError } from "./helpers";
import {
  flattenArgs,
  toNumber,
  requireNumber,
  isFormulaError,
} from "./helpers";

/** Extract numeric values from flattened args. */
function extractNumbers(args: FormulaValue[]): number[] {
  const flat = flattenArgs(args);
  const nums: number[] = [];
  for (const val of flat) {
    const n = toNumber(val, false);
    if (n !== null) nums.push(n);
  }
  return nums;
}

function fnSTDEV(...args: FormulaValue[]): FormulaValue {
  const nums = extractNumbers(args);
  if (nums.length < 2) return "#DIV/0!" as FormulaError;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance =
    nums.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(variance);
}

function fnVAR(...args: FormulaValue[]): FormulaValue {
  const nums = extractNumbers(args);
  if (nums.length < 2) return "#DIV/0!" as FormulaError;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  return nums.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (nums.length - 1);
}

function fnMEDIAN(...args: FormulaValue[]): FormulaValue {
  const nums = extractNumbers(args);
  if (nums.length === 0) return "#NUM!" as FormulaError;
  nums.sort((a, b) => a - b);
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
}

function fnMODE(...args: FormulaValue[]): FormulaValue {
  const nums = extractNumbers(args);
  if (nums.length === 0) return "#N/A" as FormulaError;
  const freq = new Map<number, number>();
  for (const n of nums) {
    freq.set(n, (freq.get(n) ?? 0) + 1);
  }
  let maxFreq = 0;
  let mode = nums[0];
  for (const [val, count] of freq) {
    if (count > maxFreq) {
      maxFreq = count;
      mode = val;
    }
  }
  if (maxFreq <= 1) return "#N/A" as FormulaError;
  return mode;
}

function fnPERCENTILE(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const nums = extractNumbers([args[0]]);
  const k = requireNumber(args[1]);
  if (isFormulaError(k)) return k;
  if ((k as number) < 0 || (k as number) > 1) return "#NUM!" as FormulaError;
  if (nums.length === 0) return "#NUM!" as FormulaError;
  nums.sort((a, b) => a - b);
  const index = (k as number) * (nums.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return nums[lower];
  return nums[lower] + (nums[upper] - nums[lower]) * (index - lower);
}

function fnQUARTILE(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const quart = requireNumber(args[1]);
  if (isFormulaError(quart)) return quart;
  if ((quart as number) < 0 || (quart as number) > 4)
    return "#NUM!" as FormulaError;
  return fnPERCENTILE(args[0], (quart as number) / 4);
}

function fnRANK(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  const nums = extractNumbers([args[1]]);
  const order = args.length > 2 ? requireNumber(args[2]) : 0;
  if (isFormulaError(order)) return order;
  const ascending = (order as number) !== 0;

  const sorted = [...nums].sort((a, b) => (ascending ? a - b : b - a));
  const idx = sorted.indexOf(num as number);
  if (idx === -1) return "#N/A" as FormulaError;
  return idx + 1;
}

function fnLARGE(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const nums = extractNumbers([args[0]]);
  const k = requireNumber(args[1]);
  if (isFormulaError(k)) return k;
  if ((k as number) < 1 || (k as number) > nums.length)
    return "#NUM!" as FormulaError;
  nums.sort((a, b) => b - a);
  return nums[(k as number) - 1];
}

function fnSMALL(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const nums = extractNumbers([args[0]]);
  const k = requireNumber(args[1]);
  if (isFormulaError(k)) return k;
  if ((k as number) < 1 || (k as number) > nums.length)
    return "#NUM!" as FormulaError;
  nums.sort((a, b) => a - b);
  return nums[(k as number) - 1];
}

function fnCORREL(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const xVals = extractNumbers([args[0]]);
  const yVals = extractNumbers([args[1]]);
  const n = Math.min(xVals.length, yVals.length);
  if (n < 2) return "#DIV/0!" as FormulaError;

  const meanX = xVals.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const meanY = yVals.slice(0, n).reduce((a, b) => a + b, 0) / n;

  let sumXY = 0,
    sumX2 = 0,
    sumY2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xVals[i] - meanX;
    const dy = yVals[i] - meanY;
    sumXY += dx * dy;
    sumX2 += dx * dx;
    sumY2 += dy * dy;
  }

  const denom = Math.sqrt(sumX2 * sumY2);
  if (denom === 0) return "#DIV/0!" as FormulaError;
  return sumXY / denom;
}

function fnFORECAST(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const x = requireNumber(args[0]);
  if (isFormulaError(x)) return x;
  const knownY = extractNumbers([args[1]]);
  const knownX = extractNumbers([args[2]]);
  const n = Math.min(knownY.length, knownX.length);
  if (n < 2) return "#N/A" as FormulaError;

  const meanX = knownX.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const meanY = knownY.slice(0, n).reduce((a, b) => a + b, 0) / n;

  let sumXY = 0,
    sumX2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = knownX[i] - meanX;
    sumXY += dx * (knownY[i] - meanY);
    sumX2 += dx * dx;
  }

  if (sumX2 === 0) return "#DIV/0!" as FormulaError;
  const slope = sumXY / sumX2;
  const intercept = meanY - slope * meanX;
  return intercept + slope * (x as number);
}

export const statisticalFunctions: Record<string, FormulaFunction> = {
  STDEV: fnSTDEV,
  VAR: fnVAR,
  MEDIAN: fnMEDIAN,
  MODE: fnMODE,
  PERCENTILE: fnPERCENTILE,
  QUARTILE: fnQUARTILE,
  RANK: fnRANK,
  LARGE: fnLARGE,
  SMALL: fnSMALL,
  CORREL: fnCORREL,
  FORECAST: fnFORECAST,
};
