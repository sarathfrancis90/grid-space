/**
 * Helpers for advanced chart types: trendline calculation, histogram binning,
 * waterfall data transformation, and candlestick data extraction.
 */

export interface TrendlineResult {
  label: string;
  data: number[];
}

export function computeLinearTrendline(
  data: number[],
  label: string,
): TrendlineResult {
  const n = data.length;
  if (n < 2) return { label: `${label} (trend)`, data: [...data] };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return {
    label: `${label} (trend)`,
    data: Array.from({ length: n }, (_, i) => slope * i + intercept),
  };
}

export function computeExponentialTrendline(
  data: number[],
  label: string,
): TrendlineResult {
  const n = data.length;
  if (n < 2) return { label: `${label} (trend)`, data: [...data] };

  const logData = data.map((v) => (v > 0 ? Math.log(v) : 0));
  const trend = computeLinearTrendline(logData, label);

  return {
    label: `${label} (exp trend)`,
    data: trend.data.map((v) => Math.exp(v)),
  };
}

export function computePolynomialTrendline(
  data: number[],
  label: string,
  degree: number = 2,
): TrendlineResult {
  const n = data.length;
  if (n < degree + 1) return { label: `${label} (trend)`, data: [...data] };

  // Simple polynomial fit using normal equations
  const size = degree + 1;
  const matrix: number[][] = Array.from({ length: size }, () =>
    new Array(size + 1).fill(0),
  );

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      for (let k = 0; k < n; k++) {
        matrix[i][j] += Math.pow(k, i + j);
      }
    }
    for (let k = 0; k < n; k++) {
      matrix[i][size] += data[k] * Math.pow(k, i);
    }
  }

  // Gaussian elimination
  for (let i = 0; i < size; i++) {
    let maxRow = i;
    for (let k = i + 1; k < size; k++) {
      if (Math.abs(matrix[k][i]) > Math.abs(matrix[maxRow][i])) maxRow = k;
    }
    [matrix[i], matrix[maxRow]] = [matrix[maxRow], matrix[i]];
    if (Math.abs(matrix[i][i]) < 1e-10) continue;
    for (let k = i + 1; k < size; k++) {
      const factor = matrix[k][i] / matrix[i][i];
      for (let j = i; j <= size; j++) {
        matrix[k][j] -= factor * matrix[i][j];
      }
    }
  }

  const coeffs = new Array(size).fill(0);
  for (let i = size - 1; i >= 0; i--) {
    coeffs[i] = matrix[i][size];
    for (let j = i + 1; j < size; j++) {
      coeffs[i] -= matrix[i][j] * coeffs[j];
    }
    coeffs[i] /= matrix[i][i];
  }

  return {
    label: `${label} (poly trend)`,
    data: Array.from({ length: n }, (_, x) =>
      coeffs.reduce((sum, c, p) => sum + c * Math.pow(x, p), 0),
    ),
  };
}

export interface HistogramBin {
  label: string;
  count: number;
}

export function computeHistogramBins(
  data: number[],
  binCount?: number,
): HistogramBin[] {
  if (data.length === 0) return [];

  let min = Infinity;
  let max = -Infinity;
  for (const v of data) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min;

  // Sturges' formula for bin count
  const numBins =
    binCount ?? Math.max(1, Math.ceil(Math.log2(data.length) + 1));
  const binWidth = range / numBins || 1;

  const bins: HistogramBin[] = Array.from({ length: numBins }, (_, i) => ({
    label: `${(min + i * binWidth).toFixed(1)}-${(min + (i + 1) * binWidth).toFixed(1)}`,
    count: 0,
  }));

  for (const val of data) {
    let idx = Math.floor((val - min) / binWidth);
    if (idx >= numBins) idx = numBins - 1;
    bins[idx].count++;
  }

  return bins;
}

export interface WaterfallPoint {
  label: string;
  value: number;
  runningTotal: number;
  isTotal: boolean;
}

export function computeWaterfallData(
  labels: string[],
  values: number[],
): WaterfallPoint[] {
  const points: WaterfallPoint[] = [];
  let total = 0;

  for (let i = 0; i < values.length; i++) {
    total += values[i];
    points.push({
      label: labels[i] ?? `Item ${i + 1}`,
      value: values[i],
      runningTotal: total,
      isTotal: false,
    });
  }

  points.push({
    label: "Total",
    value: total,
    runningTotal: total,
    isTotal: true,
  });

  return points;
}

export interface CandlestickPoint {
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface BubblePoint {
  x: number;
  y: number;
  r: number;
}

/**
 * Extract bubble chart data from datasets.
 * Expects at least 3 datasets: x values, y values, bubble size (r).
 * If only 2 datasets, uses index as x.
 */
export function extractBubbleData(
  datasets: { data: number[] }[],
): BubblePoint[] {
  if (datasets.length < 2) return [];

  const hasX = datasets.length >= 3;
  const xDs = hasX ? datasets[0] : undefined;
  const yDs = hasX ? datasets[1] : datasets[0];
  const rDs = hasX ? datasets[2] : datasets[1];

  const len = Math.min(
    yDs.data.length,
    rDs.data.length,
    xDs ? xDs.data.length : Infinity,
  );
  const maxR = Math.max(...rDs.data.slice(0, len), 1);

  return Array.from({ length: len }, (_, i) => ({
    x: xDs ? xDs.data[i] : i,
    y: yDs.data[i],
    r: Math.max(3, (rDs.data[i] / maxR) * 30),
  }));
}

/**
 * Build gauge chart data for Chart.js doughnut.
 * Takes a single value and renders it as a partial doughnut with a needle.
 */
export function buildGaugeData(
  value: number,
  min: number = 0,
  max: number = 100,
  colors?: string[],
): {
  data: number[];
  backgroundColor: string[];
  value: number;
  percentage: number;
} {
  const clamped = Math.max(min, Math.min(max, value));
  const percentage = ((clamped - min) / (max - min)) * 100;
  const gaugeColors = colors?.length
    ? colors
    : ["#34a853", "#fbbc04", "#ea4335"];

  // Split the filled portion into color segments
  const segmentSize = percentage / gaugeColors.length;
  const data: number[] = [];
  const backgroundColor: string[] = [];

  for (let i = 0; i < gaugeColors.length; i++) {
    const segmentEnd = segmentSize * (i + 1);
    if (segmentEnd <= percentage) {
      data.push(segmentSize);
      backgroundColor.push(gaugeColors[i]);
    } else {
      const remaining = percentage - segmentSize * i;
      if (remaining > 0) {
        data.push(remaining);
        backgroundColor.push(gaugeColors[i]);
      }
      break;
    }
  }

  // Add empty portion
  const emptyPortion = 100 - percentage;
  if (emptyPortion > 0) {
    data.push(emptyPortion);
    backgroundColor.push("#e0e0e0");
  }

  return { data, backgroundColor, value: clamped, percentage };
}

export function extractCandlestickData(
  labels: string[],
  datasets: { data: number[] }[],
): CandlestickPoint[] {
  // Expects 4 datasets: open, high, low, close
  if (datasets.length < 4) return [];

  const [openDs, highDs, lowDs, closeDs] = datasets;
  const len = Math.min(
    labels.length,
    openDs.data.length,
    highDs.data.length,
    lowDs.data.length,
    closeDs.data.length,
  );

  return Array.from({ length: len }, (_, i) => ({
    label: labels[i],
    open: openDs.data[i],
    high: highDs.data[i],
    low: lowDs.data[i],
    close: closeDs.data[i],
  }));
}
