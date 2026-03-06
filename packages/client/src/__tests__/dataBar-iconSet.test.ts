/**
 * Tests for data bars and icon sets conditional formatting.
 */
import { describe, it, expect } from "vitest";
import {
  evaluateDataBar,
  evaluateIconSet,
  ICON_SET_DEFINITIONS,
} from "../stores/formatStore";
import type { ConditionalRule, IconSetStyle } from "../types/grid";

function makeRule(overrides: Partial<ConditionalRule>): ConditionalRule {
  return {
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    range: { startRow: 0, startCol: 0, endRow: 10, endCol: 5 },
    type: "value",
    condition: "",
    values: [],
    format: {},
    priority: 0,
    ...overrides,
  };
}

describe("evaluateDataBar", () => {
  it("returns null for non-dataBar rule", () => {
    const rule = makeRule({ type: "value" });
    expect(evaluateDataBar(rule, 5, 0, 10)).toBeNull();
  });

  it("returns correct ratio for value in range", () => {
    const rule = makeRule({
      type: "dataBar",
      dataBarConfig: { color: "#4285f4", fillType: "solid" },
    });
    const result = evaluateDataBar(rule, 5, 0, 10);
    expect(result).not.toBeNull();
    expect(result!.ratio).toBe(0.5);
    expect(result!.color).toBe("#4285f4");
    expect(result!.fillType).toBe("solid");
    expect(result!.isNegative).toBe(false);
  });

  it("returns ratio 0 for min value", () => {
    const rule = makeRule({
      type: "dataBar",
      dataBarConfig: { color: "#4285f4", fillType: "solid" },
    });
    const result = evaluateDataBar(rule, 0, 0, 10);
    expect(result!.ratio).toBe(0);
  });

  it("returns ratio 1 for max value", () => {
    const rule = makeRule({
      type: "dataBar",
      dataBarConfig: { color: "#4285f4", fillType: "solid" },
    });
    const result = evaluateDataBar(rule, 10, 0, 10);
    expect(result!.ratio).toBe(1);
  });

  it("returns null when min equals max", () => {
    const rule = makeRule({
      type: "dataBar",
      dataBarConfig: { color: "#4285f4", fillType: "solid" },
    });
    expect(evaluateDataBar(rule, 5, 5, 5)).toBeNull();
  });

  it("supports gradient fill type", () => {
    const rule = makeRule({
      type: "dataBar",
      dataBarConfig: { color: "#4285f4", fillType: "gradient" },
    });
    const result = evaluateDataBar(rule, 5, 0, 10);
    expect(result!.fillType).toBe("gradient");
  });

  it("uses negative color for negative values when configured", () => {
    const rule = makeRule({
      type: "dataBar",
      dataBarConfig: {
        color: "#4285f4",
        fillType: "solid",
        showNegative: true,
        negativeColor: "#ea4335",
      },
    });
    const result = evaluateDataBar(rule, -3, -5, 10);
    expect(result!.isNegative).toBe(true);
    expect(result!.color).toBe("#ea4335");
  });

  it("uses normal color for positive values even with negative config", () => {
    const rule = makeRule({
      type: "dataBar",
      dataBarConfig: {
        color: "#4285f4",
        fillType: "solid",
        showNegative: true,
        negativeColor: "#ea4335",
      },
    });
    const result = evaluateDataBar(rule, 5, -5, 10);
    expect(result!.isNegative).toBe(false);
    expect(result!.color).toBe("#4285f4");
  });

  it("respects custom minValue and maxValue", () => {
    const rule = makeRule({
      type: "dataBar",
      dataBarConfig: {
        color: "#4285f4",
        fillType: "solid",
        minValue: 0,
        maxValue: 100,
      },
    });
    const result = evaluateDataBar(rule, 50, -10, 200);
    expect(result!.ratio).toBe(0.5);
  });

  it("clamps values to effective min/max", () => {
    const rule = makeRule({
      type: "dataBar",
      dataBarConfig: {
        color: "#4285f4",
        fillType: "solid",
        minValue: 0,
        maxValue: 100,
      },
    });
    const result = evaluateDataBar(rule, 150, 0, 200);
    expect(result!.ratio).toBe(1);
  });

  it("falls back to values[0] for color when no config", () => {
    const rule = makeRule({
      type: "dataBar",
      values: ["#ff0000"],
    });
    const result = evaluateDataBar(rule, 5, 0, 10);
    expect(result!.color).toBe("#ff0000");
  });
});

