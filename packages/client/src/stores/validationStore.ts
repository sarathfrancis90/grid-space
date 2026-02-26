import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ValidationRule } from "../types/grid";
import { getCellKey } from "../utils/coordinates";

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

  validate: (
    sheetId: string,
    row: number,
    col: number,
    value: string | number | boolean | null,
  ) => { valid: boolean; message?: string };
}

function validateValue(
  rule: ValidationRule,
  value: string | number | boolean | null,
): { valid: boolean; message?: string } {
  if (value == null || value === "") {
    if (rule.allowBlank !== false) return { valid: true };
    return {
      valid: false,
      message: rule.errorMessage ?? "This field cannot be blank",
    };
  }

  switch (rule.type) {
    case "number-range": {
      const num = Number(value);
      if (isNaN(num)) {
        return {
          valid: false,
          message: rule.errorMessage ?? "Value must be a number",
        };
      }
      if (rule.min != null && num < rule.min) {
        return {
          valid: false,
          message: rule.errorMessage ?? `Value must be at least ${rule.min}`,
        };
      }
      if (rule.max != null && num > rule.max) {
        return {
          valid: false,
          message: rule.errorMessage ?? `Value must be at most ${rule.max}`,
        };
      }
      return { valid: true };
    }

    case "text-length": {
      const len = String(value).length;
      if (rule.min != null && len < rule.min) {
        return {
          valid: false,
          message:
            rule.errorMessage ?? `Text must be at least ${rule.min} characters`,
        };
      }
      if (rule.max != null && len > rule.max) {
        return {
          valid: false,
          message:
            rule.errorMessage ?? `Text must be at most ${rule.max} characters`,
        };
      }
      return { valid: true };
    }

    case "date-range": {
      const dateVal = new Date(String(value));
      if (isNaN(dateVal.getTime())) {
        return {
          valid: false,
          message: rule.errorMessage ?? "Value must be a valid date",
        };
      }
      if (rule.minDate) {
        const minD = new Date(rule.minDate);
        if (dateVal < minD) {
          return {
            valid: false,
            message:
              rule.errorMessage ?? `Date must be on or after ${rule.minDate}`,
          };
        }
      }
      if (rule.maxDate) {
        const maxD = new Date(rule.maxDate);
        if (dateVal > maxD) {
          return {
            valid: false,
            message:
              rule.errorMessage ?? `Date must be on or before ${rule.maxDate}`,
          };
        }
      }
      return { valid: true };
    }

    case "dropdown-list": {
      if (!rule.listValues) return { valid: true };
      const strVal = String(value);
      if (!rule.listValues.includes(strVal)) {
        return {
          valid: false,
          message:
            rule.errorMessage ??
            `Value must be one of: ${rule.listValues.join(", ")}`,
        };
      }
      return { valid: true };
    }

    case "checkbox": {
      const strVal = String(value).toLowerCase();
      if (strVal !== "true" && strVal !== "false") {
        return {
          valid: false,
          message: rule.errorMessage ?? "Value must be TRUE or FALSE",
        };
      }
      return { valid: true };
    }

    case "custom-formula": {
      // Custom formula validation is evaluated externally
      // Here we just check if a formula was provided
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

    validate: (
      sheetId: string,
      row: number,
      col: number,
      value: string | number | boolean | null,
    ) => {
      const rule = get().rules.get(sheetId)?.get(getCellKey(row, col));
      if (!rule) return { valid: true };
      return validateValue(rule, value);
    },
  })),
);

export { validateValue };
