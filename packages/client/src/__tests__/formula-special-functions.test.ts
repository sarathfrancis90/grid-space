import { describe, it, expect } from "vitest";
import { getFunction, hasFunction } from "../components/formula/functions";

describe("Special Functions (S16-010 to S16-012)", () => {
  describe("IMPORTDATA (S16-010)", () => {
    it("is registered in function registry", () => {
      expect(hasFunction("IMPORTDATA")).toBe(true);
    });

    it("returns metadata marker with URL", () => {
      const fn = getFunction("IMPORTDATA");
      expect(fn).toBeTruthy();
      const result = fn!("https://example.com/data.csv");
      expect(result).toBe("__IMPORTDATA__https://example.com/data.csv");
    });

    it("returns #VALUE! with no arguments", () => {
      const fn = getFunction("IMPORTDATA");
      expect(fn!()).toBe("#VALUE!");
    });

    it("returns #VALUE! with empty URL", () => {
      const fn = getFunction("IMPORTDATA");
      expect(fn!("")).toBe("#VALUE!");
    });
  });

  describe("IMPORTRANGE (S16-011)", () => {
    it("is registered in function registry", () => {
      expect(hasFunction("IMPORTRANGE")).toBe(true);
    });

    it("returns metadata marker with spreadsheetId and range", () => {
      const fn = getFunction("IMPORTRANGE");
      expect(fn).toBeTruthy();
      const result = fn!("spreadsheet-123", "Sheet1!A1:B10");
      expect(result).toBe("__IMPORTRANGE__spreadsheet-123__Sheet1!A1:B10");
    });

    it("returns #VALUE! with fewer than 2 arguments", () => {
      const fn = getFunction("IMPORTRANGE");
      expect(fn!("only-one")).toBe("#VALUE!");
    });

    it("returns #VALUE! with empty arguments", () => {
      const fn = getFunction("IMPORTRANGE");
      expect(fn!("", "A1:B10")).toBe("#VALUE!");
    });
  });

  describe("IMAGE (S16-012)", () => {
    it("is registered in function registry", () => {
      expect(hasFunction("IMAGE")).toBe(true);
    });

    it("returns metadata marker with URL", () => {
      const fn = getFunction("IMAGE");
      expect(fn).toBeTruthy();
      const result = fn!("https://example.com/logo.png");
      expect(typeof result).toBe("string");
      expect(String(result)).toContain("__IMAGE__");
      expect(String(result)).toContain("https://example.com/logo.png");
    });

    it("accepts optional mode parameter", () => {
      const fn = getFunction("IMAGE");
      const result = fn!("https://example.com/logo.png", 2);
      const parsed = JSON.parse(String(result).replace("__IMAGE__", ""));
      expect(parsed.url).toBe("https://example.com/logo.png");
      expect(parsed.mode).toBe(2);
    });

    it("accepts height and width parameters", () => {
      const fn = getFunction("IMAGE");
      const result = fn!("https://example.com/logo.png", 4, 100, 200);
      const parsed = JSON.parse(String(result).replace("__IMAGE__", ""));
      expect(parsed.height).toBe(100);
      expect(parsed.width).toBe(200);
    });

    it("returns #VALUE! with no arguments", () => {
      const fn = getFunction("IMAGE");
      expect(fn!()).toBe("#VALUE!");
    });

    it("returns #VALUE! with empty URL", () => {
      const fn = getFunction("IMAGE");
      expect(fn!("")).toBe("#VALUE!");
    });
  });
});
