/**
 * Tests for enhanced conditional formatting features (issue #203).
 * - stopIfTrue field on ConditionalRule
 * - Quick rules (duplicates, unique, blanks, non-blanks)
 * - Rule reordering via formatStore
 * - updateConditionalRule with stopIfTrue
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useFormatStore } from "../stores/formatStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import type { ConditionalRule } from "../types/grid";

function makeRule(overrides: Partial<ConditionalRule> = {}): ConditionalRule {
  return {
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    range: { startRow: 0, startCol: 0, endRow: 9, endCol: 5 },
    type: "value",
    condition: "greaterThan",
    values: ["10"],
    format: { backgroundColor: "#b7e1cd" },
    priority: 0,
    ...overrides,
  };
}

describe("Conditional Formatting enhancements", () => {
  let sheetId: string;

  beforeEach(() => {
    useFormatStore.setState({ conditionalRules: new Map() });
    sheetId = useSpreadsheetStore.getState().activeSheetId;
  });

  describe("stopIfTrue", () => {
    it("should default stopIfTrue to undefined", () => {
      const rule = makeRule({ id: "r1" });
      useFormatStore.getState().addConditionalRule(sheetId, rule);
      const rules = useFormatStore.getState().conditionalRules.get(sheetId);
      expect(rules).toBeDefined();
      expect(rules![0].stopIfTrue).toBeUndefined();
    });

    it("should toggle stopIfTrue via updateConditionalRule", () => {
      const rule = makeRule({ id: "r1" });
      useFormatStore.getState().addConditionalRule(sheetId, rule);

      useFormatStore
        .getState()
        .updateConditionalRule(sheetId, "r1", { stopIfTrue: true });
      let rules = useFormatStore.getState().conditionalRules.get(sheetId)!;
      expect(rules[0].stopIfTrue).toBe(true);

      useFormatStore
        .getState()
        .updateConditionalRule(sheetId, "r1", { stopIfTrue: false });
      rules = useFormatStore.getState().conditionalRules.get(sheetId)!;
      expect(rules[0].stopIfTrue).toBe(false);
    });
  });

  describe("rule reordering", () => {
    it("should reorder rules by id list", () => {
      const r1 = makeRule({ id: "r1", priority: 0 });
      const r2 = makeRule({ id: "r2", priority: 1 });
      const r3 = makeRule({ id: "r3", priority: 2 });
      const store = useFormatStore.getState();
      store.addConditionalRule(sheetId, r1);
      store.addConditionalRule(sheetId, r2);
      store.addConditionalRule(sheetId, r3);

      useFormatStore
        .getState()
        .reorderConditionalRules(sheetId, ["r3", "r1", "r2"]);
      const rules = useFormatStore.getState().conditionalRules.get(sheetId)!;
      expect(rules.map((r) => r.id)).toEqual(["r3", "r1", "r2"]);
      expect(rules[0].priority).toBe(0);
      expect(rules[1].priority).toBe(1);
      expect(rules[2].priority).toBe(2);
    });
  });

  describe("quick rule shapes", () => {
    it("should support blank condition rules", () => {
      const rule = makeRule({
        id: "blank-rule",
        type: "blank",
        condition: "isBlank",
        values: [],
        format: { backgroundColor: "#fef7e0", textColor: "#b05a00" },
      });
      useFormatStore.getState().addConditionalRule(sheetId, rule);
      const rules = useFormatStore.getState().conditionalRules.get(sheetId)!;
      expect(rules[0].type).toBe("blank");
      expect(rules[0].condition).toBe("isBlank");
      expect(rules[0].format.backgroundColor).toBe("#fef7e0");
    });

    it("should support customFormula condition for duplicates/unique", () => {
      const rule = makeRule({
        id: "dup-rule",
        type: "customFormula",
        condition: "duplicates",
        values: [],
        format: { backgroundColor: "#fce8e6", textColor: "#c5221f" },
      });
      useFormatStore.getState().addConditionalRule(sheetId, rule);
      const rules = useFormatStore.getState().conditionalRules.get(sheetId)!;
      expect(rules[0].type).toBe("customFormula");
      expect(rules[0].condition).toBe("duplicates");
    });
  });

  describe("ConditionalRule type", () => {
    it("should include stopIfTrue in the type definition", () => {
      const rule: ConditionalRule = {
        id: "typed-rule",
        range: { startRow: 0, startCol: 0, endRow: 0, endCol: 0 },
        type: "value",
        condition: "greaterThan",
        values: ["5"],
        format: {},
        priority: 0,
        stopIfTrue: true,
      };
      expect(rule.stopIfTrue).toBe(true);
    });
  });
});
