/**
 * Test: Conditional Formatting menu entry in Format menu
 * Verifies that the uiStore state for opening the ConditionalFormatManager
 * can be toggled via the menu action.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../stores/uiStore";

function resetStores() {
  useUIStore.setState({
    isConditionalFormatOpen: false,
  });
}

describe("Conditional Formatting menu entry", () => {
  beforeEach(resetStores);

  it("isConditionalFormatOpen defaults to false", () => {
    expect(useUIStore.getState().isConditionalFormatOpen).toBe(false);
  });

  it("setConditionalFormatOpen(true) opens the dialog", () => {
    useUIStore.getState().setConditionalFormatOpen(true);
    expect(useUIStore.getState().isConditionalFormatOpen).toBe(true);
  });

  it("setConditionalFormatOpen(false) closes the dialog", () => {
    useUIStore.getState().setConditionalFormatOpen(true);
    useUIStore.getState().setConditionalFormatOpen(false);
    expect(useUIStore.getState().isConditionalFormatOpen).toBe(false);
  });
});
