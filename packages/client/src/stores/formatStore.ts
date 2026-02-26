/**
 * Format store — manages cell formatting, merge regions, paint format,
 * conditional formatting rules, and alternating row colors.
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  CellFormat,
  BorderStyle,
  BorderSide,
  MergedRegion,
  ConditionalRule,
} from "../types/grid";
import { useCellStore } from "./cellStore";
import { useUIStore } from "./uiStore";
import { useSpreadsheetStore } from "./spreadsheetStore";
import { getCellKey } from "../utils/coordinates";

interface FormatState {
  /** Merged regions per sheet */
  mergedRegions: Map<string, MergedRegion[]>;
  /** Conditional formatting rules per sheet */
  conditionalRules: Map<string, ConditionalRule[]>;
  /** Alternating row color configs per sheet: [evenColor, oddColor] */
  alternatingColors: Map<string, [string, string] | null>;
  /** Paint format mode */
  paintFormatMode: "off" | "single" | "persistent";
  /** Stored format for paint format */
  paintFormatSource: CellFormat | null;

  // --- Core format operations ---
  setFormat: (
    sheetId: string,
    row: number,
    col: number,
    format: Partial<CellFormat>,
  ) => void;
  getFormat: (
    sheetId: string,
    row: number,
    col: number,
  ) => CellFormat | undefined;
  setFormatForRange: (
    sheetId: string,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
    format: Partial<CellFormat>,
  ) => void;
  toggleFormatOnSelection: (
    prop: "bold" | "italic" | "underline" | "strikethrough",
  ) => void;
  setFormatOnSelection: (format: Partial<CellFormat>) => void;

  // --- Border operations ---
  setBordersOnSelection: (
    sides: ("top" | "right" | "bottom" | "left")[],
    border: BorderSide,
  ) => void;
  setBordersAllOnSelection: (border: BorderSide) => void;
  clearBordersOnSelection: () => void;

  // --- Merge operations ---
  mergeSelection: () => void;
  unmergeSelection: () => void;
  getMergedRegion: (
    sheetId: string,
    row: number,
    col: number,
  ) => MergedRegion | undefined;
  getMergedRegions: (sheetId: string) => MergedRegion[];

  // --- Paint format ---
  startPaintFormat: (persistent: boolean) => void;
  applyPaintFormat: (sheetId: string, row: number, col: number) => void;
  cancelPaintFormat: () => void;

  // --- Clear formatting ---
  clearFormattingOnSelection: () => void;

  // --- Indent ---
  increaseIndent: () => void;
  decreaseIndent: () => void;

  // --- Alternating colors ---
  setAlternatingColors: (
    sheetId: string,
    colors: [string, string] | null,
  ) => void;
  getAlternatingColors: (sheetId: string) => [string, string] | null;

  // --- Conditional formatting ---
  addConditionalRule: (sheetId: string, rule: ConditionalRule) => void;
  removeConditionalRule: (sheetId: string, ruleId: string) => void;
  updateConditionalRule: (
    sheetId: string,
    ruleId: string,
    updates: Partial<ConditionalRule>,
  ) => void;
  reorderConditionalRules: (sheetId: string, ruleIds: string[]) => void;
  getConditionalRules: (sheetId: string) => ConditionalRule[];
  evaluateConditionalFormat: (
    sheetId: string,
    row: number,
    col: number,
    value: string | number | boolean | null,
  ) => Partial<CellFormat> | null;
}

