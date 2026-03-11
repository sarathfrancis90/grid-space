import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../stores/uiStore";

describe("Toolbar collapse", () => {
  beforeEach(() => {
    useUIStore.setState({ isToolbarCollapsed: false });
  });

  it("should default isToolbarCollapsed to false", () => {
    const state = useUIStore.getState();
    expect(state.isToolbarCollapsed).toBe(false);
  });

  it("should set toolbar collapsed state", () => {
    useUIStore.getState().setToolbarCollapsed(true);
    expect(useUIStore.getState().isToolbarCollapsed).toBe(true);

    useUIStore.getState().setToolbarCollapsed(false);
    expect(useUIStore.getState().isToolbarCollapsed).toBe(false);
  });

  it("should toggle toolbar collapsed state", () => {
    expect(useUIStore.getState().isToolbarCollapsed).toBe(false);

    useUIStore.getState().toggleToolbarCollapsed();
    expect(useUIStore.getState().isToolbarCollapsed).toBe(true);

    useUIStore.getState().toggleToolbarCollapsed();
    expect(useUIStore.getState().isToolbarCollapsed).toBe(false);
  });
});
