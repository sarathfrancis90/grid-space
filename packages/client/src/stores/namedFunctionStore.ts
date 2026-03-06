import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { NamedFunction } from "../types/grid";

interface NamedFunctionState {
  functions: Map<string, NamedFunction>;

  addFunction: (fn: NamedFunction) => boolean;
  removeFunction: (name: string) => void;
  updateFunction: (
    name: string,
    updates: Partial<Omit<NamedFunction, "name">>,
  ) => void;
  getFunction: (name: string) => NamedFunction | undefined;
  getAllFunctions: () => NamedFunction[];
  hasFunction: (name: string) => boolean;
  renameFunction: (oldName: string, newName: string) => boolean;
}

function normalizeKey(name: string): string {
  return name.toUpperCase();
}

export const useNamedFunctionStore = create<NamedFunctionState>()(
  immer((set, get) => ({
    functions: new Map<string, NamedFunction>(),

    addFunction: (fn: NamedFunction): boolean => {
      const key = normalizeKey(fn.name);
      if (get().functions.has(key)) return false;
      set((state) => {
        state.functions.set(key, fn);
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
      updates: Partial<Omit<NamedFunction, "name">>,
    ) => {
      set((state) => {
        const key = normalizeKey(name);
        const existing = state.functions.get(key);
        if (!existing) return;
        if (updates.formula !== undefined) existing.formula = updates.formula;
        if (updates.description !== undefined)
          existing.description = updates.description;
        if (updates.args !== undefined) existing.args = updates.args;
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
      const oldKey = normalizeKey(oldName);
      const newKey = normalizeKey(newName);
      const state = get();
      const existing = state.functions.get(oldKey);
      if (!existing) return false;
      if (oldKey !== newKey && state.functions.has(newKey)) return false;
      set((draft) => {
        draft.functions.delete(oldKey);
        draft.functions.set(newKey, { ...existing, name: newName });
      });
      return true;
    },
  })),
);