export const useFormatStore = create<FormatState>()(
  immer((set, get) => ({
    mergedRegions: new Map(),
    conditionalRules: new Map(),
    alternatingColors: new Map(),
    paintFormatMode: "off" as const,
    paintFormatSource: null,

    setFormat: (sheetId, row, col, format) => {
      const cellStore = useCellStore.getState();
      const key = getCellKey(row, col);
      const sheetCells = cellStore.cells.get(sheetId);
      const existing = sheetCells?.get(key);
      const currentFormat = existing?.format ?? {};
      const merged = { ...currentFormat, ...format };
      cellStore.setCell(sheetId, row, col, {
        value: existing?.value ?? null,
        formula: existing?.formula,
        format: merged,
        comment: existing?.comment,
      });
    },

    getFormat: (sheetId, row, col) => {
      return useCellStore.getState().getCell(sheetId, row, col)?.format;
    },

    setFormatForRange: (
      sheetId,
      startRow,
      startCol,
      endRow,
      endCol,
      format,
    ) => {
      const minR = Math.min(startRow, endRow);
      const maxR = Math.max(startRow, endRow);
      const minC = Math.min(startCol, endCol);
      const maxC = Math.max(startCol, endCol);
      const cellStore = useCellStore.getState();
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const key = getCellKey(r, c);
          const sheetCells = cellStore.cells.get(sheetId);
          const existing = sheetCells?.get(key);
          const currentFormat = existing?.format ?? {};
          const merged = { ...currentFormat, ...format };
          cellStore.setCell(sheetId, r, c, {
            value: existing?.value ?? null,
            formula: existing?.formula,
            format: merged,
            comment: existing?.comment,
          });
        }
      }
    },

    toggleFormatOnSelection: (prop) => {
      const ui = useUIStore.getState();
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      if (!sheetId || ui.selections.length === 0) return;
      const sel = ui.selections[ui.selections.length - 1];
      const minR = Math.min(sel.start.row, sel.end.row);
      const minC = Math.min(sel.start.col, sel.end.col);
      const cellStore = useCellStore.getState();
      const firstCell = cellStore.getCell(sheetId, minR, minC);
      const newValue = !(firstCell?.format?.[prop] ?? false);
      get().setFormatForRange(
        sheetId,
        sel.start.row,
        sel.start.col,
        sel.end.row,
        sel.end.col,
        { [prop]: newValue },
      );
    },

    setFormatOnSelection: (format) => {
      const ui = useUIStore.getState();
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      if (!sheetId || ui.selections.length === 0) return;
      const sel = ui.selections[ui.selections.length - 1];
      get().setFormatForRange(
        sheetId,
        sel.start.row,
        sel.start.col,
        sel.end.row,
        sel.end.col,
        format,
      );
    },

    // --- Borders ---
    setBordersOnSelection: (sides, border) => {
      const ui = useUIStore.getState();
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      if (!sheetId || ui.selections.length === 0) return;
      const sel = ui.selections[ui.selections.length - 1];
      const minR = Math.min(sel.start.row, sel.end.row);
      const maxR = Math.max(sel.start.row, sel.end.row);
      const minC = Math.min(sel.start.col, sel.end.col);
      const maxC = Math.max(sel.start.col, sel.end.col);
      const store = get();
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const existing = store.getFormat(sheetId, r, c)?.borders ?? {};
          const newBorders: BorderStyle = { ...existing };
          for (const side of sides) {
            newBorders[side] = border;
          }
          store.setFormat(sheetId, r, c, { borders: newBorders });
        }
      }
    },

    setBordersAllOnSelection: (border) => {
      get().setBordersOnSelection(["top", "right", "bottom", "left"], border);
    },

    clearBordersOnSelection: () => {
      const ui = useUIStore.getState();
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      if (!sheetId || ui.selections.length === 0) return;
      const sel = ui.selections[ui.selections.length - 1];
      get().setFormatForRange(
        sheetId,
        sel.start.row,
        sel.start.col,
        sel.end.row,
        sel.end.col,
        { borders: undefined },
      );
    },

    // --- Merge ---
    mergeSelection: () => {
      const ui = useUIStore.getState();
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      if (!sheetId || ui.selections.length === 0) return;
      const sel = ui.selections[ui.selections.length - 1];
      const sR = Math.min(sel.start.row, sel.end.row);
      const eR = Math.max(sel.start.row, sel.end.row);
      const sC = Math.min(sel.start.col, sel.end.col);
      const eC = Math.max(sel.start.col, sel.end.col);
      if (sR === eR && sC === eC) return; // single cell, nothing to merge

      // Clear values in non-top-left cells
      const cellStore = useCellStore.getState();
      for (let r = sR; r <= eR; r++) {
        for (let c = sC; c <= eC; c++) {
          if (r === sR && c === sC) continue;
          cellStore.deleteCell(sheetId, r, c);
        }
      }

      set((state) => {
        if (!state.mergedRegions.has(sheetId)) {
          state.mergedRegions.set(sheetId, []);
        }
        const regions = state.mergedRegions.get(sheetId)!;
        // Remove any overlapping merge regions
        const filtered = regions.filter(
          (m) =>
            m.endRow < sR ||
            m.startRow > eR ||
            m.endCol < sC ||
            m.startCol > eC,
        );
        filtered.push({ startRow: sR, startCol: sC, endRow: eR, endCol: eC });
        state.mergedRegions.set(sheetId, filtered);
      });
    },

    unmergeSelection: () => {
      const ui = useUIStore.getState();
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      if (!sheetId || ui.selections.length === 0) return;
      const sel = ui.selections[ui.selections.length - 1];
      const sR = Math.min(sel.start.row, sel.end.row);
      const eR = Math.max(sel.start.row, sel.end.row);
      const sC = Math.min(sel.start.col, sel.end.col);
      const eC = Math.max(sel.start.col, sel.end.col);
      set((state) => {
        const regions = state.mergedRegions.get(sheetId);
        if (!regions) return;
        state.mergedRegions.set(
          sheetId,
          regions.filter(
            (m) =>
              m.endRow < sR ||
              m.startRow > eR ||
              m.endCol < sC ||
              m.startCol > eC,
          ),
        );
      });
    },

    getMergedRegion: (sheetId, row, col) => {
      const regions = get().mergedRegions.get(sheetId);
      if (!regions) return undefined;
      return regions.find(
        (m) =>
          row >= m.startRow &&
          row <= m.endRow &&
          col >= m.startCol &&
          col <= m.endCol,
      );
    },

    getMergedRegions: (sheetId) => {
      return get().mergedRegions.get(sheetId) ?? [];
    },

    // --- Paint Format ---
    startPaintFormat: (persistent) => {
      const ui = useUIStore.getState();
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      if (!sheetId || !ui.selectedCell) return;
      const cellStore = useCellStore.getState();
      const sourceCell = cellStore.getCell(
        sheetId,
        ui.selectedCell.row,
        ui.selectedCell.col,
      );
      set((state) => {
        state.paintFormatMode = persistent ? "persistent" : "single";
        state.paintFormatSource = sourceCell?.format
          ? { ...sourceCell.format }
          : {};
      });
    },

    applyPaintFormat: (sheetId, row, col) => {
      const state = get();
      if (state.paintFormatMode === "off" || !state.paintFormatSource) return;
      const store = get();
      store.setFormat(sheetId, row, col, state.paintFormatSource);
      if (state.paintFormatMode === "single") {
        set((s) => {
          s.paintFormatMode = "off";
          s.paintFormatSource = null;
        });
      }
    },

    cancelPaintFormat: () => {
      set((state) => {
        state.paintFormatMode = "off";
        state.paintFormatSource = null;
      });
    },

    // --- Clear Formatting ---
    clearFormattingOnSelection: () => {
      const ui = useUIStore.getState();
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      if (!sheetId || ui.selections.length === 0) return;
      const sel = ui.selections[ui.selections.length - 1];
      const minR = Math.min(sel.start.row, sel.end.row);
      const maxR = Math.max(sel.start.row, sel.end.row);
      const minC = Math.min(sel.start.col, sel.end.col);
      const maxC = Math.max(sel.start.col, sel.end.col);
      const cellStore = useCellStore.getState();
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const existing = cellStore.getCell(sheetId, r, c);
          if (existing) {
            cellStore.setCell(sheetId, r, c, {
              value: existing.value,
              formula: existing.formula,
              format: undefined,
              comment: existing.comment,
            });
          }
        }
      }
    },

    // --- Indent ---
    increaseIndent: () => {
      const ui = useUIStore.getState();
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      if (!sheetId || ui.selections.length === 0) return;
      const sel = ui.selections[ui.selections.length - 1];
      const minR = Math.min(sel.start.row, sel.end.row);
      const maxR = Math.max(sel.start.row, sel.end.row);
      const minC = Math.min(sel.start.col, sel.end.col);
      const maxC = Math.max(sel.start.col, sel.end.col);
      const store = get();
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const current = store.getFormat(sheetId, r, c)?.indent ?? 0;
          store.setFormat(sheetId, r, c, {
            indent: Math.min(current + 1, 10),
          });
        }
      }
    },

    decreaseIndent: () => {
      const ui = useUIStore.getState();
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      if (!sheetId || ui.selections.length === 0) return;
      const sel = ui.selections[ui.selections.length - 1];
      const minR = Math.min(sel.start.row, sel.end.row);
      const maxR = Math.max(sel.start.row, sel.end.row);
      const minC = Math.min(sel.start.col, sel.end.col);
      const maxC = Math.max(sel.start.col, sel.end.col);
      const store = get();
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const current = store.getFormat(sheetId, r, c)?.indent ?? 0;
          store.setFormat(sheetId, r, c, {
            indent: Math.max(current - 1, 0),
          });
        }
      }
    },

    // --- Alternating Colors ---
    setAlternatingColors: (sheetId, colors) => {
      set((state) => {
        state.alternatingColors.set(sheetId, colors);
      });
    },

    getAlternatingColors: (sheetId) => {
      return get().alternatingColors.get(sheetId) ?? null;
    },

    // --- Conditional Formatting ---
    addConditionalRule: (sheetId, rule) => {
      set((state) => {
        if (!state.conditionalRules.has(sheetId)) {
          state.conditionalRules.set(sheetId, []);
        }
        state.conditionalRules.get(sheetId)!.push(rule);
      });
    },

    removeConditionalRule: (sheetId, ruleId) => {
      set((state) => {
        const rules = state.conditionalRules.get(sheetId);
        if (!rules) return;
        state.conditionalRules.set(
          sheetId,
          rules.filter((r) => r.id !== ruleId),
        );
      });
    },

    updateConditionalRule: (sheetId, ruleId, updates) => {
      set((state) => {
        const rules = state.conditionalRules.get(sheetId);
        if (!rules) return;
        const rule = rules.find((r) => r.id === ruleId);
        if (!rule) return;
        Object.assign(rule, updates);
      });
    },

    reorderConditionalRules: (sheetId, ruleIds) => {
      set((state) => {
        const rules = state.conditionalRules.get(sheetId);
        if (!rules) return;
        const ordered: ConditionalRule[] = [];
        for (let i = 0; i < ruleIds.length; i++) {
          const rule = rules.find((r) => r.id === ruleIds[i]);
          if (rule) {
            rule.priority = i;
            ordered.push(rule);
          }
        }
        // Add any rules not in the ruleIds list at the end
        for (const rule of rules) {
          if (!ruleIds.includes(rule.id)) {
            rule.priority = ordered.length;
            ordered.push(rule);
          }
        }
        state.conditionalRules.set(sheetId, ordered);
      });
    },

    getConditionalRules: (sheetId) => {
      return get().conditionalRules.get(sheetId) ?? [];
    },

    evaluateConditionalFormat: (sheetId, row, col, value) => {
      const rules = get().conditionalRules.get(sheetId);
      if (!rules || rules.length === 0) return null;
      const sorted = [...rules].sort((a, b) => a.priority - b.priority);
      for (const rule of sorted) {
        const { range: rng } = rule;
        if (
          row < rng.startRow ||
          row > rng.endRow ||
          col < rng.startCol ||
          col > rng.endCol
        )
          continue;
        if (matchesRule(rule, value)) return rule.format;
      }
      return null;
    },
  })),
);

