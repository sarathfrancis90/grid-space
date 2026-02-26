/**
 * Zustand store for formula engine state.
 * Manages parsing, evaluation, dependency tracking, and recalculation.
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ASTNode, FormulaValue, CellValueGetter } from "../types/formula";
import { parseFormula } from "../components/formula/parser";
import { evaluate, extractReferences } from "../components/formula/evaluator";
import { DependencyGraph } from "../components/formula/dependencyGraph";
import { cellId } from "../components/formula/cellUtils";

interface FormulaState {
  dependencyGraph: DependencyGraph;
  formulaCache: Map<string, FormulaValue>;
  astCache: Map<string, ASTNode>;
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
}

export const useFormulaStore = create<FormulaState & FormulaActions>()(
  immer((set, get) => ({
    dependencyGraph: new DependencyGraph(),
    formulaCache: new Map(),
    astCache: new Map(),

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
  })),
);
