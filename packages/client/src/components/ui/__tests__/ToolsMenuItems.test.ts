import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../../../stores/uiStore";

describe("Tools menu items — store integration", () => {
  beforeEach(() => {
    useUIStore.getState().setScriptEditorOpen(false);
    useUIStore.getState().setAccessibilityDialogOpen(false);
    useUIStore.getState().setCreateFormDialogOpen(false);
  });

  describe("Script editor dialog state", () => {
    it("isScriptEditorOpen defaults to false", () => {
      expect(useUIStore.getState().isScriptEditorOpen).toBe(false);
    });

    it("setScriptEditorOpen(true) opens dialog", () => {
      useUIStore.getState().setScriptEditorOpen(true);
      expect(useUIStore.getState().isScriptEditorOpen).toBe(true);
    });

    it("setScriptEditorOpen(false) closes dialog", () => {
      useUIStore.getState().setScriptEditorOpen(true);
      useUIStore.getState().setScriptEditorOpen(false);
      expect(useUIStore.getState().isScriptEditorOpen).toBe(false);
    });
  });

  describe("Accessibility dialog state", () => {
    it("isAccessibilityDialogOpen defaults to false", () => {
      expect(useUIStore.getState().isAccessibilityDialogOpen).toBe(false);
    });

    it("setAccessibilityDialogOpen(true) opens dialog", () => {
      useUIStore.getState().setAccessibilityDialogOpen(true);
      expect(useUIStore.getState().isAccessibilityDialogOpen).toBe(true);
    });

    it("setAccessibilityDialogOpen(false) closes dialog", () => {
      useUIStore.getState().setAccessibilityDialogOpen(true);
      useUIStore.getState().setAccessibilityDialogOpen(false);
      expect(useUIStore.getState().isAccessibilityDialogOpen).toBe(false);
    });
  });

  describe("Create form dialog state", () => {
    it("isCreateFormDialogOpen defaults to false", () => {
      expect(useUIStore.getState().isCreateFormDialogOpen).toBe(false);
    });

    it("setCreateFormDialogOpen(true) opens dialog", () => {
      useUIStore.getState().setCreateFormDialogOpen(true);
      expect(useUIStore.getState().isCreateFormDialogOpen).toBe(true);
    });

    it("setCreateFormDialogOpen(false) closes dialog", () => {
      useUIStore.getState().setCreateFormDialogOpen(true);
      useUIStore.getState().setCreateFormDialogOpen(false);
      expect(useUIStore.getState().isCreateFormDialogOpen).toBe(false);
    });
  });
});
