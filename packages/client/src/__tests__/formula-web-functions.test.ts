import { describe, it, expect } from "vitest";
import { getFunction, hasFunction } from "../components/formula/functions";

describe("Web/Import Functions", () => {
  describe("ENCODEURL", () => {
    it("is registered in function registry", () => {
      expect(hasFunction("ENCODEURL")).toBe(true);
    });

    it("encodes a simple string", () => {
      const fn = getFunction("ENCODEURL")!;
      expect(fn("hello world")).toBe("hello%20world");
    });

    it("encodes special characters", () => {
      const fn = getFunction("ENCODEURL")!;
      expect(fn("a=1&b=2")).toBe("a%3D1%26b%3D2");
    });

    it("encodes a URL path", () => {
      const fn = getFunction("ENCODEURL")!;
      expect(fn("https://example.com/path?q=test")).toBe(
        "https%3A%2F%2Fexample.com%2Fpath%3Fq%3Dtest",
      );
    });

    it("returns empty string for null", () => {
      const fn = getFunction("ENCODEURL")!;
      expect(fn(null)).toBe("");
    });

    it("converts numbers to string before encoding", () => {
      const fn = getFunction("ENCODEURL")!;
      expect(fn(42)).toBe("42");
    });

    it("returns #VALUE! with no arguments", () => {
      const fn = getFunction("ENCODEURL")!;
      expect(fn()).toBe("#VALUE!");
    });
  });

  describe("ISURL", () => {
    it("is registered in function registry", () => {
      expect(hasFunction("ISURL")).toBe(true);
    });

    it("returns true for valid http URL", () => {
      const fn = getFunction("ISURL")!;
      expect(fn("http://example.com")).toBe(true);
    });

    it("returns true for valid https URL", () => {
      const fn = getFunction("ISURL")!;
      expect(fn("https://example.com/path?q=test")).toBe(true);
    });

    it("returns false for non-http protocols", () => {
      const fn = getFunction("ISURL")!;
      expect(fn("ftp://example.com")).toBe(false);
    });

    it("returns false for plain text", () => {
      const fn = getFunction("ISURL")!;
      expect(fn("not a url")).toBe(false);
    });

    it("returns false for empty string", () => {
      const fn = getFunction("ISURL")!;
      expect(fn("")).toBe(false);
    });

    it("returns false for null", () => {
      const fn = getFunction("ISURL")!;
      expect(fn(null)).toBe(false);
    });

    it("returns false for numbers", () => {
      const fn = getFunction("ISURL")!;
      expect(fn(42)).toBe(false);
    });

    it("returns #VALUE! with no arguments", () => {
      const fn = getFunction("ISURL")!;
      expect(fn()).toBe("#VALUE!");
    });
  });

  describe("IMPORTHTML", () => {
    it("is registered in function registry", () => {
      expect(hasFunction("IMPORTHTML")).toBe(true);
    });

    it("returns metadata marker for table query", () => {
      const fn = getFunction("IMPORTHTML")!;
      const result = fn("https://example.com", "table", 1);
      expect(typeof result).toBe("string");
      expect(String(result)).toContain("__IMPORTHTML__");
      const parsed = JSON.parse(String(result).replace("__IMPORTHTML__", ""));
      expect(parsed.url).toBe("https://example.com");
      expect(parsed.query).toBe("table");
      expect(parsed.index).toBe(1);
    });

    it("returns metadata marker for list query", () => {
      const fn = getFunction("IMPORTHTML")!;
      const result = fn("https://example.com", "list", 2);
      const parsed = JSON.parse(String(result).replace("__IMPORTHTML__", ""));
      expect(parsed.query).toBe("list");
      expect(parsed.index).toBe(2);
    });

    it("is case-insensitive for query parameter", () => {
      const fn = getFunction("IMPORTHTML")!;
      const result = fn("https://example.com", "TABLE", 1);
      const parsed = JSON.parse(String(result).replace("__IMPORTHTML__", ""));
      expect(parsed.query).toBe("table");
    });

    it("returns #VALUE! for invalid query type", () => {
      const fn = getFunction("IMPORTHTML")!;
      expect(fn("https://example.com", "div", 1)).toBe("#VALUE!");
    });

    it("returns #VALUE! with fewer than 3 arguments", () => {
      const fn = getFunction("IMPORTHTML")!;
      expect(fn("https://example.com", "table")).toBe("#VALUE!");
    });

    it("returns #VALUE! with empty URL", () => {
      const fn = getFunction("IMPORTHTML")!;
      expect(fn("", "table", 1)).toBe("#VALUE!");
    });

    it("returns #VALUE! with invalid index", () => {
      const fn = getFunction("IMPORTHTML")!;
      expect(fn("https://example.com", "table", 0)).toBe("#VALUE!");
      expect(fn("https://example.com", "table", -1)).toBe("#VALUE!");
    });
  });

  describe("IMPORTXML", () => {
    it("is registered in function registry", () => {
      expect(hasFunction("IMPORTXML")).toBe(true);
    });

    it("returns metadata marker with url and xpath", () => {
      const fn = getFunction("IMPORTXML")!;
      const result = fn("https://example.com/data.xml", "//item/title");
      expect(typeof result).toBe("string");
      expect(String(result)).toContain("__IMPORTXML__");
      const parsed = JSON.parse(String(result).replace("__IMPORTXML__", ""));
      expect(parsed.url).toBe("https://example.com/data.xml");
      expect(parsed.xpath).toBe("//item/title");
    });

    it("returns #VALUE! with fewer than 2 arguments", () => {
      const fn = getFunction("IMPORTXML")!;
      expect(fn("https://example.com")).toBe("#VALUE!");
    });

    it("returns #VALUE! with empty url", () => {
      const fn = getFunction("IMPORTXML")!;
      expect(fn("", "//item")).toBe("#VALUE!");
    });

    it("returns #VALUE! with empty xpath", () => {
      const fn = getFunction("IMPORTXML")!;
      expect(fn("https://example.com", "")).toBe("#VALUE!");
    });
  });

  describe("IMPORTFEED", () => {
    it("is registered in function registry", () => {
      expect(hasFunction("IMPORTFEED")).toBe(true);
    });

    it("returns metadata marker with url", () => {
      const fn = getFunction("IMPORTFEED")!;
      const result = fn("https://example.com/feed.xml");
      expect(typeof result).toBe("string");
      expect(String(result)).toContain("__IMPORTFEED__");
      const parsed = JSON.parse(String(result).replace("__IMPORTFEED__", ""));
      expect(parsed.url).toBe("https://example.com/feed.xml");
    });

    it("accepts optional parameters", () => {
      const fn = getFunction("IMPORTFEED")!;
      const result = fn("https://example.com/feed.xml", "items", true, 10);
      const parsed = JSON.parse(String(result).replace("__IMPORTFEED__", ""));
      expect(parsed.query).toBe("items");
      expect(parsed.headers).toBe(true);
      expect(parsed.numItems).toBe(10);
    });

    it("returns #VALUE! with no arguments", () => {
      const fn = getFunction("IMPORTFEED")!;
      expect(fn()).toBe("#VALUE!");
    });

    it("returns #VALUE! with empty URL", () => {
      const fn = getFunction("IMPORTFEED")!;
      expect(fn("")).toBe("#VALUE!");
    });
  });

  describe("FINANCE", () => {
    it("is registered in function registry", () => {
      expect(hasFunction("FINANCE")).toBe(true);
    });

    it("returns metadata marker with ticker", () => {
      const fn = getFunction("FINANCE")!;
      const result = fn("GOOG");
      expect(typeof result).toBe("string");
      expect(String(result)).toContain("__FINANCE__");
      const parsed = JSON.parse(String(result).replace("__FINANCE__", ""));
      expect(parsed.ticker).toBe("GOOG");
      expect(parsed.attribute).toBe("price");
    });

    it("uppercases ticker", () => {
      const fn = getFunction("FINANCE")!;
      const result = fn("aapl");
      const parsed = JSON.parse(String(result).replace("__FINANCE__", ""));
      expect(parsed.ticker).toBe("AAPL");
    });

    it("accepts optional attribute parameter", () => {
      const fn = getFunction("FINANCE")!;
      const result = fn("MSFT", "volume");
      const parsed = JSON.parse(String(result).replace("__FINANCE__", ""));
      expect(parsed.attribute).toBe("volume");
    });

    it("accepts date range parameters", () => {
      const fn = getFunction("FINANCE")!;
      const result = fn("GOOG", "close", "2024-01-01", "2024-12-31");
      const parsed = JSON.parse(String(result).replace("__FINANCE__", ""));
      expect(parsed.startDate).toBe("2024-01-01");
      expect(parsed.endDate).toBe("2024-12-31");
    });

    it("returns #VALUE! with no arguments", () => {
      const fn = getFunction("FINANCE")!;
      expect(fn()).toBe("#VALUE!");
    });

    it("returns #VALUE! with empty ticker", () => {
      const fn = getFunction("FINANCE")!;
      expect(fn("")).toBe("#VALUE!");
    });
  });

  describe("TRANSLATE", () => {
    it("is registered in function registry", () => {
      expect(hasFunction("TRANSLATE")).toBe(true);
    });

    it("returns metadata marker with text and languages", () => {
      const fn = getFunction("TRANSLATE")!;
      const result = fn("Hello", "en", "es");
      expect(typeof result).toBe("string");
      expect(String(result)).toContain("__TRANSLATE__");
      const parsed = JSON.parse(String(result).replace("__TRANSLATE__", ""));
      expect(parsed.text).toBe("Hello");
      expect(parsed.sourceLang).toBe("en");
      expect(parsed.targetLang).toBe("es");
    });

    it("returns #VALUE! with fewer than 3 arguments", () => {
      const fn = getFunction("TRANSLATE")!;
      expect(fn("Hello", "en")).toBe("#VALUE!");
    });

    it("returns #VALUE! with empty text", () => {
      const fn = getFunction("TRANSLATE")!;
      expect(fn("", "en", "es")).toBe("#VALUE!");
    });

    it("returns #VALUE! with empty source language", () => {
      const fn = getFunction("TRANSLATE")!;
      expect(fn("Hello", "", "es")).toBe("#VALUE!");
    });

    it("returns #VALUE! with empty target language", () => {
      const fn = getFunction("TRANSLATE")!;
      expect(fn("Hello", "en", "")).toBe("#VALUE!");
    });
  });
});
