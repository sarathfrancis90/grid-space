/**
 * Conditional aggregate functions: SUMIF, COUNTIF, AVERAGEIF,
 * SUMIFS, COUNTIFS, AVERAGEIFS
 */
import type { FormulaValue } from "../../../types/formula";
import type { FormulaFunction, FormulaError } from "./helpers";
import { flattenArgs, toNumber, matchesCriteria } from "./helpers";

function fnSUMIF(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const range = flattenArgs([args[0]]);
  const criteria = args[1];
  const sumRange = args.length > 2 ? flattenArgs([args[2]]) : range;

  let sum = 0;
  for (let i = 0; i < range.length; i++) {
    if (matchesCriteria(range[i], criteria)) {
      const val = i < sumRange.length ? sumRange[i] : null;
      const n = toNumber(val);
      if (n !== null) sum += n;
    }
  }
  return sum;
}

function fnCOUNTIF(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const range = flattenArgs([args[0]]);
  const criteria = args[1];

  let count = 0;
  for (const val of range) {
    if (matchesCriteria(val, criteria)) count++;
  }
  return count;
}

function fnAVERAGEIF(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const range = flattenArgs([args[0]]);
  const criteria = args[1];
  const avgRange = args.length > 2 ? flattenArgs([args[2]]) : range;

  let sum = 0;
  let count = 0;
  for (let i = 0; i < range.length; i++) {
    if (matchesCriteria(range[i], criteria)) {
      const val = i < avgRange.length ? avgRange[i] : null;
      const n = toNumber(val, false);
      if (n !== null) {
        sum += n;
        count++;
      }
    }
  }
  if (count === 0) return "#DIV/0!" as FormulaError;
  return sum / count;
}

function fnSUMIFS(...args: FormulaValue[]): FormulaValue {
  // SUMIFS(sum_range, criteria_range1, criteria1, criteria_range2, criteria2, ...)
  if (args.length < 3 || (args.length - 1) % 2 !== 0) {
    return "#VALUE!" as FormulaError;
  }
  const sumRange = flattenArgs([args[0]]);
  const pairs: Array<{ range: FormulaValue[]; criteria: FormulaValue }> = [];
  for (let i = 1; i < args.length; i += 2) {
    pairs.push({
      range: flattenArgs([args[i]]),
      criteria: args[i + 1],
    });
  }

  let sum = 0;
  for (let i = 0; i < sumRange.length; i++) {
    const allMatch = pairs.every(
      (p) => i < p.range.length && matchesCriteria(p.range[i], p.criteria),
    );
    if (allMatch) {
      const n = toNumber(sumRange[i]);
      if (n !== null) sum += n;
    }
  }
  return sum;
}

function fnCOUNTIFS(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2 || args.length % 2 !== 0) {
    return "#VALUE!" as FormulaError;
  }
  const pairs: Array<{ range: FormulaValue[]; criteria: FormulaValue }> = [];
  for (let i = 0; i < args.length; i += 2) {
    pairs.push({
      range: flattenArgs([args[i]]),
      criteria: args[i + 1],
    });
  }

  const length = pairs[0]?.range.length ?? 0;
  let count = 0;
  for (let i = 0; i < length; i++) {
    const allMatch = pairs.every(
      (p) => i < p.range.length && matchesCriteria(p.range[i], p.criteria),
    );
    if (allMatch) count++;
  }
  return count;
}

function fnAVERAGEIFS(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3 || (args.length - 1) % 2 !== 0) {
    return "#VALUE!" as FormulaError;
  }
  const avgRange = flattenArgs([args[0]]);
  const pairs: Array<{ range: FormulaValue[]; criteria: FormulaValue }> = [];
  for (let i = 1; i < args.length; i += 2) {
    pairs.push({
      range: flattenArgs([args[i]]),
      criteria: args[i + 1],
    });
  }

  let sum = 0;
  let count = 0;
  for (let i = 0; i < avgRange.length; i++) {
    const allMatch = pairs.every(
      (p) => i < p.range.length && matchesCriteria(p.range[i], p.criteria),
    );
    if (allMatch) {
      const n = toNumber(avgRange[i], false);
      if (n !== null) {
        sum += n;
        count++;
      }
    }
  }
  if (count === 0) return "#DIV/0!" as FormulaError;
  return sum / count;
}

export const conditionalFunctions: Record<string, FormulaFunction> = {
  SUMIF: fnSUMIF,
  COUNTIF: fnCOUNTIF,
  AVERAGEIF: fnAVERAGEIF,
  SUMIFS: fnSUMIFS,
  COUNTIFS: fnCOUNTIFS,
  AVERAGEIFS: fnAVERAGEIFS,
};
