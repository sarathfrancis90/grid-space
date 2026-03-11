import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../../../stores/uiStore";

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

  describe("Apps Script opens script editor", () => {
    it("setScriptEditorOpen(true) opens script editor for Apps Script", () => {
      useUIStore.getState().setScriptEditorOpen(true);
      expect(useUIStore.getState().isScriptEditorOpen).toBe(true);
    });
  });
});
