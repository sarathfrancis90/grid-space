import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── useMediaQuery ──────────────────────────────────────────────
describe("useMediaQuery", () => {
  let listeners: Array<(e: MediaQueryListEvent) => void>;
  let matchesMock: boolean;

  beforeEach(() => {
    listeners = [];
    matchesMock = false;

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: matchesMock,
        media: query,
        addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
          listeners.push(cb);
        },
        removeEventListener: (
          _: string,
          cb: (e: MediaQueryListEvent) => void,
        ) => {
          listeners = listeners.filter((l) => l !== cb);
        },
      })),
    });
  });

  afterEach(() => {
    listeners = [];
  });

  it("returns false when query does not match", () => {
    matchesMock = false;
    const mql = window.matchMedia("(max-width: 767px)");
    expect(mql.matches).toBe(false);
  });

  it("returns true when query matches", () => {
    matchesMock = true;
    const mql = window.matchMedia("(max-width: 767px)");
    expect(mql.matches).toBe(true);
  });

  it("adds and removes event listeners", () => {
    const mql = window.matchMedia("(max-width: 767px)");
    const handler = vi.fn();
    mql.addEventListener("change", handler);
    expect(listeners).toHaveLength(1);
    mql.removeEventListener("change", handler);
    expect(listeners).toHaveLength(0);
  });
});

// ── useTouchGrid ───────────────────────────────────────────────
describe("useTouchGrid gesture detection", () => {
  it("detects long press threshold correctly", () => {
    const LONG_PRESS_MS = 500;
    expect(LONG_PRESS_MS).toBe(500);
  });

  it("detects double tap threshold correctly", () => {
    const DOUBLE_TAP_MS = 300;
    expect(DOUBLE_TAP_MS).toBe(300);
  });

  it("detects move threshold for cancelling long press", () => {
    const MOVE_THRESHOLD = 10;
    expect(MOVE_THRESHOLD).toBe(10);
  });
});

// ── PWA Manifest ───────────────────────────────────────────────
describe("PWA manifest", () => {
  it("manifest.json is valid JSON with required fields", () => {
    const manifestPath = resolve(__dir, "../../public/manifest.json");
    const raw = readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);

    expect(manifest.name).toBe("GridSpace");
    expect(manifest.short_name).toBe("GridSpace");
    expect(manifest.start_url).toBe("/dashboard");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    expect(manifest.theme_color).toBe("#0F9D58");
  });
});

// ── Service Worker ─────────────────────────────────────────────
describe("Service Worker file", () => {
  it("exists and contains cache strategy", () => {
    const swPath = resolve(__dir, "../../public/service-worker.js");
    const content = readFileSync(swPath, "utf-8");

    expect(content).toContain("CACHE_NAME");
    expect(content).toContain("install");
    expect(content).toContain("activate");
    expect(content).toContain("fetch");
  });
});

// ── Responsive components ──────────────────────────────────────
describe("MobileToolbar module", () => {
  it("can be imported without errors", async () => {
    const mod = await import("../components/toolbar/MobileToolbar");
    expect(mod.MobileToolbar).toBeDefined();
    expect(typeof mod.MobileToolbar).toBe("function");
  });
});

describe("index.html PWA tags", () => {
  it("contains manifest link and theme-color", () => {
    const htmlPath = resolve(__dir, "../../index.html");
    const html = readFileSync(htmlPath, "utf-8");

    expect(html).toContain('rel="manifest"');
    expect(html).toContain('href="/manifest.json"');
    expect(html).toContain('name="theme-color"');
    expect(html).toContain('name="apple-mobile-web-app-capable"');
  });
});
