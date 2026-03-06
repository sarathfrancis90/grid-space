import { describe, it, expect } from "vitest";

/**
 * Tests for the SPA fallback logic that prevents serving index.html
 * for static asset requests (which causes MIME type errors).
 *
 * The actual middleware runs only in production, so we test the
 * filtering logic directly.
 */

const staticExtensions =
  /\.(js|css|map|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|webmanifest|json)$/;

function shouldServeSpaFallback(path: string): boolean {
  if (
    path.startsWith("/api") ||
    path.startsWith("/auth") ||
    path.startsWith("/socket.io") ||
    path === "/health" ||
    staticExtensions.test(path)
  ) {
    return false;
  }
  return true;
}

describe("SPA fallback routing logic", () => {
  describe("should serve index.html for client-side routes", () => {
    it.each(["/", "/login", "/register", "/dashboard", "/spreadsheet/abc123"])(
      "serves fallback for %s",
      (path) => {
        expect(shouldServeSpaFallback(path)).toBe(true);
      },
    );
  });

  describe("should NOT serve index.html for API/service paths", () => {
    it.each([
      "/api/spreadsheets",
      "/api/health",
      "/auth/login",
      "/auth/google/callback",
      "/socket.io/",
      "/health",
    ])("skips fallback for %s", (path) => {
      expect(shouldServeSpaFallback(path)).toBe(false);
    });
  });

  describe("should NOT serve index.html for static asset requests", () => {
    it.each([
      "/assets/index-abc123.js",
      "/assets/vendor-def456.js",
      "/assets/style-ghi789.css",
      "/assets/index-abc123.js.map",
      "/favicon.ico",
      "/manifest.webmanifest",
      "/assets/logo.png",
      "/assets/font.woff2",
      "/assets/image.webp",
      "/assets/data.json",
      "/assets/icon.svg",
      "/assets/font.ttf",
      "/assets/font.eot",
      "/assets/photo.jpg",
      "/assets/photo.jpeg",
      "/assets/anim.gif",
      "/assets/font.woff",
    ])("skips fallback for %s", (path) => {
      expect(shouldServeSpaFallback(path)).toBe(false);
    });
  });

  describe("staticExtensions regex correctness", () => {
    it("does not match paths without extensions", () => {
      expect(staticExtensions.test("/dashboard")).toBe(false);
      expect(staticExtensions.test("/login")).toBe(false);
    });

    it("does not match unknown extensions", () => {
      expect(staticExtensions.test("/file.xyz")).toBe(false);
      expect(staticExtensions.test("/file.html")).toBe(false);
    });

    it("matches all expected static extensions", () => {
      const extensions = [
        "js",
        "css",
        "map",
        "png",
        "jpg",
        "jpeg",
        "gif",
        "svg",
        "ico",
        "woff",
        "woff2",
        "ttf",
        "eot",
        "webp",
        "webmanifest",
        "json",
      ];
      for (const ext of extensions) {
        expect(staticExtensions.test(`/file.${ext}`)).toBe(true);
      }
    });
  });
});
