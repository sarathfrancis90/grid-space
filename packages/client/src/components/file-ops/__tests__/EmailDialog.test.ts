import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../../../stores/uiStore";

describe("EmailDialog support", () => {
  describe("UIStore email dialog state", () => {
    beforeEach(() => {
      useUIStore.setState({ isEmailDialogOpen: false });
    });

    it("opens and closes email dialog", () => {
      expect(useUIStore.getState().isEmailDialogOpen).toBe(false);

      useUIStore.getState().setEmailDialogOpen(true);
      expect(useUIStore.getState().isEmailDialogOpen).toBe(true);

      useUIStore.getState().setEmailDialogOpen(false);
      expect(useUIStore.getState().isEmailDialogOpen).toBe(false);
    });

    it("defaults to closed", () => {
      const fresh = useUIStore.getState();
      expect(fresh.isEmailDialogOpen).toBe(false);
    });
  });
});
