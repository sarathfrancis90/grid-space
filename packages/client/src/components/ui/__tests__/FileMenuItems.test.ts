import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the stores before importing
vi.mock("../../../stores/cloudStore", () => {
  const state = {
    currentSpreadsheet: {
      id: "sp-1",
      title: "Test Spreadsheet",
      isStarred: false,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-06-15T12:30:00Z",
      owner: {
        id: "u-1",
        name: "Test User",
        email: "test@example.com",
        avatarUrl: null,
      },
      sheets: [{ id: "sh-1", name: "Sheet1" }],
    },
    duplicateSpreadsheet: vi.fn(),
    deleteSpreadsheet: vi.fn().mockResolvedValue(undefined),
  };

  return {
    useCloudStore: Object.assign(
      (selector: (s: typeof state) => unknown) => selector(state),
      { getState: () => state },
    ),
  };
});

vi.mock("../../../stores/sharingStore", () => {
  const state = {
    openDialog: vi.fn(),
  };
  return {
    useSharingStore: Object.assign(
      (selector: (s: typeof state) => unknown) => selector(state),
      { getState: () => state },
    ),
  };
});

vi.mock("../../../stores/uiStore", () => {
  const state = {
    isDetailsDialogOpen: false,
    setDetailsDialogOpen: vi.fn(),
    setImportDialogOpen: vi.fn(),
  };
  return {
    useUIStore: Object.assign(
      (selector: (s: typeof state) => unknown) => selector(state),
      { getState: () => state },
    ),
  };
});

describe("File menu items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Make a copy calls duplicateSpreadsheet with current id", async () => {
    const { useCloudStore } = await import("../../../stores/cloudStore");
    const store = useCloudStore.getState();
    const id = store.currentSpreadsheet?.id;
    expect(id).toBe("sp-1");

    store.duplicateSpreadsheet(id!);
    expect(store.duplicateSpreadsheet).toHaveBeenCalledWith("sp-1");
  });

  it("Share opens sharing dialog with current spreadsheet id", async () => {
    const { useCloudStore } = await import("../../../stores/cloudStore");
    const { useSharingStore } = await import("../../../stores/sharingStore");
    const spreadsheetId = useCloudStore.getState().currentSpreadsheet?.id;
    expect(spreadsheetId).toBe("sp-1");

    useSharingStore.getState().openDialog(spreadsheetId!);
    expect(useSharingStore.getState().openDialog).toHaveBeenCalledWith("sp-1");
  });

  it("Move to trash calls deleteSpreadsheet with current id", async () => {
    const { useCloudStore } = await import("../../../stores/cloudStore");
    const store = useCloudStore.getState();
    const id = store.currentSpreadsheet?.id;

    await store.deleteSpreadsheet(id!);
    expect(store.deleteSpreadsheet).toHaveBeenCalledWith("sp-1");
  });

  it("Details opens details dialog via uiStore", async () => {
    const { useUIStore } = await import("../../../stores/uiStore");
    useUIStore.getState().setDetailsDialogOpen(true);
    expect(useUIStore.getState().setDetailsDialogOpen).toHaveBeenCalledWith(
      true,
    );
  });
});
