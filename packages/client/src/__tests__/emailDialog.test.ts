import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../stores/uiStore";

describe("EmailDialog UI store integration", () => {
  beforeEach(() => {
    useUIStore.setState({ isEmailDialogOpen: false });
  });

  it("starts with email dialog closed", () => {
    expect(useUIStore.getState().isEmailDialogOpen).toBe(false);
  });

  it("opens email dialog", () => {
    useUIStore.getState().setEmailDialogOpen(true);
    expect(useUIStore.getState().isEmailDialogOpen).toBe(true);
  });

  it("closes email dialog", () => {
    useUIStore.getState().setEmailDialogOpen(true);
    expect(useUIStore.getState().isEmailDialogOpen).toBe(true);

    useUIStore.getState().setEmailDialogOpen(false);
    expect(useUIStore.getState().isEmailDialogOpen).toBe(false);
  });

  it("toggles email dialog without affecting other dialog states", () => {
    useUIStore.setState({
      isPrintDialogOpen: true,
      isEmailDialogOpen: false,
    });

    useUIStore.getState().setEmailDialogOpen(true);

    const state = useUIStore.getState();
    expect(state.isEmailDialogOpen).toBe(true);
    expect(state.isPrintDialogOpen).toBe(true);
  });
});