describe("evaluateIconSet", () => {
  it("returns null for non-iconSet rule", () => {
    const rule = makeRule({ type: "value" });
    expect(evaluateIconSet(rule, 5, 0, 10)).toBeNull();
  });

  it("returns icon for 3-arrows with low value", () => {
    const rule = makeRule({
      type: "iconSet",
      iconSetConfig: { style: "3-arrows", thresholds: [] },
    });
    const result = evaluateIconSet(rule, 1, 0, 10);
    expect(result).not.toBeNull();
    expect(result!.icon).toBe(ICON_SET_DEFINITIONS["3-arrows"].icons[0]);
    expect(result!.color).toBe(ICON_SET_DEFINITIONS["3-arrows"].colors[0]);
  });

  it("returns icon for 3-arrows with high value", () => {
    const rule = makeRule({
      type: "iconSet",
      iconSetConfig: { style: "3-arrows", thresholds: [] },
    });
    const result = evaluateIconSet(rule, 10, 0, 10);
    expect(result).not.toBeNull();
    expect(result!.icon).toBe(ICON_SET_DEFINITIONS["3-arrows"].icons[2]);
    expect(result!.color).toBe(ICON_SET_DEFINITIONS["3-arrows"].colors[2]);
  });

  it("returns icon for 3-arrows with mid value", () => {
    const rule = makeRule({
      type: "iconSet",
      iconSetConfig: { style: "3-arrows", thresholds: [] },
    });
    const result = evaluateIconSet(rule, 5, 0, 10);
    expect(result).not.toBeNull();
    expect(result!.icon).toBe(ICON_SET_DEFINITIONS["3-arrows"].icons[1]);
  });

  it("supports 3-traffic-lights style", () => {
    const rule = makeRule({
      type: "iconSet",
      iconSetConfig: { style: "3-traffic-lights", thresholds: [] },
    });
    const result = evaluateIconSet(rule, 9, 0, 10);
    expect(result).not.toBeNull();
    expect(result!.color).toBe(
      ICON_SET_DEFINITIONS["3-traffic-lights"].colors[2],
    );
  });

  it("supports 3-flags style", () => {
    const rule = makeRule({
      type: "iconSet",
      iconSetConfig: { style: "3-flags", thresholds: [] },
    });
    const result = evaluateIconSet(rule, 1, 0, 10);
    expect(result).not.toBeNull();
    expect(result!.icon).toBe(ICON_SET_DEFINITIONS["3-flags"].icons[0]);
  });

  it("supports 5-arrows style", () => {
    const rule = makeRule({
      type: "iconSet",
      iconSetConfig: { style: "5-arrows", thresholds: [] },
    });
    const result = evaluateIconSet(rule, 9, 0, 10);
    expect(result).not.toBeNull();
    const def = ICON_SET_DEFINITIONS["5-arrows"];
    expect(result!.icon).toBe(def.icons[4]);
  });

  it("uses explicit thresholds when provided", () => {
    const rule = makeRule({
      type: "iconSet",
      iconSetConfig: { style: "3-arrows", thresholds: [30, 70] },
    });
    // Below first threshold
    const low = evaluateIconSet(rule, 20, 0, 100);
    expect(low!.icon).toBe(ICON_SET_DEFINITIONS["3-arrows"].icons[0]);

    // Between thresholds
    const mid = evaluateIconSet(rule, 50, 0, 100);
    expect(mid!.icon).toBe(ICON_SET_DEFINITIONS["3-arrows"].icons[1]);

    // Above second threshold
    const high = evaluateIconSet(rule, 80, 0, 100);
    expect(high!.icon).toBe(ICON_SET_DEFINITIONS["3-arrows"].icons[2]);
  });

  it("returns last icon when min equals max", () => {
    const rule = makeRule({
      type: "iconSet",
      iconSetConfig: { style: "3-arrows", thresholds: [] },
    });
    const result = evaluateIconSet(rule, 5, 5, 5);
    expect(result).not.toBeNull();
    expect(result!.icon).toBe(ICON_SET_DEFINITIONS["3-arrows"].icons[2]);
  });

  it("all icon set styles are defined", () => {
    const styles: IconSetStyle[] = [
      "3-arrows",
      "3-flags",
      "3-traffic-lights",
      "4-arrows",
      "5-arrows",
    ];
    for (const style of styles) {
      expect(ICON_SET_DEFINITIONS[style]).toBeDefined();
      expect(ICON_SET_DEFINITIONS[style].icons.length).toBeGreaterThan(0);
      expect(ICON_SET_DEFINITIONS[style].colors.length).toBe(
        ICON_SET_DEFINITIONS[style].icons.length,
      );
    }
  });
});
