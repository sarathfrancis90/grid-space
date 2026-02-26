import "@testing-library/jest-dom/vitest";
import { enableMapSet } from "immer";

enableMapSet();

// Polyfill ResizeObserver for jsdom
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    constructor(_callback: ResizeObserverCallback) {
      void _callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
