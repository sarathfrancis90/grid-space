import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { NamedFunction, NamedFunctionArgument } from "../types/grid";

interface NamedFunctionState {
  functions: Map<string, NamedFunction>;

  addFunction: (fn: NamedFunction) => boolean;
  removeFunction: (name: string) => void;
  updateFunction: (
    name: string,
    updates: Partial<Omit<NamedFunction, "name" | "createdAt">>,
  ) => void;
  getFunction: (name: string) => NamedFunction | undefined;
  getAllFunctions: () => NamedFunction[];
  hasFunction: (name: string) => boolean;
  renameFunction: (oldName: string, newName: string) => boolean;
  importFunctions: (fns: NamedFunction[]) => void;
  exportFunctions: () => NamedFunction[];
  clearAll: () => void;
}

function normalizeKey(name: string): string {
  return name.toUpperCase();
}

const RESERVED_NAMES = new Set([
  "SUM",
  "AVERAGE",
  "COUNT",
  "COUNTA",
  "COUNTBLANK",
  "MIN",
  "MAX",
  "IF",
  "IFS",
  "SWITCH",
  "AND",
  "OR",
  "NOT",
  "XOR",
  "IFERROR",
  "IFNA",
  "VLOOKUP",
  "HLOOKUP",
  "INDEX",
  "MATCH",
  "INDIRECT",
  "OFFSET",
  "LET",
  "LAMBDA",
  "ARRAYFORMULA",
  "SPARKLINE",
  "IMAGE",
  "IMPORTDATA",
  "IMPORTRANGE",
  "CONCATENATE",
  "LEFT",
  "RIGHT",
  "MID",
  "LEN",
  "TRIM",
  "UPPER",
  "LOWER",
  "SUBSTITUTE",
  "FIND",
  "SEARCH",
  "TEXT",
  "VALUE",
  "ABS",
  "ROUND",
  "ROUNDUP",
  "ROUNDDOWN",
  "INT",
  "MOD",
  "POWER",
  "SQRT",
  "LOG",
  "LOG10",
  "LN",
  "EXP",
  "PI",
  "RAND",
  "RANDBETWEEN",
  "NOW",
  "TODAY",
  "DATE",
  "YEAR",
  "MONTH",
  "DAY",
  "HOUR",
  "MINUTE",
  "SECOND",
  "SUMIF",
  "COUNTIF",
  "AVERAGEIF",
  "SUMIFS",
  "COUNTIFS",
  "AVERAGEIFS",
  "SORT",
  "FILTER",
  "UNIQUE",
  "TRANSPOSE",
  "FLATTEN",
  "QUERY",
  "REGEXMATCH",
  "REGEXEXTRACT",
  "REGEXREPLACE",
  "__CALL__",
]);

function isValidFunctionName(name: string): boolean {
  if (!name || name.length === 0) return false;
  if (RESERVED_NAMES.has(name.toUpperCase())) return false;
  return /^[A-Za-z_][A-Za-z0-9_.]*$/.test(name);
}

export const useNamedFunctionStore = create<NamedFunctionState>()(
  immer((set, get) => ({
    functions: new Map<string, NamedFunction>(),

    addFunction: (fn: NamedFunction): boolean => {
      if (!isValidFunctionName(fn.name)) return false;
      const key = normalizeKey(fn.name);
      if (get().functions.has(key)) return false;

      set((state) => {
        state.functions.set(key, {
          ...fn,
          name: fn.name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });
      return true;
    },

    removeFunction: (name: string) => {
      set((state) => {
        state.functions.delete(normalizeKey(name));
      });
    },

    updateFunction: (
      name: string,
      updates: Partial<Omit<NamedFunction, "name" | "createdAt">>,
    ) => {
      set((state) => {
        const key = normalizeKey(name);
        const existing = state.functions.get(key);
        if (!existing) return;
        if (updates.formulaBody !== undefined)
          existing.formulaBody = updates.formulaBody;
        if (updates.description !== undefined)
          existing.description = updates.description;
        if (updates.arguments !== undefined)
          existing.arguments = updates.arguments;
        existing.updatedAt = Date.now();
      });
    },

    getFunction: (name: string) => {
      return get().functions.get(normalizeKey(name));
    },

    getAllFunctions: () => {
      return Array.from(get().functions.values());
    },

    hasFunction: (name: string) => {
      return get().functions.has(normalizeKey(name));
    },

    renameFunction: (oldName: string, newName: string): boolean => {
      if (!isValidFunctionName(newName)) return false;
      const oldKey = normalizeKey(oldName);
      const newKey = normalizeKey(newName);
      if (oldKey === newKey) return true;
      if (get().functions.has(newKey)) return false;

      set((state) => {
        const existing = state.functions.get(oldKey);
        if (!existing) return;
        state.functions.delete(oldKey);
        state.functions.set(newKey, {
          ...existing,
          name: newName,
          updatedAt: Date.now(),
        });
      });
      return true;
    },

    importFunctions: (fns: NamedFunction[]) => {
      set((state) => {
        for (const fn of fns) {
          if (isValidFunctionName(fn.name)) {
            state.functions.set(normalizeKey(fn.name), { ...fn });
          }
        }
      });
    },

    exportFunctions: () => {
      return Array.from(get().functions.values());
    },

    clearAll: () => {
      set((state) => {
        state.functions.clear();
      });
    },
  })),
);

export { isValidFunctionName };
export type { NamedFunctionArgument };
