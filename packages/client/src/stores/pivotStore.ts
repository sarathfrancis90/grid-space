import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  PivotConfig,
  PivotAggregation,
  PivotFieldConfig,
  PivotValueConfig,
  PivotFilterConfig,
  CellData,
} from "../types/grid";
import { getCellKey } from "../utils/coordinates";

interface PivotState {
  pivots: Map<string, PivotConfig>;
  editorOpen: boolean;
  editingPivotId: string | null;

  createPivot: (config: PivotConfig) => void;
  removePivot: (id: string) => void;
  updatePivot: (id: string, updates: Partial<PivotConfig>) => void;
  getPivot: (id: string) => PivotConfig | undefined;
  getAllPivots: () => PivotConfig[];

  openEditor: (pivotId: string) => void;
  closeEditor: () => void;

  setRowFields: (pivotId: string, fields: PivotFieldConfig[]) => void;
  setColFields: (pivotId: string, fields: PivotFieldConfig[]) => void;
  setValueFields: (pivotId: string, fields: PivotValueConfig[]) => void;
  setFilters: (pivotId: string, filters: PivotFilterConfig[]) => void;

  computePivot: (
    config: PivotConfig,
    sourceCells: Map<string, CellData>,
  ) => Map<string, CellData>;
}

function aggregate(values: number[], agg: PivotAggregation): number {
  if (values.length === 0) return 0;
  switch (agg) {
    case "SUM":
      return values.reduce((a, b) => a + b, 0);
    case "COUNT":
      return values.length;
    case "AVERAGE":
      return values.reduce((a, b) => a + b, 0) / values.length;
    case "MIN":
      return Math.min(...values);
    case "MAX":
      return Math.max(...values);
    default:
      return 0;
  }
}

