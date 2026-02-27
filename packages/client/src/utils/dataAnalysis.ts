/**
 * Data analysis utilities — pure client-side statistical analysis.
 * No external AI API calls; all computations are local JavaScript.
 */
import type { CellData, ChartType } from "../types/grid";
import { colToLetter } from "./coordinates";

export type ColumnType =
  | "number"
  | "text"
  | "date"
  | "boolean"
  | "mixed"
  | "empty";

export interface ColumnInfo {
  index: number;
  label: string;
  type: ColumnType;
  nonEmptyCount: number;
  uniqueCount: number;
}

export interface Statistics {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  median: number;
  stdDev: number;
  q1: number;
  q3: number;
}

export interface FrequencyEntry {
  value: string;
  count: number;
}

export interface ColumnAnalysis {
  info: ColumnInfo;
  statistics?: Statistics;
  topValues: FrequencyEntry[];
  outlierIndices: number[];
  trend?: "increasing" | "decreasing" | "stable" | "volatile";
}

export interface ChartSuggestion {
  type: ChartType;
  reason: string;
}

export interface CorrelationEntry {
  colA: number;
  colB: number;
  labelA: string;
  labelB: string;
  coefficient: number;
}

export interface AnalysisResult {
  rowCount: number;
  colCount: number;
  columns: ColumnAnalysis[];
  correlations: CorrelationEntry[];
  chartSuggestions: ChartSuggestion[];
}

type CellGetter = (row: number, col: number) => CellData | undefined;

function medianOfSorted(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function computeStatistics(values: number[]): Statistics {
  const count = values.length;
  if (count === 0) {
    return {
      count: 0,
      sum: 0,
      avg: 0,
      min: 0,
      max: 0,
      median: 0,
      stdDev: 0,
      q1: 0,
      q3: 0,
    };
  }
  let sum = 0;
  let min = values[0];
  let max = values[0];
  for (const v of values) {
    sum += v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const avg = sum / count;
  const sorted = [...values].sort((a, b) => a - b);
  const median = medianOfSorted(sorted);
  let variance = 0;
  for (const v of values) variance += (v - avg) ** 2;
  variance /= count;
  const stdDev = Math.sqrt(variance);
  const mid = Math.floor(count / 2);
  const q1 = medianOfSorted(sorted.slice(0, mid));
  const q3 = medianOfSorted(
    count % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1),
  );
  return { count, sum, avg, min, max, median, stdDev, q1, q3 };
}

export function detectOutliers(values: number[]): number[] {
  if (values.length < 4) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const q1 = medianOfSorted(sorted.slice(0, mid));
  const q3 = medianOfSorted(
    sorted.length % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1),
  );
  const iqr = q3 - q1;
  if (iqr === 0) return [];
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  const indices: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i] < lower || values[i] > upper) indices.push(i);
  }
  return indices;
}

export function computeCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i];
    sumB += b[i];
  }
  const avgA = sumA / n;
  const avgB = sumB / n;
  let sumAB = 0;
  let sumA2 = 0;
  let sumB2 = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - avgA;
    const db = b[i] - avgB;
    sumAB += da * db;
    sumA2 += da * da;
    sumB2 += db * db;
  }
  const denom = Math.sqrt(sumA2 * sumB2);
  return denom === 0 ? 0 : sumAB / denom;
}

function isDateLike(val: string): boolean {
  return (
    /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(val) ||
    /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(val)
  );
}

export function detectColumnTypes(
  data: (string | number | boolean | null)[][],
): ColumnType[] {
  if (data.length === 0) return [];
  let colCount = 0;
  for (const row of data) {
    if (row.length > colCount) colCount = row.length;
  }
  const types: ColumnType[] = [];
  for (let c = 0; c < colCount; c++) {
    let nums = 0;
    let texts = 0;
    let bools = 0;
    let dates = 0;
    let empty = 0;
    for (const row of data) {
      const v = row[c];
      if (v === null || v === undefined || v === "") {
        empty++;
      } else if (typeof v === "boolean") {
        bools++;
      } else if (typeof v === "number") {
        nums++;
      } else if (typeof v === "string") {
        if (v.trim() !== "" && !isNaN(Number(v))) nums++;
        else if (isDateLike(v)) dates++;
        else texts++;
      }
    }
    const total = data.length - empty;
    if (total === 0) {
      types.push("empty");
    } else if (bools === total) {
      types.push("boolean");
    } else if (nums === total) {
      types.push("number");
    } else if (dates > 0 && dates >= total * 0.8) {
      types.push("date");
    } else if (texts === total) {
      types.push("text");
    } else {
      types.push("mixed");
    }
  }
  return types;
}

