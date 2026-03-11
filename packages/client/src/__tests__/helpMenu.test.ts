/**
 * Tests for expanded Help menu — About, What's New, Report Issue, Terms/Privacy.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUIStore } from "../stores/uiStore";

describe("Help menu — About and What's New dialogs", () => {
  beforeEach(() => {
    useUIStore.setState({
      isAboutDialogOpen: false,
      isWhatsNewDialogOpen: false,
    });
  });

  it("should open and close the About dialog via store", () => {
    expect(useUIStore.getState().isAboutDialogOpen).toBe(false);

    useUIStore.getState().setAboutDialogOpen(true);
    expect(useUIStore.getState().isAboutDialogOpen).toBe(true);

    useUIStore.getState().setAboutDialogOpen(false);
    expect(useUIStore.getState().isAboutDialogOpen).toBe(false);
  });

  it("should open and close the What's New dialog via store", () => {
    expect(useUIStore.getState().isWhatsNewDialogOpen).toBe(false);

    useUIStore.getState().setWhatsNewDialogOpen(true);
    expect(useUIStore.getState().isWhatsNewDialogOpen).toBe(true);

    useUIStore.getState().setWhatsNewDialogOpen(false);
    expect(useUIStore.getState().isWhatsNewDialogOpen).toBe(false);
  });

  it("should open Report an issue link in new tab", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    window.open(
      "https://github.com/sarathfrancis90/grid-space/issues",
      "_blank",
      "noopener,noreferrer",
    );

    expect(openSpy).toHaveBeenCalledWith(
      "https://github.com/sarathfrancis90/grid-space/issues",
      "_blank",
      "noopener,noreferrer",
    );

    openSpy.mockRestore();
  });

  it("should open Terms of Service link in new tab", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    window.open("/terms", "_blank", "noopener,noreferrer");

    expect(openSpy).toHaveBeenCalledWith(
      "/terms",
      "_blank",
      "noopener,noreferrer",
    );

    openSpy.mockRestore();
  });

  it("should open Privacy Policy link in new tab", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    window.open("/privacy", "_blank", "noopener,noreferrer");

    expect(openSpy).toHaveBeenCalledWith(
      "/privacy",
      "_blank",
      "noopener,noreferrer",
    );

    openSpy.mockRestore();
  });
});
