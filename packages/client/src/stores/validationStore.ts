import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ValidationRule } from "../types/grid";
import { getCellKey } from "../utils/coordinates";

export interface ValidationResult {
  valid: boolean;
  message?: string;
  isWarning?: boolean;
}

interface ValidationState {
  // Map<sheetId, Map<cellKey, ValidationRule>>
  rules: Map<string, Map<string, ValidationRule>>;

  setRule: (
    sheetId: string,
    row: number,
    col: number,
    rule: ValidationRule,
  ) => void;
  removeRule: (sheetId: string, row: number, col: number) => void;
  getRule: (
    sheetId: string,
    row: number,
    col: number,
  ) => ValidationRule | undefined;
  clearRules: (sheetId: string) => void;
  resolveListFromRange: (rangeStr: string) => string[];

  validate: (
    sheetId: string,
    row: number,
    col: number,
    value: string | number | boolean | null,
  ) => ValidationResult;
}

function validateValue(
  rule: ValidationRule,
  value: string | number | boolean | null,
  resolvedListValues?: string[],
): ValidationResult {
  const isWarning = rule.mode === "warning";

  const fail = (message: string): ValidationResult => ({
    valid: false,
    message,
    isWarning,
  });

  if (value == null || value === "") {
    if (rule.allowBlank !== false) return { valid: true };
    return fail(rule.errorMessage ?? "This field cannot be blank");
  }

  switch (rule.type) {
    case "number-range": {
      const num = Number(value);
      if (isNaN(num)) {
        return fail(rule.errorMessage ?? "Value must be a number");
      }
      if (rule.min != null && num < rule.min) {
        return fail(rule.errorMessage ?? `Value must be at least ${rule.min}`);
      }
      if (rule.max != null && num > rule.max) {
        return fail(rule.errorMessage ?? `Value must be at most ${rule.max}`);
      }
      return { valid: true };
    }

    case "whole-number": {
      const num = Number(value);
      if (isNaN(num) || !Number.isInteger(num)) {
        return fail(rule.errorMessage ?? "Value must be a whole number");
      }
      if (rule.min != null && num < rule.min) {
        return fail(rule.errorMessage ?? `Value must be at least ${rule.min}`);
      }
      if (rule.max != null && num > rule.max) {
        return fail(rule.errorMessage ?? `Value must be at most ${rule.max}`);
      }
      return { valid: true };
    }

    case "text-length": {
      const len = String(value).length;
      if (rule.min != null && len < rule.min) {
        return fail(
          rule.errorMessage ?? `Text must be at least ${rule.min} characters`,
        );
      }
      if (rule.max != null && len > rule.max) {
        return fail(
          rule.errorMessage ?? `Text must be at most ${rule.max} characters`,
        );
      }
      return { valid: true };
    }

    case "date-range": {
      const dateVal = new Date(String(value));
      if (isNaN(dateVal.getTime())) {
        return fail(rule.errorMessage ?? "Value must be a valid date");
      }
      if (rule.minDate) {
        const minD = new Date(rule.minDate);
        if (dateVal < minD) {
          return fail(
            rule.errorMessage ?? `Date must be on or after ${rule.minDate}`,
          );
        }
      }
      if (rule.maxDate) {
        const maxD = new Date(rule.maxDate);
        if (dateVal > maxD) {
          return fail(
            rule.errorMessage ?? `Date must be on or before ${rule.maxDate}`,
          );
        }
      }
      return { valid: true };
    }

    case "dropdown-list": {
      if (!rule.listValues) return { valid: true };
      const strVal = String(value);
      if (!rule.listValues.includes(strVal)) {
        return fail(
          rule.errorMessage ??
            `Value must be one of: ${rule.listValues.join(", ")}`,
        );
      }
      return { valid: true };
    }

    case "list-from-range": {
      const allowedValues = resolvedListValues ?? [];
      if (allowedValues.length === 0) return { valid: true };
      const strVal = String(value);
      if (!allowedValues.includes(strVal)) {
        return fail(
          rule.errorMessage ??
            `Value must be one of: ${allowedValues.join(", ")}`,
        );
      }
      return { valid: true };
    }

    case "checkbox": {
      const strVal = String(value).toLowerCase();
      if (strVal !== "true" && strVal !== "false") {
        return fail(rule.errorMessage ?? "Value must be TRUE or FALSE");
      }
      return { valid: true };
    }

    case "email": {
      const emailStr = String(value);
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(emailStr)) {
        return fail(rule.errorMessage ?? "Value must be a valid email address");
      }
      return { valid: true };
    }

    case "url": {
      const urlStr = String(value);
      const urlPattern = /^https?:\/\/[^\s]+\.[^\s]+/;
      if (!urlPattern.test(urlStr)) {
        return fail(
          rule.errorMessage ??
            "Value must be a valid URL (starting with http:// or https://)",
        );
      }
      return { valid: true };
    }

    case "custom-formula": {
      // Custom formula validation is evaluated externally
      return { valid: true };
    }

    default:
      return { valid: true };
  }
}

