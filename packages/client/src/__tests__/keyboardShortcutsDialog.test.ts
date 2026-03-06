import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../stores/uiStore";

describe("Keyboard Shortcuts Dialog (Google Sheets parity)", () => {
  beforeEach(() => {
    useUIStore.setState({
      isKeyboardShortcutsOpen: false,
    });
  });

  it("starts with dialog closed", () => {
    expect(useUIStore.getState().isKeyboardShortcutsOpen).toBe(false);
  });

  it("opens keyboard shortcuts dialog", () => {
    useUIStore.getState().setKeyboardShortcutsOpen(true);
    expect(useUIStore.getState().isKeyboardShortcutsOpen).toBe(true);
  });

  it("closes keyboard shortcuts dialog", () => {
    useUIStore.getState().setKeyboardShortcutsOpen(true);
    useUIStore.getState().setKeyboardShortcutsOpen(false);
    expect(useUIStore.getState().isKeyboardShortcutsOpen).toBe(false);
  });

  it("toggles keyboard shortcuts dialog", () => {
    const state = useUIStore.getState();
    state.setKeyboardShortcutsOpen(!state.isKeyboardShortcutsOpen);
    expect(useUIStore.getState().isKeyboardShortcutsOpen).toBe(true);

    const state2 = useUIStore.getState();
    state2.setKeyboardShortcutsOpen(!state2.isKeyboardShortcutsOpen);
    expect(useUIStore.getState().isKeyboardShortcutsOpen).toBe(false);
  });
});
