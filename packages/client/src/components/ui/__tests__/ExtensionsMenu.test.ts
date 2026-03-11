import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUIStore } from "../../../stores/uiStore";

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

describe("Extensions menu — store integration", () => {
  beforeEach(() => {
    useUIStore.getState().setAddOnsDialogOpen(false);
    useUIStore.getState().setScriptEditorOpen(false);
  });

  describe("Add-ons dialog state", () => {
    it("isAddOnsDialogOpen defaults to false", () => {
      expect(useUIStore.getState().isAddOnsDialogOpen).toBe(false);
    });

    it("setAddOnsDialogOpen(true) opens dialog", () => {
      useUIStore.getState().setAddOnsDialogOpen(true);
      expect(useUIStore.getState().isAddOnsDialogOpen).toBe(true);
    });

    it("setAddOnsDialogOpen(false) closes dialog", () => {
      useUIStore.getState().setAddOnsDialogOpen(true);
      useUIStore.getState().setAddOnsDialogOpen(false);
      expect(useUIStore.getState().isAddOnsDialogOpen).toBe(false);
    });
  });

  describe("Script editor state (Apps Script)", () => {
    it("isScriptEditorOpen defaults to false", () => {
      expect(useUIStore.getState().isScriptEditorOpen).toBe(false);
    });

    it("setScriptEditorOpen(true) opens editor", () => {
      useUIStore.getState().setScriptEditorOpen(true);
      expect(useUIStore.getState().isScriptEditorOpen).toBe(true);
    });
  });
});