function matchesRule(
  rule: ConditionalRule,
  value: string | number | boolean | null,
): boolean {
  const numVal = typeof value === "number" ? value : Number(value);
  const strVal = String(value ?? "").toLowerCase();

  if (rule.type === "value") {
    const threshold = Number(rule.values[0] ?? 0);
    const threshold2 = Number(rule.values[1] ?? 0);
    switch (rule.condition) {
      case "greaterThan":
        return !isNaN(numVal) && numVal > threshold;
      case "lessThan":
        return !isNaN(numVal) && numVal < threshold;
      case "equalTo":
        return !isNaN(numVal) && numVal === threshold;
      case "between":
        return !isNaN(numVal) && numVal >= threshold && numVal <= threshold2;
      case "notBetween":
        return !isNaN(numVal) && (numVal < threshold || numVal > threshold2);
      default:
        return false;
    }
  }

  if (rule.type === "text") {
    const target = (rule.values[0] ?? "").toLowerCase();
    switch (rule.condition) {
      case "contains":
        return strVal.includes(target);
      case "notContains":
        return !strVal.includes(target);
      case "startsWith":
        return strVal.startsWith(target);
      case "endsWith":
        return strVal.endsWith(target);
      case "exactMatch":
        return strVal === target;
      default:
        return false;
    }
  }

  // S6-019: is blank / not blank
  if (rule.type === "blank") {
    const isEmpty =
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "");
    return rule.condition === "isBlank" ? isEmpty : !isEmpty;
  }

  // S6-020: date conditions (today, yesterday, tomorrow, lastWeek, thisWeek, nextWeek)
  if (rule.type === "date") {
    return matchesDateRule(rule.condition, value);
  }

  // S6-021: custom formula rule — the formula field contains a formula string
  // For now, we evaluate simple comparisons against the cell value
  if (rule.type === "customFormula") {
    return matchesCustomFormula(rule.formula ?? "", value);
  }

  // colorScale is applied by the renderer, not matched per-rule
  return false;
}

