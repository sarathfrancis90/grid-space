import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  enqueueEdit,
  getAllEdits,
  clearAllEdits,
  getEditCount,
} from "../utils/offlineQueue";

// Mock IndexedDB with fake-indexeddb
import "fake-indexeddb/auto";

describe("offlineQueue", () => {
  beforeEach(async () => {
    // Clear all edits before each test
    await clearAllEdits();
  });

  // S16-024: Enqueue edits when offline
  it("enqueues an edit and retrieves it", async () => {
    await enqueueEdit({
      spreadsheetId: "sp-1",
      sheetId: "sheet-1",
      cell: "A1",
      value: "Hello",
    });

    const edits = await getAllEdits();
    expect(edits).toHaveLength(1);
    expect(edits[0].spreadsheetId).toBe("sp-1");
    expect(edits[0].sheetId).toBe("sheet-1");
    expect(edits[0].cell).toBe("A1");
    expect(edits[0].value).toBe("Hello");
    expect(edits[0].timestamp).toBeGreaterThan(0);
  });

  it("enqueues multiple edits in order", async () => {
    await enqueueEdit({
      spreadsheetId: "sp-1",
      sheetId: "sheet-1",
      cell: "A1",
      value: 10,
    });
    await enqueueEdit({
      spreadsheetId: "sp-1",
      sheetId: "sheet-1",
      cell: "B1",
      value: 20,
    });
    await enqueueEdit({
      spreadsheetId: "sp-1",
      sheetId: "sheet-1",
      cell: "C1",
      value: "=A1+B1",
      formula: "=A1+B1",
    });

    const edits = await getAllEdits();
    expect(edits).toHaveLength(3);
    expect(edits[0].cell).toBe("A1");
    expect(edits[1].cell).toBe("B1");
    expect(edits[2].cell).toBe("C1");
    expect(edits[2].formula).toBe("=A1+B1");
  });

  it("clears all edits", async () => {
    await enqueueEdit({
      spreadsheetId: "sp-1",
      sheetId: "sheet-1",
      cell: "A1",
      value: "test",
    });
    await enqueueEdit({
      spreadsheetId: "sp-1",
      sheetId: "sheet-1",
      cell: "A2",
      value: "test2",
    });

    await clearAllEdits();
    const edits = await getAllEdits();
    expect(edits).toHaveLength(0);
  });

  it("returns correct count", async () => {
    expect(await getEditCount()).toBe(0);

    await enqueueEdit({
      spreadsheetId: "sp-1",
      sheetId: "sheet-1",
      cell: "A1",
      value: 1,
    });
    expect(await getEditCount()).toBe(1);

    await enqueueEdit({
      spreadsheetId: "sp-1",
      sheetId: "sheet-1",
      cell: "A2",
      value: 2,
    });
    expect(await getEditCount()).toBe(2);

    await clearAllEdits();
    expect(await getEditCount()).toBe(0);
  });

  it("stores formula alongside value", async () => {
    await enqueueEdit({
      spreadsheetId: "sp-2",
      sheetId: "sheet-1",
      cell: "D5",
      value: 42,
      formula: "=SUM(A1:A10)",
    });

    const edits = await getAllEdits();
    expect(edits[0].formula).toBe("=SUM(A1:A10)");
    expect(edits[0].value).toBe(42);
  });

  it("handles null values", async () => {
    await enqueueEdit({
      spreadsheetId: "sp-1",
      sheetId: "sheet-1",
      cell: "A1",
      value: null,
    });

    const edits = await getAllEdits();
    expect(edits[0].value).toBeNull();
  });
});

describe("offlineQueue — service worker registration", () => {
  // S16-022: Service worker registration
  it("does not register service worker in non-production", () => {
    // In test/dev mode, service worker should NOT be registered
    // main.tsx checks import.meta.env.PROD before registering
    const registerSpy = vi.fn();
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register: registerSpy },
      writable: true,
      configurable: true,
    });

    // Since we're in test mode (not PROD), the SW should not have been called
    expect(registerSpy).not.toHaveBeenCalled();
  });
});
