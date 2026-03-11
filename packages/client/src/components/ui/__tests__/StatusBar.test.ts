import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Unit tests for StatusBar aggregation visibility logic.
 * Tests localStorage persistence and toggle behavior.
 */

type AggregationType = "sum" | "avg" | "count" | "min" | "max";

const DEFAULT_VISIBLE: Set<AggregationType> = new Set([
  "sum",
  "avg",
  "count",
  "min",
  "max",
]);

function loadVisibleAggregations(): Set<AggregationType> {
  try {
    const stored = localStorage.getItem("statusbar-aggregations");
    if (stored) {
      const parsed = JSON.parse(stored) as AggregationType[];
      return new Set(parsed);
    }
  } catch {
    // ignore
  }
  return new Set(DEFAULT_VISIBLE);
}

function saveVisibleAggregations(visible: Set<AggregationType>) {
  localStorage.setItem("statusbar-aggregations", JSON.stringify([...visible]));
}

function toggleAggregation(
  current: Set<AggregationType>,
  key: AggregationType,
): Set<AggregationType> {
  const next = new Set(current);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  saveVisibleAggregations(next);
  return next;
}

describe("StatusBar aggregation visibility", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("loads default aggregations when nothing stored", () => {
    const result = loadVisibleAggregations();
    expect(result).toEqual(DEFAULT_VISIBLE);
  });

  it("loads saved aggregations from localStorage", () => {
    localStorage.setItem(
      "statusbar-aggregations",
      JSON.stringify(["sum", "count"]),
    );
    const result = loadVisibleAggregations();
    expect(result).toEqual(new Set(["sum", "count"]));
  });

  it("falls back to defaults on invalid JSON in localStorage", () => {
    localStorage.setItem("statusbar-aggregations", "not-json");
    const result = loadVisibleAggregations();
    expect(result).toEqual(DEFAULT_VISIBLE);
  });

  it("saves aggregations to localStorage", () => {
    const visible = new Set<AggregationType>(["sum", "avg"]);
    saveVisibleAggregations(visible);
    const stored = localStorage.getItem("statusbar-aggregations");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!) as AggregationType[];
    expect(new Set(parsed)).toEqual(new Set(["sum", "avg"]));
  });

  it("toggles aggregation off", () => {
    const current = new Set<AggregationType>(["sum", "avg", "count"]);
    const result = toggleAggregation(current, "avg");
    expect(result.has("avg")).toBe(false);
    expect(result.has("sum")).toBe(true);
    expect(result.has("count")).toBe(true);
  });

  it("toggles aggregation on", () => {
    const current = new Set<AggregationType>(["sum"]);
    const result = toggleAggregation(current, "max");
    expect(result.has("max")).toBe(true);
    expect(result.has("sum")).toBe(true);
  });

  it("persists toggled state to localStorage", () => {
    const current = new Set<AggregationType>(["sum", "avg", "count"]);
    toggleAggregation(current, "avg");
    const stored = localStorage.getItem("statusbar-aggregations");
    const parsed = JSON.parse(stored!) as AggregationType[];
    expect(new Set(parsed)).toEqual(new Set(["sum", "count"]));
  });
});

describe("StatusBar stat formatting", () => {
  const fmt = (n: number) => {
    if (Number.isInteger(n)) return n.toString();
    return n.toFixed(2);
  };

  it("formats integers without decimals", () => {
    expect(fmt(42)).toBe("42");
    expect(fmt(0)).toBe("0");
    expect(fmt(-10)).toBe("-10");
  });

  it("formats decimals to 2 places", () => {
    expect(fmt(3.14159)).toBe("3.14");
    expect(fmt(0.1)).toBe("0.10");
    expect(fmt(100.5)).toBe("100.50");
  });
});
