/**
 * Web Worker for offloading heavy formula recalculation.
 * Receives cell data + dependency graph, returns recalculated values.
 */

interface WorkerMessage {
  type: "recalculate";
  cells: Record<
    string,
    { value: string | number | boolean | null; formula?: string }
  >;
  dependencyOrder: string[];
}

interface WorkerResponse {
  type: "result";
  results: Record<string, string | number | boolean | null>;
  elapsed: number;
}

function evaluateSimpleFormula(
  formula: string,
  cells: Record<
    string,
    { value: string | number | boolean | null; formula?: string }
  >,
): string | number | boolean | null {
  const upper = formula.toUpperCase().trim();

  // SUM(range)
  const sumMatch = upper.match(/^SUM\(([^)]+)\)$/);
  if (sumMatch) {
    const refs = expandRange(sumMatch[1]);
    let total = 0;
    for (const ref of refs) {
      const cell = cells[ref];
      if (cell) {
        const num = Number(cell.value);
        if (!isNaN(num)) total += num;
      }
    }
    return total;
  }

  // AVERAGE(range)
  const avgMatch = upper.match(/^AVERAGE\(([^)]+)\)$/);
  if (avgMatch) {
    const refs = expandRange(avgMatch[1]);
    let total = 0;
    let count = 0;
    for (const ref of refs) {
      const cell = cells[ref];
      if (cell) {
        const num = Number(cell.value);
        if (!isNaN(num)) {
          total += num;
          count++;
        }
      }
    }
    return count > 0 ? total / count : 0;
  }

  // Simple cell reference (e.g., A1)
  const refMatch = upper.match(/^([A-Z]+)(\d+)$/);
  if (refMatch) {
    const cell = cells[upper];
    return cell?.value ?? 0;
  }

  // Literal numbers
  const num = Number(formula);
  if (!isNaN(num)) return num;

  return formula;
}

function expandRange(rangeStr: string): string[] {
  const parts = rangeStr.split(":");
  if (parts.length !== 2) {
    return rangeStr.split(",").map((s) => s.trim());
  }
  const [startRef, endRef] = parts;
  const startMatch = startRef.match(/^([A-Z]+)(\d+)$/);
  const endMatch = endRef.match(/^([A-Z]+)(\d+)$/);
  if (!startMatch || !endMatch) return [rangeStr];

  const startCol = colLetterToNum(startMatch[1]);
  const endCol = colLetterToNum(endMatch[1]);
  const startRow = parseInt(startMatch[2], 10);
  const endRow = parseInt(endMatch[2], 10);

  const refs: string[] = [];
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      refs.push(`${numToColLetter(c)}${r}`);
    }
  }
  return refs;
}

function colLetterToNum(letter: string): number {
  let num = 0;
  for (let i = 0; i < letter.length; i++) {
    num = num * 26 + (letter.charCodeAt(i) - 64);
  }
  return num;
}

function numToColLetter(num: number): string {
  let result = "";
  let n = num;
  while (n > 0) {
    n--;
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, cells, dependencyOrder } = e.data;
  if (type !== "recalculate") return;

  const start = performance.now();
  const results: Record<string, string | number | boolean | null> = {};

  for (const key of dependencyOrder) {
    const cell = cells[key];
    if (cell?.formula) {
      results[key] = evaluateSimpleFormula(cell.formula, cells);
      // Update cell value for downstream deps
      cells[key] = { ...cell, value: results[key] };
    } else if (cell) {
      results[key] = cell.value;
    }
  }

  const elapsed = performance.now() - start;
  const response: WorkerResponse = { type: "result", results, elapsed };
  self.postMessage(response);
};

export type { WorkerMessage, WorkerResponse };