/** S6-020: Check if a cell value matches a date condition */
function matchesDateRule(
  condition: string,
  value: string | number | boolean | null,
): boolean {
  if (value === null || value === undefined) return false;

  let cellDay: Date;
  if (typeof value === "number") {
    const d = new Date(value);
    cellDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  } else if (typeof value === "string") {
    // Parse YYYY-MM-DD as local date to avoid timezone issues
    const ymdMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) {
      cellDay = new Date(
        parseInt(ymdMatch[1], 10),
        parseInt(ymdMatch[2], 10) - 1,
        parseInt(ymdMatch[3], 10),
      );
    } else {
      const parsed = Date.parse(value);
      if (isNaN(parsed)) return false;
      const d = new Date(parsed);
      cellDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
  } else {
    return false;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round(
    (cellDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  switch (condition) {
    case "today":
      return diffDays === 0;
    case "yesterday":
      return diffDays === -1;
    case "tomorrow":
      return diffDays === 1;
    case "lastWeek":
      return diffDays >= -7 && diffDays < 0;
    case "thisWeek": {
      const dayOfWeek = today.getDay();
      const startOfWeek = -dayOfWeek;
      const endOfWeek = 6 - dayOfWeek;
      return diffDays >= startOfWeek && diffDays <= endOfWeek;
    }
    case "nextWeek": {
      const dow = today.getDay();
      const nextWeekStart = 7 - dow;
      const nextWeekEnd = 13 - dow;
      return diffDays >= nextWeekStart && diffDays <= nextWeekEnd;
    }
    case "pastMonth":
      return diffDays >= -30 && diffDays <= 0;
    default:
      return false;
  }
}

/** S6-021: Evaluate a custom formula rule against a cell value */
function matchesCustomFormula(
  formula: string,
  value: string | number | boolean | null,
): boolean {
  if (!formula) return false;

  // Simple evaluation: if the formula is a comparison like ">10", "<5", ">=100", etc.
  const compMatch = formula.match(/^(>=|<=|<>|!=|>|<|=)\s*(-?\d+(?:\.\d+)?)$/);
  if (compMatch) {
    const op = compMatch[1];
    const threshold = Number(compMatch[2]);
    const numVal = typeof value === "number" ? value : Number(value);
    if (isNaN(numVal)) return false;
    switch (op) {
      case ">":
        return numVal > threshold;
      case "<":
        return numVal < threshold;
      case ">=":
        return numVal >= threshold;
      case "<=":
        return numVal <= threshold;
      case "=":
        return numVal === threshold;
      case "<>":
      case "!=":
        return numVal !== threshold;
      default:
        return false;
    }
  }

  // If formula is "TRUE" or "FALSE" literal
  if (formula.toUpperCase() === "TRUE") return true;
  if (formula.toUpperCase() === "FALSE") return false;

  // Default: the formula doesn't match a recognized pattern
  return false;
}

/** Evaluate a color scale rule and return a background color. */
export function evaluateColorScale(
  rule: ConditionalRule,
  value: number,
  minVal: number,
  maxVal: number,
): string | null {
  if (rule.type !== "colorScale") return null;
  if (maxVal === minVal) return rule.values[0] ?? null;
  const ratio = (value - minVal) / (maxVal - minVal);

  if (rule.values.length === 2) {
    return interpolateColor(rule.values[0], rule.values[1], ratio);
  }
  if (rule.values.length === 3) {
    if (ratio <= 0.5) {
      return interpolateColor(rule.values[0], rule.values[1], ratio * 2);
    }
    return interpolateColor(rule.values[1], rule.values[2], (ratio - 0.5) * 2);
  }
  return null;
}

function interpolateColor(c1: string, c2: string, ratio: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
