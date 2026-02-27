/**
 * Zustand store for formula engine state.
 * Manages parsing, evaluation, dependency tracking, and recalculation.
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ASTNode, FormulaValue, CellValueGetter } from "../types/formula";
import { parseFormula } from "../components/formula/parser";
import {
  evaluate,
  extractReferences,
  resetLambdaRegistry,
} from "../components/formula/evaluator";
import { DependencyGraph } from "../components/formula/dependencyGraph";
import { cellId } from "../components/formula/cellUtils";

interface SpillRange {
  sourceRow: number;
  sourceCol: number;
  rows: number;
  cols: number;
  targets: string[]; // cell keys of spill target cells
}

interface FormulaState {
  dependencyGraph: DependencyGraph;
  formulaCache: Map<string, FormulaValue>;
  astCache: Map<string, ASTNode>;
  /** Maps source cell key → spill range metadata */
  spillRanges: Map<string, SpillRange>;
  /** Maps target cell key → source cell key (for quick lookup) */
  spillTargets: Map<string, string>;
}

interface FormulaActions {
  parseFormula: (formula: string) => ASTNode;
  evaluateFormula: (
    formula: string,
    getCellValue: CellValueGetter,
    cellKey?: string,
  ) => FormulaValue;
  recalculate: (
    changedCell: string,
    getFormula: (cellKey: string) => string | undefined,
    getCellValue: CellValueGetter,
  ) => Map<string, FormulaValue>;
  updateDependencies: (cellKey: string, formula: string) => boolean;
  clearCache: () => void;
  /** Get spill values for a cell. Returns the spill value if this cell is a spill target. */
  getSpillValue: (cellKey: string) => FormulaValue | undefined;
  /** Check if a cell is a spill target (read-only). */
  isSpillTarget: (cellKey: string) => boolean;
  /** Get the source cell key for a spill target. */
  getSpillSource: (cellKey: string) => string | undefined;
  /** Clear spill range for a source cell. */
  clearSpill: (sourceCellKey: string) => void;
  /** Process a formula result that may be an array — handle spill. */
  handleSpill: (
    sourceCellKey: string,
    sourceRow: number,
    sourceCol: number,
    result: FormulaValue,
    hasCellContent: (row: number, col: number) => boolean,
  ) => FormulaValue;
}

