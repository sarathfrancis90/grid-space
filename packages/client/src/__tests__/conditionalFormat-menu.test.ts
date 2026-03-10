/**
 * Tests for conditional formatting menu entry (issue #130).
 * Verifies the uiStore state toggle for opening/closing the ConditionalFormatManager.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../stores/uiStore";

describe("Conditional Formatting menu integration", () => {
  beforeEach(() => {
    useUIStore.setState({ isConditionalFormatOpen: false });
  });

  it("should have isConditionalFormatOpen default to false", () => {
    expect(useUIStore.getState().isConditionalFormatOpen).toBe(false);
  });

  it("should open conditional format manager via setConditionalFormatOpen", () => {
    useUIStore.getState().setConditionalFormatOpen(true);
    expect(useUIStore.getState().isConditionalFormatOpen).toBe(true);
  });

  it("should close conditional format manager via setConditionalFormatOpen", () => {
    useUIStore.getState().setConditionalFormatOpen(true);
    expect(useUIStore.getState().isConditionalFormatOpen).toBe(true);
    useUIStore.getState().setConditionalFormatOpen(false);
    expect(useUIStore.getState().isConditionalFormatOpen).toBe(false);
  });
});