export const useValidationStore = create<ValidationState>()(
  immer((set, get) => ({
    rules: new Map<string, Map<string, ValidationRule>>(),

    setRule: (
      sheetId: string,
      row: number,
      col: number,
      rule: ValidationRule,
    ) => {
      set((state) => {
        if (!state.rules.has(sheetId)) {
          state.rules.set(sheetId, new Map<string, ValidationRule>());
        }
        state.rules.get(sheetId)!.set(getCellKey(row, col), rule);
      });
    },

    removeRule: (sheetId: string, row: number, col: number) => {
      set((state) => {
        const sheetRules = state.rules.get(sheetId);
        if (sheetRules) {
          sheetRules.delete(getCellKey(row, col));
        }
      });
    },

    getRule: (sheetId: string, row: number, col: number) => {
      return get().rules.get(sheetId)?.get(getCellKey(row, col));
    },

    clearRules: (sheetId: string) => {
      set((state) => {
        state.rules.delete(sheetId);
      });
    },

    resolveListFromRange: (rangeStr: string): string[] => {
      // Parse range like "A1:A10" or "Sheet2!A1:A10"
      const { useCellStore } = require("./cellStore") as {
        useCellStore: typeof import("./cellStore").useCellStore;
      };
      const { useSpreadsheetStore } = require("./spreadsheetStore") as {
        useSpreadsheetStore: typeof import("./spreadsheetStore").useSpreadsheetStore;
      };
      const { cellRefToPosition } =
        require("../utils/coordinates") as typeof import("../utils/coordinates");

      let sheetId = useSpreadsheetStore.getState().activeSheetId;
      let rangePart = rangeStr.trim();

      // Handle sheet prefix: "Sheet2!A1:A10"
      const sheetMatch = rangePart.match(/^(.+)!(.+)$/);
      if (sheetMatch) {
        const sheetName = sheetMatch[1];
        rangePart = sheetMatch[2];
        const sheets = useSpreadsheetStore.getState().sheets;
        const targetSheet = sheets.find((s) => s.name === sheetName);
        if (targetSheet) {
          sheetId = targetSheet.id;
        }
      }

      // Parse "A1:A10" style range
      const parts = rangePart.split(":");
      if (parts.length !== 2) return [];

      try {
        const start = cellRefToPosition(parts[0]);
        const end = cellRefToPosition(parts[1]);
        const values: string[] = [];
        const cellStore = useCellStore.getState();

        const minRow = Math.min(start.row, end.row);
        const maxRow = Math.max(start.row, end.row);
        const minCol = Math.min(start.col, end.col);
        const maxCol = Math.max(start.col, end.col);

        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            const cell = cellStore.getCell(sheetId, r, c);
            if (cell?.value != null && String(cell.value).trim() !== "") {
              values.push(String(cell.value));
            }
          }
        }
        return values;
      } catch {
        return [];
      }
    },

    validate: (
      sheetId: string,
      row: number,
      col: number,
      value: string | number | boolean | null,
    ): ValidationResult => {
      const rule = get().rules.get(sheetId)?.get(getCellKey(row, col));
      if (!rule) return { valid: true };

      let resolvedList: string[] | undefined;
      if (rule.type === "list-from-range" && rule.listRange) {
        resolvedList = get().resolveListFromRange(rule.listRange);
      }

      return validateValue(rule, value, resolvedList);
    },
  })),
);

export { validateValue };