export const useFormulaStore = create<FormulaState & FormulaActions>()(
  immer((set, get) => ({
    dependencyGraph: new DependencyGraph(),
    formulaCache: new Map(),
    astCache: new Map(),
    spillRanges: new Map(),
    spillTargets: new Map(),

    parseFormula: (formula: string): ASTNode => {
      // Strip leading = if present
      const expr = formula.startsWith("=") ? formula.slice(1) : formula;
      return parseFormula(expr);
    },

    evaluateFormula: (
      formula: string,
      getCellValue: CellValueGetter,
      cellKey?: string,
    ): FormulaValue => {
      const state = get();
      const expr = formula.startsWith("=") ? formula.slice(1) : formula;

      // Reset lambda registry for each top-level evaluation
      resetLambdaRegistry();

      try {
        const ast = parseFormula(expr);

        if (cellKey) {
          state.astCache.set(cellKey, ast);
        }

        const result = evaluate(ast, getCellValue);

        if (cellKey) {
          state.formulaCache.set(cellKey, result);
        }

        return result;
      } catch {
        return "#VALUE!";
      }
    },

    updateDependencies: (cellKey: string, formula: string): boolean => {
      const state = get();
      const graph = state.dependencyGraph;

      // Remove old dependencies
      graph.removeDependencies(cellKey);

      const expr = formula.startsWith("=") ? formula.slice(1) : formula;

      try {
        const ast = parseFormula(expr);
        const refs = extractReferences(ast);

        for (const ref of refs) {
          if (ref.type === "cell") {
            const depId = cellId(ref.sheet, ref.col, ref.row);
            graph.addDependency(cellKey, depId);
          } else if (ref.type === "range") {
            // Add dependency on each cell in the range
            const startCol = Math.min(ref.start.col, ref.end.col);
            const endCol = Math.max(ref.start.col, ref.end.col);
            const startRow = Math.min(ref.start.row, ref.end.row);
            const endRow = Math.max(ref.start.row, ref.end.row);
            const sheet = ref.start.sheet;

            for (let row = startRow; row <= endRow; row++) {
              for (let col = startCol; col <= endCol; col++) {
                const depId = cellId(sheet, col, row);
                graph.addDependency(cellKey, depId);
              }
            }
          }
        }

        // Check for circular references
        if (graph.detectCircular(cellKey)) {
          graph.removeDependencies(cellKey);
          return false; // Circular reference detected
        }

        return true;
      } catch {
        return true; // Parse error, no deps to add
      }
    },

    recalculate: (
      changedCell: string,
      getFormula: (cellKey: string) => string | undefined,
      getCellValue: CellValueGetter,
    ): Map<string, FormulaValue> => {
      const state = get();
      const graph = state.dependencyGraph;
      const order = graph.getRecalculationOrder(changedCell);
      const results = new Map<string, FormulaValue>();

      for (const cell of order) {
        const formula = getFormula(cell);
        if (formula && formula.startsWith("=")) {
          const expr = formula.slice(1);
          try {
            const ast = parseFormula(expr);

            // Check for circular reference
            if (graph.detectCircular(cell)) {
              results.set(cell, "#REF!");
              state.formulaCache.set(cell, "#REF!");
              continue;
            }

            const result = evaluate(ast, getCellValue);
            results.set(cell, result);
            state.formulaCache.set(cell, result);
          } catch {
            const errVal: FormulaValue = "#VALUE!";
            results.set(cell, errVal);
            state.formulaCache.set(cell, errVal);
          }
        }
      }

      return results;
    },

    clearCache: (): void => {
      set((state) => {
        state.formulaCache.clear();
        state.astCache.clear();
      });
    },

    getSpillValue: (cellKey: string): FormulaValue | undefined => {
      const state = get();
      const sourceKey = state.spillTargets.get(cellKey);
      if (!sourceKey) return undefined;
      return state.formulaCache.get(cellKey);
    },

    isSpillTarget: (cellKey: string): boolean => {
      return get().spillTargets.has(cellKey);
    },

    getSpillSource: (cellKey: string): string | undefined => {
      return get().spillTargets.get(cellKey);
    },

    clearSpill: (sourceCellKey: string): void => {
      set((state) => {
        const spill = state.spillRanges.get(sourceCellKey);
        if (!spill) return;
        for (const target of spill.targets) {
          state.spillTargets.delete(target);
          state.formulaCache.delete(target);
        }
        state.spillRanges.delete(sourceCellKey);
      });
    },

    handleSpill: (
      sourceCellKey: string,
      sourceRow: number,
      sourceCol: number,
      result: FormulaValue,
      hasCellContent: (row: number, col: number) => boolean,
    ): FormulaValue => {
      const state = get();

      // Clear any previous spill from this source
      const oldSpill = state.spillRanges.get(sourceCellKey);
      if (oldSpill) {
        for (const target of oldSpill.targets) {
          state.spillTargets.delete(target);
          state.formulaCache.delete(target);
        }
        state.spillRanges.delete(sourceCellKey);
      }

      // Check if result is a 2D array that should spill
      if (!Array.isArray(result)) return result;
      const arr = result as unknown as FormulaValue[][];
      if (!Array.isArray(arr[0])) {
        // 1D array — treat as column spill
        const values = result as unknown as FormulaValue[];
        if (values.length <= 1) return values[0] ?? null;

        const targets: string[] = [];
        // Check for conflicts
        for (let r = 1; r < values.length; r++) {
          const targetRow = sourceRow + r;
          const targetKey = `${targetRow},${sourceCol}`;
          if (
            hasCellContent(targetRow, sourceCol) &&
            !state.spillTargets.has(targetKey)
          ) {
            return "#SPILL!";
          }
          targets.push(targetKey);
        }

        // Write spill values
        for (let r = 1; r < values.length; r++) {
          const targetKey = `${sourceRow + r},${sourceCol}`;
          state.spillTargets.set(targetKey, sourceCellKey);
          state.formulaCache.set(targetKey, values[r]);
        }

        state.spillRanges.set(sourceCellKey, {
          sourceRow,
          sourceCol,
          rows: values.length,
          cols: 1,
          targets,
        });

        return values[0];
      }

      // 2D array spill
      const rows = arr.length;
      const cols = arr[0]?.length ?? 0;
      if (rows <= 1 && cols <= 1) return arr[0]?.[0] ?? null;

      const targets: string[] = [];
      // Check for conflicts
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (r === 0 && c === 0) continue; // source cell
          const targetRow = sourceRow + r;
          const targetCol = sourceCol + c;
          const targetKey = `${targetRow},${targetCol}`;
          if (
            hasCellContent(targetRow, targetCol) &&
            !state.spillTargets.has(targetKey)
          ) {
            return "#SPILL!";
          }
          targets.push(targetKey);
        }
      }

      // Write spill values
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (r === 0 && c === 0) continue;
          const targetKey = `${sourceRow + r},${sourceCol + c}`;
          state.spillTargets.set(targetKey, sourceCellKey);
          state.formulaCache.set(targetKey, arr[r]?.[c] ?? null);
        }
      }

      state.spillRanges.set(sourceCellKey, {
        sourceRow,
        sourceCol,
        rows,
        cols,
        targets,
      });

      return arr[0]?.[0] ?? null;
    },
  })),
);
