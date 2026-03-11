import { describe, it, expect } from "vitest";

/**
 * Unit tests for PrintDialog settings, page size config, and display value formatting.
 */

type PageSize = "letter" | "a4" | "legal" | "tabloid";
type MarginPreset = "normal" | "narrow" | "wide";

const PAGE_SIZE_DIMS: Record<PageSize, { width: number; height: number }> = {
  letter: { width: 816, height: 1056 },
  a4: { width: 794, height: 1123 },
  legal: { width: 816, height: 1344 },
  tabloid: { width: 1056, height: 1632 },
};

const MARGIN_VALUES: Record<MarginPreset, number> = {
  normal: 72,
  narrow: 36,
  wide: 108,
};

const CSS_PAGE_SIZES: Record<PageSize, string> = {
  letter: "letter",
  a4: "A4",
  legal: "legal",
  tabloid: "11in 17in",
};

function formatDisplayValue(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function computePreviewDimensions(
  pageSize: PageSize,
  orientation: "portrait" | "landscape",
  margins: MarginPreset,
) {
  const dims = PAGE_SIZE_DIMS[pageSize];
  const isLandscape = orientation === "landscape";
  const pageW = isLandscape ? dims.height : dims.width;
  const pageH = isLandscape ? dims.width : dims.height;
  const previewScale = 200 / pageW;
  const scaledW = pageW * previewScale;
  const scaledH = pageH * previewScale;
  const margin = MARGIN_VALUES[margins] * previewScale;
  const contentW = scaledW - margin * 2;
  const contentH = scaledH - margin * 2;
  return { scaledW, scaledH, contentW, contentH, margin };
}

function clampCustomScale(value: number): number {
  return Math.max(10, Math.min(200, value));
}

function clampRepeatRows(value: number): number {
  return Math.max(0, Math.min(20, value));
}

describe("PrintDialog settings", () => {
  describe("formatDisplayValue", () => {
    it("returns empty string for null", () => {
      expect(formatDisplayValue(null)).toBe("");
    });

    it("converts number to string", () => {
      expect(formatDisplayValue(42)).toBe("42");
    });

    it("converts boolean to string", () => {
      expect(formatDisplayValue(true)).toBe("true");
    });

    it("passes string through", () => {
      expect(formatDisplayValue("hello")).toBe("hello");
    });
  });

  describe("page size dimensions", () => {
    it("has correct letter dimensions", () => {
      expect(PAGE_SIZE_DIMS.letter).toEqual({ width: 816, height: 1056 });
    });

    it("has correct A4 dimensions", () => {
      expect(PAGE_SIZE_DIMS.a4).toEqual({ width: 794, height: 1123 });
    });

    it("has all four page sizes", () => {
      const sizes = Object.keys(PAGE_SIZE_DIMS);
      expect(sizes).toEqual(["letter", "a4", "legal", "tabloid"]);
    });
  });

  describe("CSS page sizes", () => {
    it("maps letter to 'letter'", () => {
      expect(CSS_PAGE_SIZES.letter).toBe("letter");
    });

    it("maps a4 to 'A4'", () => {
      expect(CSS_PAGE_SIZES.a4).toBe("A4");
    });

    it("maps tabloid to dimension string", () => {
      expect(CSS_PAGE_SIZES.tabloid).toBe("11in 17in");
    });
  });

  describe("preview dimensions", () => {
    it("computes portrait letter preview", () => {
      const result = computePreviewDimensions("letter", "portrait", "normal");
      expect(result.scaledW).toBeCloseTo(200);
      expect(result.scaledH).toBeGreaterThan(result.scaledW);
      expect(result.contentW).toBeLessThan(result.scaledW);
      expect(result.contentH).toBeLessThan(result.scaledH);
    });

    it("swaps dimensions for landscape", () => {
      const portrait = computePreviewDimensions("letter", "portrait", "normal");
      const landscape = computePreviewDimensions(
        "letter",
        "landscape",
        "normal",
      );
      expect(landscape.scaledW).toBeCloseTo(200);
      expect(landscape.scaledH).toBeLessThan(portrait.scaledH);
    });

    it("narrow margins give more content area", () => {
      const normal = computePreviewDimensions("letter", "portrait", "normal");
      const narrow = computePreviewDimensions("letter", "portrait", "narrow");
      expect(narrow.contentW).toBeGreaterThan(normal.contentW);
      expect(narrow.contentH).toBeGreaterThan(normal.contentH);
    });

    it("wide margins give less content area", () => {
      const normal = computePreviewDimensions("letter", "portrait", "normal");
      const wide = computePreviewDimensions("letter", "portrait", "wide");
      expect(wide.contentW).toBeLessThan(normal.contentW);
      expect(wide.contentH).toBeLessThan(normal.contentH);
    });
  });

  describe("custom scale clamping", () => {
    it("clamps below minimum to 10", () => {
      expect(clampCustomScale(5)).toBe(10);
    });

    it("clamps above maximum to 200", () => {
      expect(clampCustomScale(300)).toBe(200);
    });

    it("keeps valid values unchanged", () => {
      expect(clampCustomScale(75)).toBe(75);
    });
  });

  describe("repeat rows clamping", () => {
    it("clamps negative to 0", () => {
      expect(clampRepeatRows(-1)).toBe(0);
    });

    it("clamps above 20 to 20", () => {
      expect(clampRepeatRows(25)).toBe(20);
    });

    it("keeps valid values", () => {
      expect(clampRepeatRows(3)).toBe(3);
    });
  });

  describe("margin values", () => {
    it("normal is 72px (1 inch)", () => {
      expect(MARGIN_VALUES.normal).toBe(72);
    });

    it("narrow is 36px (0.5 inch)", () => {
      expect(MARGIN_VALUES.narrow).toBe(36);
    });

    it("wide is 108px (1.5 inch)", () => {
      expect(MARGIN_VALUES.wide).toBe(108);
    });
  });
});
