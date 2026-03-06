import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the logger before importing proxy service
vi.mock("../utils/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Proxy Service", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("URL validation", () => {
    it("rejects invalid URLs", async () => {
      const { fetchUrl } = await import("../services/proxy.service");
      await expect(fetchUrl("not-a-url")).rejects.toThrow("Invalid URL");
    });

    it("rejects non-http protocols", async () => {
      const { fetchUrl } = await import("../services/proxy.service");
      await expect(fetchUrl("ftp://example.com")).rejects.toThrow(
        "Only http and https URLs are allowed",
      );
    });

    it("blocks localhost", async () => {
      const { fetchUrl } = await import("../services/proxy.service");
      await expect(fetchUrl("http://localhost/admin")).rejects.toThrow(
        "Access to this host is not allowed",
      );
    });

    it("blocks 127.0.0.1", async () => {
      const { fetchUrl } = await import("../services/proxy.service");
      await expect(fetchUrl("http://127.0.0.1/secret")).rejects.toThrow(
        "Access to this host is not allowed",
      );
    });

    it("blocks metadata endpoint", async () => {
      const { fetchUrl } = await import("../services/proxy.service");
      await expect(
        fetchUrl("http://169.254.169.254/latest/meta-data"),
      ).rejects.toThrow("Access to this host is not allowed");
    });
  });

  describe("successful fetch", () => {
    it("returns content and content type for valid URL", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "text/html" }),
        text: vi.fn().mockResolvedValue("<html><body>hello</body></html>"),
      });

      const { fetchUrl } = await import("../services/proxy.service");
      const result = await fetchUrl("https://example.com");

      expect(result.content).toBe("<html><body>hello</body></html>");
      expect(result.contentType).toBe("text/html");
      expect(result.statusCode).toBe(200);
    });
  });

  describe("error handling", () => {
    it("throws on non-ok response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: new Headers(),
      });

      const { fetchUrl } = await import("../services/proxy.service");
      await expect(fetchUrl("https://example.com/missing")).rejects.toThrow(
        "Remote server returned 404 Not Found",
      );
    });

    it("throws on oversized content-length header", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-length": "10000000" }),
        text: vi.fn().mockResolvedValue(""),
      });

      const { fetchUrl } = await import("../services/proxy.service");
      await expect(fetchUrl("https://example.com/big")).rejects.toThrow(
        "Response too large",
      );
    });
  });
});
