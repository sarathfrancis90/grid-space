import { describe, it, expect, beforeEach } from "vitest";
import { useGridStore } from "../stores/gridStore";

describe("Show Formulas toggle", () => {
  beforeEach(() => {
    const store = useGridStore.getState();
    // Reset to default
    if (store.showFormulas) {
      store.toggleShowFormulas();
    }
  });

  it("should default showFormulas to false", () => {
    expect(useGridStore.getState().showFormulas).toBe(false);
  });

  it("should toggle showFormulas to true", () => {
    useGridStore.getState().toggleShowFormulas();
    expect(useGridStore.getState().showFormulas).toBe(true);
  });

  it("should toggle showFormulas back to false", () => {
    useGridStore.getState().toggleShowFormulas();
    useGridStore.getState().toggleShowFormulas();
    expect(useGridStore.getState().showFormulas).toBe(false);
  });
});
