import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../stores/uiStore";

describe("EmailDialog uiStore integration", () => {
  beforeEach(() => {
    const store = useUIStore.getState();
    store.setEmailDialogOpen(false);
  });

  it("isEmailDialogOpen defaults to false", () => {
    expect(useUIStore.getState().isEmailDialogOpen).toBe(false);
  });

  it("setEmailDialogOpen(true) opens the dialog", () => {
    useUIStore.getState().setEmailDialogOpen(true);
    expect(useUIStore.getState().isEmailDialogOpen).toBe(true);
  });

  it("setEmailDialogOpen(false) closes the dialog", () => {
    useUIStore.getState().setEmailDialogOpen(true);
    useUIStore.getState().setEmailDialogOpen(false);
    expect(useUIStore.getState().isEmailDialogOpen).toBe(false);
  });
});
