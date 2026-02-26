/**
 * Tests for numberFormat utility — all number format types.
 */
import { describe, it, expect } from "vitest";
import { formatCellValue } from "../utils/numberFormat";

describe("formatCellValue", () => {
  // --- General format ---
  describe("General format (S3-011)", () => {
    it("returns empty string for null", () => {
      expect(formatCellValue(null)).toBe("");
    });

    it("returns empty string for empty string", () => {
      expect(formatCellValue("")).toBe("");
    });

    it("returns boolean as TRUE/FALSE", () => {
      expect(formatCellValue(true)).toBe("TRUE");
      expect(formatCellValue(false)).toBe("FALSE");
    });

    it("returns number as-is for General format", () => {
      expect(formatCellValue(42)).toBe("42");
      expect(formatCellValue(3.14)).toBe("3.14");
    });

    it("returns string as-is for General format", () => {
      expect(formatCellValue("Hello")).toBe("Hello");
    });

    it("treats undefined format as General", () => {
      expect(formatCellValue(42, undefined)).toBe("42");
      expect(formatCellValue(42, "General")).toBe("42");
    });
  });

  // --- Number format ---
  describe("Number format (S3-012)", () => {
    it("formats with two decimals", () => {
      expect(formatCellValue(1234.5, "#,##0.00")).toBe("1,234.50");
    });

    it("formats negative numbers", () => {
      expect(formatCellValue(-1234.5, "#,##0.00")).toBe("-1,234.50");
    });

    it("formats zero", () => {
      expect(formatCellValue(0, "#,##0.00")).toBe("0.00");
    });

    it("formats without decimals", () => {
      expect(formatCellValue(1234.5, "#,##0")).toBe("1,235");
    });

    it("formats small numbers", () => {
      expect(formatCellValue(0.5, "0.00")).toBe("0.50");
    });
  });

  // --- Currency format ---
  describe("Currency format (S3-013)", () => {
    it("formats as USD", () => {
      expect(formatCellValue(1234.56, "$#,##0.00")).toBe("$1,234.56");
    });

    it("formats zero as currency", () => {
      expect(formatCellValue(0, "$#,##0.00")).toBe("$0.00");
    });

    it("formats negative currency", () => {
      expect(formatCellValue(-50, "$#,##0.00")).toBe("$-50.00");
    });
  });

  // --- Percent format ---
  describe("Percent format (S3-014)", () => {
    it("formats decimal as percent", () => {
      expect(formatCellValue(0.1234, "0.00%")).toBe("12.34%");
    });

    it("formats 1 as 100%", () => {
      expect(formatCellValue(1, "0%")).toBe("100%");
    });

    it("formats 0 as 0%", () => {
      expect(formatCellValue(0, "0.00%")).toBe("0.00%");
    });

    it("formats negative percent", () => {
      expect(formatCellValue(-0.05, "0.00%")).toBe("-5.00%");
    });
  });

  // --- Date format ---
  describe("Date format (S3-015)", () => {
    // Serial date for 2024-01-15: days from 1899-12-30
    // 2024-01-15 = serial 45307
    const serial20240115 = 45306;

    it("formats yyyy-mm-dd", () => {
      expect(formatCellValue(serial20240115, "yyyy-mm-dd")).toBe("2024-01-15");
    });

    it("formats mmmm d, yyyy", () => {
      expect(formatCellValue(serial20240115, "mmmm d, yyyy")).toBe(
        "January 15, 2024",
      );
    });

    it("formats mmm dd, yyyy", () => {
      expect(formatCellValue(serial20240115, "mmm dd, yyyy")).toBe(
        "Jan 15, 2024",
      );
    });

    it("formats mm/dd/yyyy", () => {
      expect(formatCellValue(serial20240115, "mm/dd/yyyy")).toBe("01/15/2024");
    });
  });

  // --- Time format ---
  describe("Time format (S3-016)", () => {
    // 14:30:00 = 0.604166... of a day
    // Serial 45307.604166... = 2024-01-15 14:30:00
    const serialWithTime = 45306 + 14 / 24 + 30 / 1440;

    it("formats hh:nn:ss", () => {
      expect(formatCellValue(serialWithTime, "hh:nn:ss")).toBe("14:30:00");
    });

    it("formats h:nn:ss AM/PM", () => {
      expect(formatCellValue(serialWithTime, "h:nn:ss AM/PM")).toBe(
        "2:30:00 PM",
      );
    });

    it("formats morning time as AM", () => {
      const morningSerial = 45306 + 9 / 24 + 15 / 1440;
      expect(formatCellValue(morningSerial, "h:nn AM/PM")).toBe("9:15 AM");
    });
  });

  // --- Scientific format ---
  describe("Scientific format (S3-017)", () => {
    it("formats in scientific notation", () => {
      expect(formatCellValue(12345, "0.00E+0")).toBe("1.23E+4");
    });

    it("formats small numbers in scientific notation", () => {
      expect(formatCellValue(0.00123, "0.00E+0")).toBe("1.23E-3");
    });

    it("formats 0 in scientific notation", () => {
      expect(formatCellValue(0, "0.00E+0")).toBe("0.00E+0");
    });
  });

  // --- Custom format ---
  describe("Custom format (S3-018)", () => {
    it("formats with custom pattern", () => {
      expect(formatCellValue(1234.5, "0.0")).toBe("1234.5");
    });

    it("handles string value with numeric format", () => {
      expect(formatCellValue("hello", "#,##0.00")).toBe("hello");
    });

    it("handles numeric string value", () => {
      expect(formatCellValue("42.5", "#,##0.00")).toBe("42.50");
    });
  });
});
