/**
 * Tests for conditional formatting extras (S6-019 to S6-024).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useFormatStore } from "../stores/formatStore";
import type { ConditionalRule } from "../types/grid";

function resetStore() {
  useFormatStore.setState({
    mergedRegions: new Map(),
    conditionalRules: new Map(),
    alternatingColors: new Map(),
    paintFormatMode: "off" as const,
    paintFormatSource: null,
  });
}

function makeRule(overrides: Partial<ConditionalRule>): ConditionalRule {
  return {
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    range: { startRow: 0, startCol: 0, endRow: 10, endCol: 5 },
    type: "value",
    condition: "greaterThan",
    values: ["0"],
    format: { backgroundColor: "#ff0000" },
    priority: 0,
    ...overrides,
  };
}

describe("S6-019: Conditional format — is blank / not blank", () => {
  beforeEach(resetStore);

  it("matches isBlank for null value", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "blank-rule",
        type: "blank",
        condition: "isBlank",
        values: [],
        format: { backgroundColor: "#ffcccc" },
      }),
    );

    const result = store.evaluateConditionalFormat("sheet-1", 0, 0, null);
    expect(result).toEqual({ backgroundColor: "#ffcccc" });
  });

  it("matches isBlank for empty string", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "blank-rule",
        type: "blank",
        condition: "isBlank",
        values: [],
        format: { backgroundColor: "#ffcccc" },
      }),
    );

    const result = store.evaluateConditionalFormat("sheet-1", 0, 0, "");
    expect(result).toEqual({ backgroundColor: "#ffcccc" });
  });

  it("matches isBlank for whitespace-only string", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "blank-rule",
        type: "blank",
        condition: "isBlank",
        values: [],
        format: { backgroundColor: "#ffcccc" },
      }),
    );

    const result = store.evaluateConditionalFormat("sheet-1", 0, 0, "  ");
    expect(result).toEqual({ backgroundColor: "#ffcccc" });
  });

  it("does not match isBlank for non-empty value", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "blank-rule",
        type: "blank",
        condition: "isBlank",
        values: [],
        format: { backgroundColor: "#ffcccc" },
      }),
    );

    const result = store.evaluateConditionalFormat("sheet-1", 0, 0, "hello");
    expect(result).toBeNull();
  });

  it("matches notBlank for non-empty value", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "notblank-rule",
        type: "blank",
        condition: "notBlank",
        values: [],
        format: { backgroundColor: "#ccffcc" },
      }),
    );

    const result = store.evaluateConditionalFormat("sheet-1", 0, 0, "data");
    expect(result).toEqual({ backgroundColor: "#ccffcc" });
  });

  it("does not match notBlank for null", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "notblank-rule",
        type: "blank",
        condition: "notBlank",
        values: [],
        format: { backgroundColor: "#ccffcc" },
      }),
    );

    const result = store.evaluateConditionalFormat("sheet-1", 0, 0, null);
    expect(result).toBeNull();
  });
});

describe("S6-020: Conditional format — date is", () => {
  beforeEach(resetStore);

  it("matches 'today' condition for today's date", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "date-today",
        type: "date",
        condition: "today",
        values: [],
        format: { backgroundColor: "#ffffcc" },
      }),
    );

    const todayStr = new Date().toISOString().split("T")[0];
    const result = store.evaluateConditionalFormat("sheet-1", 0, 0, todayStr);
    expect(result).toEqual({ backgroundColor: "#ffffcc" });
  });

  it("does not match 'today' for yesterday's date", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "date-today",
        type: "date",
        condition: "today",
        values: [],
        format: { backgroundColor: "#ffffcc" },
      }),
    );

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = store.evaluateConditionalFormat(
      "sheet-1",
      0,
      0,
      yesterday.toISOString().split("T")[0],
    );
    expect(result).toBeNull();
  });

  it("matches 'yesterday' condition", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "date-yesterday",
        type: "date",
        condition: "yesterday",
        values: [],
        format: { backgroundColor: "#ccccff" },
      }),
    );

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = store.evaluateConditionalFormat(
      "sheet-1",
      0,
      0,
      yesterday.toISOString().split("T")[0],
    );
    expect(result).toEqual({ backgroundColor: "#ccccff" });
  });

  it("matches 'tomorrow' condition", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "date-tomorrow",
        type: "date",
        condition: "tomorrow",
        values: [],
        format: { backgroundColor: "#ffccff" },
      }),
    );

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = store.evaluateConditionalFormat(
      "sheet-1",
      0,
      0,
      tomorrow.toISOString().split("T")[0],
    );
    expect(result).toEqual({ backgroundColor: "#ffccff" });
  });

  it("does not match date condition for non-date values", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "date-today",
        type: "date",
        condition: "today",
        values: [],
        format: { backgroundColor: "#ffffcc" },
      }),
    );

    const result = store.evaluateConditionalFormat("sheet-1", 0, 0, "hello");
    expect(result).toBeNull();
  });

  it("does not match date condition for null", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "date-today",
        type: "date",
        condition: "today",
        values: [],
        format: { backgroundColor: "#ffffcc" },
      }),
    );

    const result = store.evaluateConditionalFormat("sheet-1", 0, 0, null);
    expect(result).toBeNull();
  });

  it("matches 'lastWeek' condition for date within past 7 days", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "date-lastweek",
        type: "date",
        condition: "lastWeek",
        values: [],
        format: { backgroundColor: "#eeeeff" },
      }),
    );

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const result = store.evaluateConditionalFormat(
      "sheet-1",
      0,
      0,
      fiveDaysAgo.toISOString().split("T")[0],
    );
    expect(result).toEqual({ backgroundColor: "#eeeeff" });
  });
});

describe("S6-021: Conditional format — custom formula rule", () => {
  beforeEach(resetStore);

  it("matches custom formula >10 for value 15", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "custom-gt",
        type: "customFormula",
        condition: "custom",
        values: [],
        formula: ">10",
        format: { backgroundColor: "#ff0000" },
      }),
    );

    const result = store.evaluateConditionalFormat("sheet-1", 0, 0, 15);
    expect(result).toEqual({ backgroundColor: "#ff0000" });
  });

  it("does not match custom formula >10 for value 5", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "custom-gt",
        type: "customFormula",
        condition: "custom",
        values: [],
        formula: ">10",
        format: { backgroundColor: "#ff0000" },
      }),
    );

    const result = store.evaluateConditionalFormat("sheet-1", 0, 0, 5);
    expect(result).toBeNull();
  });

  it("matches custom formula <=100", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "custom-lte",
        type: "customFormula",
        condition: "custom",
        values: [],
        formula: "<=100",
        format: { backgroundColor: "#00ff00" },
      }),
    );

    const result = store.evaluateConditionalFormat("sheet-1", 0, 0, 50);
    expect(result).toEqual({ backgroundColor: "#00ff00" });
  });

  it("matches custom formula <>0 (not equal)", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "custom-neq",
        type: "customFormula",
        condition: "custom",
        values: [],
        formula: "<>0",
        format: { backgroundColor: "#0000ff" },
      }),
    );

    expect(store.evaluateConditionalFormat("sheet-1", 0, 0, 5)).toEqual({
      backgroundColor: "#0000ff",
    });
    expect(store.evaluateConditionalFormat("sheet-1", 0, 0, 0)).toBeNull();
  });

  it("handles empty formula gracefully", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "custom-empty",
        type: "customFormula",
        condition: "custom",
        values: [],
        formula: "",
        format: { backgroundColor: "#ff0000" },
      }),
    );

    const result = store.evaluateConditionalFormat("sheet-1", 0, 0, 10);
    expect(result).toBeNull();
  });
});

describe("S6-022: Multiple conditional format rules with priority order", () => {
  beforeEach(resetStore);

  it("higher priority rule (lower number) takes precedence", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "rule-low-priority",
        type: "value",
        condition: "greaterThan",
        values: ["0"],
        format: { backgroundColor: "#ff0000" },
        priority: 1,
      }),
    );
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "rule-high-priority",
        type: "value",
        condition: "greaterThan",
        values: ["5"],
        format: { backgroundColor: "#00ff00" },
        priority: 0,
      }),
    );

    // Value 10 matches both, but priority 0 rule wins
    const result = store.evaluateConditionalFormat("sheet-1", 0, 0, 10);
    expect(result).toEqual({ backgroundColor: "#00ff00" });
  });

  it("falls through to lower priority if higher doesn't match", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "rule-high",
        type: "value",
        condition: "greaterThan",
        values: ["100"],
        format: { backgroundColor: "#00ff00" },
        priority: 0,
      }),
    );
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "rule-low",
        type: "value",
        condition: "greaterThan",
        values: ["0"],
        format: { backgroundColor: "#ff0000" },
        priority: 1,
      }),
    );

    // Value 50: doesn't match >100, matches >0
    const result = store.evaluateConditionalFormat("sheet-1", 0, 0, 50);
    expect(result).toEqual({ backgroundColor: "#ff0000" });
  });
});

describe("S6-023: Conditional format manager — add/edit/delete rules", () => {
  beforeEach(resetStore);

  it("addConditionalRule adds a rule", () => {
    const store = useFormatStore.getState();
    const rule = makeRule({ id: "test-rule" });
    store.addConditionalRule("sheet-1", rule);
    expect(store.getConditionalRules("sheet-1")).toHaveLength(1);
    expect(store.getConditionalRules("sheet-1")[0].id).toBe("test-rule");
  });

  it("removeConditionalRule removes a rule", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule("sheet-1", makeRule({ id: "r1" }));
    store.addConditionalRule("sheet-1", makeRule({ id: "r2" }));
    expect(store.getConditionalRules("sheet-1")).toHaveLength(2);

    store.removeConditionalRule("sheet-1", "r1");
    expect(store.getConditionalRules("sheet-1")).toHaveLength(1);
    expect(store.getConditionalRules("sheet-1")[0].id).toBe("r2");
  });

  it("updateConditionalRule modifies an existing rule", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "edit-rule",
        condition: "greaterThan",
        values: ["10"],
      }),
    );

    store.updateConditionalRule("sheet-1", "edit-rule", {
      condition: "lessThan",
      values: ["5"],
    });

    const rules = store.getConditionalRules("sheet-1");
    expect(rules[0].condition).toBe("lessThan");
    expect(rules[0].values).toEqual(["5"]);
  });

  it("reorderConditionalRules changes rule order", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule("sheet-1", makeRule({ id: "r1", priority: 0 }));
    store.addConditionalRule("sheet-1", makeRule({ id: "r2", priority: 1 }));
    store.addConditionalRule("sheet-1", makeRule({ id: "r3", priority: 2 }));

    store.reorderConditionalRules("sheet-1", ["r3", "r1", "r2"]);
    const rules = store.getConditionalRules("sheet-1");
    expect(rules[0].id).toBe("r3");
    expect(rules[0].priority).toBe(0);
    expect(rules[1].id).toBe("r1");
    expect(rules[1].priority).toBe(1);
    expect(rules[2].id).toBe("r2");
    expect(rules[2].priority).toBe(2);
  });
});

describe("S6-024: Conditional format applies to range", () => {
  beforeEach(resetStore);

  it("applies format only within the specified range", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "range-rule",
        range: { startRow: 1, startCol: 1, endRow: 3, endCol: 3 },
        type: "value",
        condition: "greaterThan",
        values: ["0"],
        format: { backgroundColor: "#ff0000" },
      }),
    );

    // Inside range
    expect(store.evaluateConditionalFormat("sheet-1", 2, 2, 10)).toEqual({
      backgroundColor: "#ff0000",
    });

    // Outside range
    expect(store.evaluateConditionalFormat("sheet-1", 0, 0, 10)).toBeNull();
    expect(store.evaluateConditionalFormat("sheet-1", 5, 5, 10)).toBeNull();
  });

  it("checks range boundaries correctly", () => {
    const store = useFormatStore.getState();
    store.addConditionalRule(
      "sheet-1",
      makeRule({
        id: "boundary-rule",
        range: { startRow: 0, startCol: 0, endRow: 2, endCol: 2 },
        type: "value",
        condition: "greaterThan",
        values: ["0"],
        format: { backgroundColor: "#00ff00" },
      }),
    );

    // Start boundary
    expect(store.evaluateConditionalFormat("sheet-1", 0, 0, 5)).toEqual({
      backgroundColor: "#00ff00",
    });

    // End boundary
    expect(store.evaluateConditionalFormat("sheet-1", 2, 2, 5)).toEqual({
      backgroundColor: "#00ff00",
    });

    // Just outside
    expect(store.evaluateConditionalFormat("sheet-1", 3, 2, 5)).toBeNull();
    expect(store.evaluateConditionalFormat("sheet-1", 2, 3, 5)).toBeNull();
  });

  it("returns null when no rules exist for sheet", () => {
    const store = useFormatStore.getState();
    const result = store.evaluateConditionalFormat("sheet-1", 0, 0, 10);
    expect(result).toBeNull();
  });
});
