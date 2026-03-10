import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../stores/uiStore";

describe("EmailDialog uiStore integration", () => {
  beforeEach(() => {
    useUIStore.setState({
      isEmailDialogOpen: false,
    });
  });

  it("should default isEmailDialogOpen to false", () => {
    expect(useUIStore.getState().isEmailDialogOpen).toBe(false);
  });

  it("should open email dialog", () => {
    useUIStore.getState().setEmailDialogOpen(true);
    expect(useUIStore.getState().isEmailDialogOpen).toBe(true);
  });

  it("should close email dialog", () => {
    useUIStore.getState().setEmailDialogOpen(true);
    expect(useUIStore.getState().isEmailDialogOpen).toBe(true);

    useUIStore.getState().setEmailDialogOpen(false);
    expect(useUIStore.getState().isEmailDialogOpen).toBe(false);
  });
});
