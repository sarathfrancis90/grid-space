import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../../../stores/uiStore";

describe("Extensions menu — store integration", () => {
  beforeEach(() => {
    useUIStore.getState().setAddonsDialogOpen(false);
    useUIStore.getState().setScriptEditorOpen(false);
  });

  describe("Add-ons dialog state", () => {
    it("isAddonsDialogOpen defaults to false", () => {
      expect(useUIStore.getState().isAddonsDialogOpen).toBe(false);
    });

    it("setAddonsDialogOpen(true) opens dialog", () => {
      useUIStore.getState().setAddonsDialogOpen(true);
      expect(useUIStore.getState().isAddonsDialogOpen).toBe(true);
    });

    it("setAddonsDialogOpen(false) closes dialog", () => {
      useUIStore.getState().setAddonsDialogOpen(true);
      useUIStore.getState().setAddonsDialogOpen(false);
      expect(useUIStore.getState().isAddonsDialogOpen).toBe(false);
    });
  });

  describe("Apps Script opens script editor", () => {
    it("setScriptEditorOpen(true) opens script editor", () => {
      useUIStore.getState().setScriptEditorOpen(true);
      expect(useUIStore.getState().isScriptEditorOpen).toBe(true);
    });
  });
});
