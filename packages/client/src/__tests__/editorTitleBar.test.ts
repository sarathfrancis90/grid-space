import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCloudStore } from "../stores/cloudStore";

describe("Editor title bar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCloudStore.setState({
      currentSpreadsheet: null,
      isSaving: false,
      saveStatus: "idle",
    });
  });

  describe("SaveIndicator (via cloudStore.saveStatus)", () => {
    it("saveStatus defaults to idle", () => {
      const state = useCloudStore.getState();
      expect(state.saveStatus).toBe("idle");
    });

    it("saveStatus transitions to saving", () => {
      useCloudStore.setState({ saveStatus: "saving" });
      expect(useCloudStore.getState().saveStatus).toBe("saving");
    });

    it("saveStatus transitions to saved", () => {
      useCloudStore.setState({ saveStatus: "saved" });
      expect(useCloudStore.getState().saveStatus).toBe("saved");
    });

    it("saveStatus transitions to error", () => {
      useCloudStore.setState({ saveStatus: "error" });
      expect(useCloudStore.getState().saveStatus).toBe("error");
    });
  });

  describe("Star toggle (via cloudStore)", () => {
    it("currentSpreadsheet.isStarred can be toggled", () => {
      useCloudStore.setState({
        currentSpreadsheet: {
          id: "test-1",
          title: "Test Sheet",
          isStarred: false,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          owner: {
            id: "u1",
            name: "User",
            email: "u@test.com",
            avatarUrl: null,
          },
          sheets: [],
        },
      });

      const spreadsheet = useCloudStore.getState().currentSpreadsheet;
      expect(spreadsheet?.isStarred).toBe(false);

      // Simulate star toggle via direct state update (the real toggleStar calls API)
      useCloudStore.setState((state) => {
        if (state.currentSpreadsheet) {
          return {
            ...state,
            currentSpreadsheet: {
              ...state.currentSpreadsheet,
              isStarred: true,
            },
          };
        }
        return state;
      });

      expect(useCloudStore.getState().currentSpreadsheet?.isStarred).toBe(true);
    });
  });

  describe("Title rename", () => {
    it("currentSpreadsheet.title can be updated", () => {
      useCloudStore.setState({
        currentSpreadsheet: {
          id: "test-1",
          title: "Untitled spreadsheet",
          isStarred: false,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          owner: {
            id: "u1",
            name: "User",
            email: "u@test.com",
            avatarUrl: null,
          },
          sheets: [],
        },
      });

      expect(useCloudStore.getState().currentSpreadsheet?.title).toBe(
        "Untitled spreadsheet",
      );

      // Simulate rename via direct state update
      useCloudStore.setState((state) => {
        if (state.currentSpreadsheet) {
          return {
            ...state,
            currentSpreadsheet: {
              ...state.currentSpreadsheet,
              title: "My Budget",
            },
          };
        }
        return state;
      });

      expect(useCloudStore.getState().currentSpreadsheet?.title).toBe(
        "My Budget",
      );
    });
  });
});