export const usePivotStore = create<PivotState>()(
  immer((set, get) => ({
    pivots: new Map<string, PivotConfig>(),
    editorOpen: false,
    editingPivotId: null,

    createPivot: (config: PivotConfig) => {
      set((state) => {
        state.pivots.set(config.id, config);
      });
    },

    removePivot: (id: string) => {
      set((state) => {
        state.pivots.delete(id);
      });
    },

    updatePivot: (id: string, updates: Partial<PivotConfig>) => {
      set((state) => {
        const existing = state.pivots.get(id);
        if (!existing) return;
        Object.assign(existing, updates);
      });
    },

    getPivot: (id: string) => {
      return get().pivots.get(id);
    },

    getAllPivots: () => {
      return Array.from(get().pivots.values());
    },

    openEditor: (pivotId: string) => {
      set((state) => {
        state.editorOpen = true;
        state.editingPivotId = pivotId;
      });
    },

    closeEditor: () => {
      set((state) => {
        state.editorOpen = false;
        state.editingPivotId = null;
      });
    },

    setRowFields: (pivotId: string, fields: PivotFieldConfig[]) => {
      set((state) => {
        const pivot = state.pivots.get(pivotId);
        if (pivot) pivot.rowFields = fields;
      });
    },

    setColFields: (pivotId: string, fields: PivotFieldConfig[]) => {
      set((state) => {
        const pivot = state.pivots.get(pivotId);
        if (pivot) pivot.colFields = fields;
      });
    },

    setValueFields: (pivotId: string, fields: PivotValueConfig[]) => {
      set((state) => {
        const pivot = state.pivots.get(pivotId);
        if (pivot) pivot.valueFields = fields;
      });
    },

    setFilters: (pivotId: string, filters: PivotFilterConfig[]) => {
      set((state) => {
        const pivot = state.pivots.get(pivotId);
        if (pivot) pivot.filters = filters;
      });
    },

    computePivot: (config: PivotConfig, sourceCells: Map<string, CellData>) => {
      const result = new Map<string, CellData>();
      const { sourceRange, rowFields, colFields, valueFields, filters } =
        config;

      const startRow = Math.min(sourceRange.start.row, sourceRange.end.row);
      const endRow = Math.max(sourceRange.start.row, sourceRange.end.row);
      const startCol = Math.min(sourceRange.start.col, sourceRange.end.col);
      const endCol = Math.max(sourceRange.start.col, sourceRange.end.col);

      // Extract headers from first row
      const headers = new Map<number, string>();
      for (let c = startCol; c <= endCol; c++) {
        const cell = sourceCells.get(getCellKey(startRow, c));
        headers.set(c, cell?.value != null ? String(cell.value) : `Col${c}`);
      }

      // Build data rows (skip header row)
      type DataRow = Map<number, string | number | boolean | null>;
      const dataRows: DataRow[] = [];
      for (let r = startRow + 1; r <= endRow; r++) {
        // Apply filters
        let passesFilter = true;
        for (const filter of filters) {
          const cell = sourceCells.get(getCellKey(r, filter.col));
          const val = cell?.value != null ? String(cell.value) : "";
          if (!filter.allowedValues.has(val)) {
            passesFilter = false;
            break;
          }
        }
        if (!passesFilter) continue;

        const row: DataRow = new Map();
        for (let c = startCol; c <= endCol; c++) {
          const cell = sourceCells.get(getCellKey(r, c));
          row.set(c, cell?.value ?? null);
        }
        dataRows.push(row);
      }

      // Group by row fields
      const groups = new Map<string, DataRow[]>();
      for (const row of dataRows) {
        const rowKey = rowFields
          .map((f) => {
            const v = row.get(f.col);
            return v != null ? String(v) : "";
          })
          .join("|||");
        if (!groups.has(rowKey)) {
          groups.set(rowKey, []);
        }
        groups.get(rowKey)!.push(row);
      }

      // Build output
      let outRow = 0;

      // Header row: row field labels + value field labels (or col field combos)
      if (colFields.length === 0) {
        let outCol = 0;
        for (const rf of rowFields) {
          result.set(getCellKey(outRow, outCol), { value: rf.label });
          outCol++;
        }
        for (const vf of valueFields) {
          result.set(getCellKey(outRow, outCol), {
            value: `${vf.label} (${vf.aggregation})`,
          });
          outCol++;
        }
        outRow++;

        // Data rows
        for (const [key, rows] of groups) {
          let outCol2 = 0;
          const keyParts = key.split("|||");
          for (const part of keyParts) {
            result.set(getCellKey(outRow, outCol2), { value: part });
            outCol2++;
          }
          for (const vf of valueFields) {
            const values = rows
              .map((r) => {
                const v = r.get(vf.col);
                return v != null ? Number(v) : NaN;
              })
              .filter((v) => !isNaN(v));
            const agg = aggregate(values, vf.aggregation);
            result.set(getCellKey(outRow, outCol2), { value: agg });
            outCol2++;
          }
          outRow++;
        }
      } else {
        // With column fields — build crosstab
        const colGroups = new Map<string, DataRow[]>();
        for (const row of dataRows) {
          const colKey = colFields
            .map((f) => {
              const v = row.get(f.col);
              return v != null ? String(v) : "";
            })
            .join("|||");
          if (!colGroups.has(colKey)) {
            colGroups.set(colKey, []);
          }
          colGroups.get(colKey)!.push(row);
        }
        const colKeys = Array.from(colGroups.keys()).sort();

        // Header
        let outCol = 0;
        for (const rf of rowFields) {
          result.set(getCellKey(outRow, outCol), { value: rf.label });
          outCol++;
        }
        for (const ck of colKeys) {
          for (const vf of valueFields) {
            result.set(getCellKey(outRow, outCol), {
              value: `${ck} - ${vf.label}`,
            });
            outCol++;
          }
        }
        outRow++;

        // Data
        for (const [rowKey, rowData] of groups) {
          let outCol2 = 0;
          const keyParts = rowKey.split("|||");
          for (const part of keyParts) {
            result.set(getCellKey(outRow, outCol2), { value: part });
            outCol2++;
          }
          for (const ck of colKeys) {
            for (const vf of valueFields) {
              const matchingRows = rowData.filter((r) => {
                const rColKey = colFields
                  .map((f) => {
                    const v = r.get(f.col);
                    return v != null ? String(v) : "";
                  })
                  .join("|||");
                return rColKey === ck;
              });
              const values = matchingRows
                .map((r) => {
                  const v = r.get(vf.col);
                  return v != null ? Number(v) : NaN;
                })
                .filter((v) => !isNaN(v));
              const agg = aggregate(values, vf.aggregation);
              result.set(getCellKey(outRow, outCol2), { value: agg });
              outCol2++;
            }
          }
          outRow++;
        }
      }

      return result;
    },
  })),
);

export { aggregate };
