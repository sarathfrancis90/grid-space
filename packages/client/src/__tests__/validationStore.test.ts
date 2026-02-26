import { describe, it, expect, beforeEach } from "vitest";
import { useValidationStore, validateValue } from "../stores/validationStore";
import type { ValidationRule } from "../types/grid";

describe("validationStore", () => {
  const SHEET = "sheet-1";

  beforeEach(() => {
    useValidationStore.setState({
      rules: new Map(),
    });
  });

  it("sets and gets a rule", () => {
    const rule: ValidationRule = { type: "number-range", min: 0, max: 100 };
    useValidationStore.getState().setRule(SHEET, 0, 0, rule);

    const got = useValidationStore.getState().getRule(SHEET, 0, 0);
    expect(got).toBeDefined();
    expect(got?.type).toBe("number-range");
    expect(got?.min).toBe(0);
    expect(got?.max).toBe(100);
  });

  it("removes a rule", () => {
    useValidationStore.getState().setRule(SHEET, 0, 0, { type: "checkbox" });
    useValidationStore.getState().removeRule(SHEET, 0, 0);
    expect(useValidationStore.getState().getRule(SHEET, 0, 0)).toBeUndefined();
  });

  it("clears all rules for a sheet", () => {
    useValidationStore.getState().setRule(SHEET, 0, 0, { type: "checkbox" });
    useValidationStore.getState().setRule(SHEET, 1, 0, { type: "checkbox" });
    useValidationStore.getState().clearRules(SHEET);
    expect(useValidationStore.getState().getRule(SHEET, 0, 0)).toBeUndefined();
  });

  it("validates via the store", () => {
    useValidationStore
      .getState()
      .setRule(SHEET, 0, 0, { type: "number-range", min: 1, max: 10 });

    expect(useValidationStore.getState().validate(SHEET, 0, 0, 5).valid).toBe(
      true,
    );
    expect(useValidationStore.getState().validate(SHEET, 0, 0, 15).valid).toBe(
      false,
    );
  });

  it("returns valid for cells without rules", () => {
    expect(
      useValidationStore.getState().validate(SHEET, 5, 5, "anything").valid,
    ).toBe(true);
  });
});

describe("validateValue", () => {
  it("number-range: valid within range", () => {
    const rule: ValidationRule = { type: "number-range", min: 0, max: 100 };
    expect(validateValue(rule, 50).valid).toBe(true);
  });

  it("number-range: invalid below min", () => {
    const rule: ValidationRule = { type: "number-range", min: 10, max: 100 };
    const result = validateValue(rule, 5);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("at least 10");
  });

  it("number-range: invalid above max", () => {
    const rule: ValidationRule = { type: "number-range", min: 0, max: 50 };
    expect(validateValue(rule, 60).valid).toBe(false);
  });

  it("number-range: rejects non-number", () => {
    const rule: ValidationRule = { type: "number-range", min: 0, max: 100 };
    expect(validateValue(rule, "abc").valid).toBe(false);
  });

  it("text-length: valid within limits", () => {
    const rule: ValidationRule = { type: "text-length", min: 2, max: 10 };
    expect(validateValue(rule, "hello").valid).toBe(true);
  });

  it("text-length: too short", () => {
    const rule: ValidationRule = { type: "text-length", min: 5 };
    expect(validateValue(rule, "hi").valid).toBe(false);
  });

  it("text-length: too long", () => {
    const rule: ValidationRule = { type: "text-length", max: 3 };
    expect(validateValue(rule, "hello").valid).toBe(false);
  });

  it("date-range: valid date in range", () => {
    const rule: ValidationRule = {
      type: "date-range",
      minDate: "2024-01-01",
      maxDate: "2024-12-31",
    };
    expect(validateValue(rule, "2024-06-15").valid).toBe(true);
  });

  it("date-range: date before min", () => {
    const rule: ValidationRule = {
      type: "date-range",
      minDate: "2024-01-01",
    };
    expect(validateValue(rule, "2023-06-15").valid).toBe(false);
  });

  it("date-range: invalid date string", () => {
    const rule: ValidationRule = { type: "date-range" };
    expect(validateValue(rule, "not-a-date").valid).toBe(false);
  });

  it("dropdown-list: valid value", () => {
    const rule: ValidationRule = {
      type: "dropdown-list",
      listValues: ["Red", "Green", "Blue"],
    };
    expect(validateValue(rule, "Red").valid).toBe(true);
  });

  it("dropdown-list: invalid value", () => {
    const rule: ValidationRule = {
      type: "dropdown-list",
      listValues: ["Red", "Green", "Blue"],
    };
    expect(validateValue(rule, "Yellow").valid).toBe(false);
  });

  it("checkbox: valid boolean", () => {
    const rule: ValidationRule = { type: "checkbox" };
    expect(validateValue(rule, "true").valid).toBe(true);
    expect(validateValue(rule, "false").valid).toBe(true);
    expect(validateValue(rule, true).valid).toBe(true);
  });

  it("checkbox: invalid non-boolean", () => {
    const rule: ValidationRule = { type: "checkbox" };
    expect(validateValue(rule, "maybe").valid).toBe(false);
  });

  it("allows blank when allowBlank is true", () => {
    const rule: ValidationRule = {
      type: "number-range",
      min: 1,
      max: 10,
      allowBlank: true,
    };
    expect(validateValue(rule, null).valid).toBe(true);
    expect(validateValue(rule, "").valid).toBe(true);
  });

  it("rejects blank when allowBlank is false", () => {
    const rule: ValidationRule = {
      type: "number-range",
      min: 1,
      max: 10,
      allowBlank: false,
    };
    expect(validateValue(rule, null).valid).toBe(false);
  });

  it("uses custom error message", () => {
    const rule: ValidationRule = {
      type: "number-range",
      min: 1,
      errorMessage: "Must be positive!",
    };
    const result = validateValue(rule, -5);
    expect(result.valid).toBe(false);
    expect(result.message).toBe("Must be positive!");
  });

  it("custom-formula: always valid (evaluated externally)", () => {
    const rule: ValidationRule = {
      type: "custom-formula",
      formula: "=A1>0",
    };
    expect(validateValue(rule, "anything").valid).toBe(true);
  });
});