function detectTrend(
  values: number[],
): "increasing" | "decreasing" | "stable" | "volatile" {
  const n = values.length;
  if (n < 3) return "stable";
  const xMean = (n - 1) / 2;
  let ySum = 0;
  for (const v of values) ySum += v;
  const yMean = ySum / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = i - xMean;
    num += dx * (values[i] - yMean);
    den += dx * dx;
  }
  const slope = den === 0 ? 0 : num / den;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const predicted = yMean + slope * (i - xMean);
    ssRes += (values[i] - predicted) ** 2;
    ssTot += (values[i] - yMean) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  if (r2 < 0.3) return "volatile";
  let minV = values[0];
  let maxV = values[0];
  for (const v of values) {
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
  }
  const range = maxV - minV;
  const threshold = range === 0 ? 0.01 : (range * 0.05) / n;
  if (Math.abs(slope) < threshold) return "stable";
  return slope > 0 ? "increasing" : "decreasing";
}

export function suggestCharts(analysis: AnalysisResult): ChartSuggestion[] {
  const suggestions: ChartSuggestion[] = [];
  const numCols = analysis.columns.filter((c) => c.info.type === "number");
  const textCols = analysis.columns.filter((c) => c.info.type === "text");
  const dateCols = analysis.columns.filter((c) => c.info.type === "date");
  if (textCols.length >= 1 && numCols.length >= 1) {
    suggestions.push({
      type: "column",
      reason: "Category labels with numeric values",
    });
  }
  if (dateCols.length >= 1 && numCols.length >= 1) {
    suggestions.push({ type: "line", reason: "Time-series data detected" });
  }
  if (numCols.length >= 2) {
    suggestions.push({
      type: "scatter",
      reason: "Multiple numeric columns for correlation",
    });
  }
  if (textCols.length >= 1 && numCols.length === 1 && analysis.rowCount <= 12) {
    suggestions.push({
      type: "pie",
      reason: "Few categories with single value column",
    });
  }
  if (suggestions.length === 0 && numCols.length >= 1) {
    suggestions.push({ type: "bar", reason: "Numeric data overview" });
  }
  return suggestions.slice(0, 3);
}

function extractNumericValues(
  rawData: (string | number | boolean | null)[][],
  colIndex: number,
): number[] {
  const nums: number[] = [];
  for (const row of rawData) {
    const v = row[colIndex];
    if (typeof v === "number") {
      nums.push(v);
    } else if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) {
      nums.push(Number(v));
    }
  }
  return nums;
}

export function analyzeSelection(
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
  getCell: CellGetter,
): AnalysisResult {
  const rowCount = endRow - startRow + 1;
  const colCount = endCol - startCol + 1;

  const rawData: (string | number | boolean | null)[][] = [];
  for (let r = startRow; r <= endRow; r++) {
    const row: (string | number | boolean | null)[] = [];
    for (let c = startCol; c <= endCol; c++) {
      const cell = getCell(r, c);
      row.push(cell?.value ?? null);
    }
    rawData.push(row);
  }

  const colTypes = detectColumnTypes(rawData);

  const columns: ColumnAnalysis[] = [];
  for (let ci = 0; ci < colCount; ci++) {
    const absCol = startCol + ci;
    const label = colToLetter(absCol);
    const values = rawData.map((r) => r[ci]);
    const nonEmpty = values.filter(
      (v) => v !== null && v !== undefined && v !== "",
    );
    const freq = new Map<string, number>();
    for (const v of nonEmpty) {
      const key = String(v);
      freq.set(key, (freq.get(key) ?? 0) + 1);
    }
    const topValues = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({ value, count }));

    const info: ColumnInfo = {
      index: ci,
      label,
      type: colTypes[ci] ?? "empty",
      nonEmptyCount: nonEmpty.length,
      uniqueCount: freq.size,
    };

    let statistics: Statistics | undefined;
    let outlierIndices: number[] = [];
    let trend: "increasing" | "decreasing" | "stable" | "volatile" | undefined;

    if (colTypes[ci] === "number" || colTypes[ci] === "mixed") {
      const nums = extractNumericValues(rawData, ci);
      if (nums.length > 0) {
        statistics = computeStatistics(nums);
        outlierIndices = detectOutliers(nums);
        trend = detectTrend(nums);
      }
    }

    columns.push({ info, statistics, topValues, outlierIndices, trend });
  }

  const numericCols = columns.filter((c) => c.statistics);
  const correlations: CorrelationEntry[] = [];
  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i + 1; j < numericCols.length; j++) {
      const colA = numericCols[i];
      const colB = numericCols[j];
      const valsA = extractNumericValues(rawData, colA.info.index);
      const valsB = extractNumericValues(rawData, colB.info.index);
      const coef = computeCorrelation(valsA, valsB);
      correlations.push({
        colA: colA.info.index,
        colB: colB.info.index,
        labelA: colA.info.label,
        labelB: colB.info.label,
        coefficient: coef,
      });
    }
  }

  const result: AnalysisResult = {
    rowCount,
    colCount,
    columns,
    correlations,
    chartSuggestions: [],
  };
  result.chartSuggestions = suggestCharts(result);
  return result;
}
