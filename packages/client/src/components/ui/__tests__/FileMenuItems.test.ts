import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUIStore } from "../../../stores/uiStore";
import { useCloudStore } from "../../../stores/cloudStore";

// Mock the API to prevent real network calls
vi.mock("../../../services/api", () => ({
  api: {
    get: vi.fn(),
    getAll: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("File menu items — store integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.getState().setDetailsDialogOpen(false);
  });

  describe("Details dialog state", () => {
    it("isDetailsDialogOpen defaults to false", () => {
      expect(useUIStore.getState().isDetailsDialogOpen).toBe(false);
    });

    it("setDetailsDialogOpen(true) opens dialog", () => {
      useUIStore.getState().setDetailsDialogOpen(true);
      expect(useUIStore.getState().isDetailsDialogOpen).toBe(true);
    });

    it("setDetailsDialogOpen(false) closes dialog", () => {
      useUIStore.getState().setDetailsDialogOpen(true);
      useUIStore.getState().setDetailsDialogOpen(false);
      expect(useUIStore.getState().isDetailsDialogOpen).toBe(false);
    });
  });

  describe("Trash (soft-delete) store integration", () => {
    it("deleteSpreadsheet removes item from list", async () => {
      const { api } = await import("../../../services/api");
      (api.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

      // Seed a spreadsheet into the store
      useCloudStore.setState({
        spreadsheets: [
          {
            id: "sp-1",
            title: "Test Sheet",
            isStarred: false,
            isTemplate: false,
            folderId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            owner: { id: "u1", name: "Alice", avatarUrl: null },
            role: "owner",
          },
        ],
        total: 1,
      });

      await useCloudStore.getState().deleteSpreadsheet("sp-1");

      expect(useCloudStore.getState().spreadsheets).toHaveLength(0);
      expect(useCloudStore.getState().total).toBe(0);
    });
  });

  describe("Trash restore store integration", () => {
    it("restoreSpreadsheet removes item from trash list", async () => {
      const { api } = await import("../../../services/api");
      (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

      useCloudStore.setState({
        trashItems: [
          {
            id: "sp-2",
            title: "Trashed Sheet",
            deletedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            owner: { id: "u1", name: "Alice", avatarUrl: null },
          },
        ],
        trashTotal: 1,
      });

      await useCloudStore.getState().restoreSpreadsheet("sp-2");

      expect(useCloudStore.getState().trashItems).toHaveLength(0);
      expect(useCloudStore.getState().trashTotal).toBe(0);
    });
  });

  describe("Duplicate spreadsheet store integration", () => {
    it("duplicateSpreadsheet adds copy to list", async () => {
      const { api } = await import("../../../services/api");
      const mockCopy = {
        id: "sp-copy",
        title: "Copy of Test",
        isStarred: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        owner: {
          id: "u1",
          name: "Alice",
          email: "alice@test.com",
          avatarUrl: null,
        },
        sheets: [],
      };
      (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockCopy);

      useCloudStore.setState({
        spreadsheets: [],
        total: 0,
      });

      const result = await useCloudStore
        .getState()
        .duplicateSpreadsheet("sp-1");

      expect(result.id).toBe("sp-copy");
      expect(useCloudStore.getState().spreadsheets).toHaveLength(1);
      expect(useCloudStore.getState().spreadsheets[0].title).toBe(
        "Copy of Test",
      );
      expect(useCloudStore.getState().total).toBe(1);
    });
  });
});
