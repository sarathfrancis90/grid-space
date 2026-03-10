import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { FilterViewConfig, ColumnFilter } from "../types/grid";

interface FilterViewState {
  /** All saved filter views, keyed by sheetId */
  filterViews: Map<string, FilterViewConfig[]>;
  /** Currently active filter view id per sheet */
  activeFilterViewId: Map<string, string>;

  /** Create a new filter view for a sheet */
  createFilterView: (
    sheetId: string,
    name: string,
    columnFilters: ColumnFilter[],
  ) => string;
  /** Update an existing filter view */
  updateFilterView: (
    sheetId: string,
    viewId: string,
    updates: { name?: string; columnFilters?: ColumnFilter[] },
  ) => void;
  /** Delete a filter view */
  deleteFilterView: (sheetId: string, viewId: string) => void;
  /** Activate a filter view (apply its filters) */
  activateFilterView: (sheetId: string, viewId: string) => void;
  /** Deactivate the current filter view */
  deactivateFilterView: (sheetId: string) => void;
  /** Get all filter views for a sheet */
  getFilterViews: (sheetId: string) => FilterViewConfig[];
  /** Get the active filter view for a sheet */
  getActiveFilterView: (sheetId: string) => FilterViewConfig | null;
  /** Rename a filter view */
  renameFilterView: (sheetId: string, viewId: string, name: string) => void;
}

let nextId = 1;
function generateId(): string {
  return `fv_${Date.now()}_${nextId++}`;
}

export const useFilterViewStore = create<FilterViewState>()(
  immer((set, get) => ({
    filterViews: new Map<string, FilterViewConfig[]>(),
    activeFilterViewId: new Map<string, string>(),

    createFilterView: (
      sheetId: string,
      name: string,
      columnFilters: ColumnFilter[],
    ) => {
      const id = generateId();
      const now = Date.now();
      const view: FilterViewConfig = {
        id,
        name,
        sheetId,
        columnFilters,
        createdAt: now,
        updatedAt: now,
      };
      set((state) => {
        if (!state.filterViews.has(sheetId)) {
          state.filterViews.set(sheetId, []);
        }
        state.filterViews.get(sheetId)!.push(view);
      });
      return id;
    },

    updateFilterView: (
      sheetId: string,
      viewId: string,
      updates: { name?: string; columnFilters?: ColumnFilter[] },
    ) => {
      set((state) => {
        const views = state.filterViews.get(sheetId);
        if (!views) return;
        const idx = views.findIndex((v) => v.id === viewId);
        if (idx < 0) return;
        if (updates.name !== undefined) {
          views[idx].name = updates.name;
        }
        if (updates.columnFilters !== undefined) {
          views[idx].columnFilters = updates.columnFilters;
        }
        views[idx].updatedAt = Date.now();
      });
    },

    deleteFilterView: (sheetId: string, viewId: string) => {
      set((state) => {
        const views = state.filterViews.get(sheetId);
        if (!views) return;
        const idx = views.findIndex((v) => v.id === viewId);
        if (idx >= 0) {
          views.splice(idx, 1);
        }
        if (state.activeFilterViewId.get(sheetId) === viewId) {
          state.activeFilterViewId.delete(sheetId);
        }
      });
    },

    activateFilterView: (sheetId: string, viewId: string) => {
      set((state) => {
        state.activeFilterViewId.set(sheetId, viewId);
      });
    },

    deactivateFilterView: (sheetId: string) => {
      set((state) => {
        state.activeFilterViewId.delete(sheetId);
      });
    },

    getFilterViews: (sheetId: string) => {
      return get().filterViews.get(sheetId) ?? [];
    },

    getActiveFilterView: (sheetId: string) => {
      const activeId = get().activeFilterViewId.get(sheetId);
      if (!activeId) return null;
      const views = get().filterViews.get(sheetId);
      if (!views) return null;
      return views.find((v) => v.id === activeId) ?? null;
    },

    renameFilterView: (sheetId: string, viewId: string, name: string) => {
      set((state) => {
        const views = state.filterViews.get(sheetId);
        if (!views) return;
        const idx = views.findIndex((v) => v.id === viewId);
        if (idx >= 0) {
          views[idx].name = name;
          views[idx].updatedAt = Date.now();
        }
      });
    },
  })),
);
