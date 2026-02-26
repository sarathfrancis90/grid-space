import { describe, it, expect, beforeEach, vi } from "vitest";
import { useOfflineStore } from "../stores/offlineStore";
import type { OfflineEdit } from "../utils/offlineQueue";

// Mock IndexedDB
import "fake-indexeddb/auto";

// In-memory mock store
let mockEditStore: OfflineEdit[] = [];
let mockNextId = 1;

function resetMockEditStore() {
  mockEditStore = [];
  mockNextId = 1;
}

// Mock the offlineQueue module
vi.mock("../utils/offlineQueue", () => ({
  enqueueEdit: vi.fn(async (edit: Omit<OfflineEdit, "id" | "timestamp">) => {
    mockEditStore.push({ ...edit, id: mockNextId++, timestamp: Date.now() });
  }),
  getAllEdits: vi.fn(async () => [...mockEditStore]),
  clearAllEdits: vi.fn(async () => {
    mockEditStore = [];
  }),
  getEditCount: vi.fn(async () => mockEditStore.length),
}));

describe("offlineStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockEditStore();
    useOfflineStore.setState({
      isOnline: true,
      isServiceWorkerReady: false,
      pendingEditsCount: 0,
      syncStatus: "idle",
      lastSyncedAt: null,
    });
  });

  // S16-023: Offline state tracking
  it("has correct initial state", () => {
    const state = useOfflineStore.getState();
    expect(state.isOnline).toBe(true);
    expect(state.isServiceWorkerReady).toBe(false);
    expect(state.pendingEditsCount).toBe(0);
    expect(state.syncStatus).toBe("idle");
    expect(state.lastSyncedAt).toBeNull();
  });

  it("setOnline toggles online status", () => {
    useOfflineStore.getState().setOnline(false);
    expect(useOfflineStore.getState().isOnline).toBe(false);
    useOfflineStore.getState().setOnline(true);
    expect(useOfflineStore.getState().isOnline).toBe(true);
  });

  it("setServiceWorkerReady updates SW status", () => {
    useOfflineStore.getState().setServiceWorkerReady(true);
    expect(useOfflineStore.getState().isServiceWorkerReady).toBe(true);
  });

  it("setSyncStatus updates sync status", () => {
    useOfflineStore.getState().setSyncStatus("syncing");
    expect(useOfflineStore.getState().syncStatus).toBe("syncing");
    useOfflineStore.getState().setSyncStatus("error");
    expect(useOfflineStore.getState().syncStatus).toBe("error");
  });

  // S16-024: Add offline edits
  it("addOfflineEdit enqueues and updates count", async () => {
    await useOfflineStore.getState().addOfflineEdit({
      spreadsheetId: "sp-1",
      sheetId: "sheet-1",
      cell: "A1",
      value: "test",
    });

    expect(useOfflineStore.getState().pendingEditsCount).toBe(1);
  });

  it("addOfflineEdit increments count correctly", async () => {
    const store = useOfflineStore.getState();
    await store.addOfflineEdit({
      spreadsheetId: "sp-1",
      sheetId: "sheet-1",
      cell: "A1",
      value: 1,
    });
    await store.addOfflineEdit({
      spreadsheetId: "sp-1",
      sheetId: "sheet-1",
      cell: "A2",
      value: 2,
    });

    expect(useOfflineStore.getState().pendingEditsCount).toBe(2);
  });

  // S16-024: Sync edits on reconnect
  it("syncEdits sends all edits and clears queue", async () => {
    const store = useOfflineStore.getState();
    await store.addOfflineEdit({
      spreadsheetId: "sp-1",
      sheetId: "sheet-1",
      cell: "A1",
      value: "test1",
    });
    await store.addOfflineEdit({
      spreadsheetId: "sp-1",
      sheetId: "sheet-1",
      cell: "A2",
      value: "test2",
    });

    const sender = vi.fn(async () => {});

    await useOfflineStore.getState().syncEdits(sender);

    expect(sender).toHaveBeenCalledTimes(2);
    expect(useOfflineStore.getState().pendingEditsCount).toBe(0);
    expect(useOfflineStore.getState().syncStatus).toBe("idle");
    expect(useOfflineStore.getState().lastSyncedAt).not.toBeNull();
  });

  it("syncEdits sets error status on failure", async () => {
    const store = useOfflineStore.getState();
    await store.addOfflineEdit({
      spreadsheetId: "sp-1",
      sheetId: "sheet-1",
      cell: "A1",
      value: "test",
    });

    const sender = vi.fn(async () => {
      throw new Error("network error");
    });

    await useOfflineStore.getState().syncEdits(sender);

    expect(useOfflineStore.getState().syncStatus).toBe("error");
  });

  it("syncEdits does nothing when offline", async () => {
    useOfflineStore.setState({ isOnline: false });
    const sender = vi.fn();

    await useOfflineStore.getState().syncEdits(sender);

    expect(sender).not.toHaveBeenCalled();
  });

  it("syncEdits does nothing when already syncing", async () => {
    useOfflineStore.setState({ syncStatus: "syncing" });
    const sender = vi.fn();

    await useOfflineStore.getState().syncEdits(sender);

    expect(sender).not.toHaveBeenCalled();
  });

  it("setLastSyncedAt updates the timestamp", () => {
    const now = new Date().toISOString();
    useOfflineStore.getState().setLastSyncedAt(now);
    expect(useOfflineStore.getState().lastSyncedAt).toBe(now);
  });

  // S16-024: refreshPendingCount
  it("refreshPendingCount updates from IndexedDB", async () => {
    await useOfflineStore.getState().addOfflineEdit({
      spreadsheetId: "sp-1",
      sheetId: "sheet-1",
      cell: "A1",
      value: 1,
    });

    // Reset the store count to 0 to simulate a fresh page load
    useOfflineStore.setState({ pendingEditsCount: 0 });
    expect(useOfflineStore.getState().pendingEditsCount).toBe(0);

    await useOfflineStore.getState().refreshPendingCount();
    expect(useOfflineStore.getState().pendingEditsCount).toBe(1);
  });
});
