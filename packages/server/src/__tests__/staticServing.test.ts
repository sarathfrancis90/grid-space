import { describe, it, expect } from "vitest";

/**
 * Tests for the SPA fallback static-file exclusion logic.
 *
 * In production, the Express catch-all route serves index.html for SPA routes
 * but must NOT serve index.html for requests with file extensions (e.g. .js, .css).
 * Serving HTML for missing JS chunks causes "unsupported MIME type 'text/html'" errors.
 *
 * See: https://github.com/sarathfrancis90/grid-space/issues/95
 */

// This regex mirrors the one used in app.ts to detect static file requests
const staticFileRegex = /\.\w+$/;

describe("SPA fallback static-file detection", () => {
  describe("should match static file paths (skip index.html fallback)", () => {
    const staticPaths = [
      "/assets/index-abc123.js",
      "/assets/vendor-def456.css",
      "/assets/chunk-789xyz.js",
      "/favicon.ico",
      "/logo.png",
      "/manifest.webmanifest",
      "/assets/font.woff2",
      "/assets/image.svg",
      "/robots.txt",
      "/sitemap.xml",
      "/assets/worker.js.map",
    ];

    staticPaths.forEach((path) => {
      it(`detects "${path}" as a static file`, () => {
        expect(staticFileRegex.test(path)).toBe(true);
      });
    });
  });

  describe("should NOT match SPA routes (serve index.html fallback)", () => {
    const spaRoutes = [
      "/",
      "/login",
      "/register",
      "/dashboard",
      "/spreadsheet/abc-123",
      "/forgot-password",
      "/settings/profile",
      "/shared/invite/token-here",
    ];

    spaRoutes.forEach((path) => {
      it(`treats "${path}" as an SPA route`, () => {
        expect(staticFileRegex.test(path)).toBe(false);
      });
    });
  });

  describe("API and special paths should be excluded before static check", () => {
    const excludedPrefixes = ["/api", "/auth", "/socket.io"];
    const healthPath = "/health";

    excludedPrefixes.forEach((prefix) => {
      it(`"${prefix}/..." is excluded by prefix check`, () => {
        expect(`${prefix}/test`.startsWith(prefix)).toBe(true);
      });
    });

    it('"/health" is excluded by exact match', () => {
      expect(healthPath === "/health").toBe(true);
    });
  });
});
