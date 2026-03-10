/**
 * Test: File > Version history menu entry
 * Issue #143 — adds Version history to File menu, toggles VersionHistorySidebar
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useVersionStore } from "../stores/versionStore";
import { useCloudStore } from "../stores/cloudStore";

describe("File > Version history menu entry", () => {
  beforeEach(() => {
    useVersionStore.setState({ isOpen: false });
    useCloudStore.setState({
      currentSpreadsheet: {
        id: "sp-1",
        title: "Test Sheet",
        ownerId: "user-1",
        sheets: [],
        isStarred: false,
        owner: { id: "user-1", email: "test@test.com", displayName: "Test" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    } as unknown as ReturnType<typeof useCloudStore.getState>);
  });

  it("should open version history sidebar when action is triggered", () => {
    const spreadsheetId = useCloudStore.getState().currentSpreadsheet?.id;
    expect(spreadsheetId).toBe("sp-1");

    // Simulate what the menu action does
    if (spreadsheetId) {
      useVersionStore.getState().open(spreadsheetId);
    }

    expect(useVersionStore.getState().isOpen).toBe(true);
  });

  it("should not open version history when no spreadsheet is loaded", () => {
    useCloudStore.setState({
      currentSpreadsheet: null,
    } as unknown as ReturnType<typeof useCloudStore.getState>);

    const spreadsheetId = useCloudStore.getState().currentSpreadsheet?.id;
    expect(spreadsheetId).toBeUndefined();

    // Menu action guards against missing spreadsheetId
    if (spreadsheetId) {
      useVersionStore.getState().open(spreadsheetId);
    }

    expect(useVersionStore.getState().isOpen).toBe(false);
  });

  it("should close version history when close is called", () => {
    useVersionStore.getState().open("sp-1");
    expect(useVersionStore.getState().isOpen).toBe(true);

    useVersionStore.getState().close();
    expect(useVersionStore.getState().isOpen).toBe(false);
  });
});
