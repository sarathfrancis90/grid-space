import { describe, it, expect, beforeEach } from "vitest";
import { useGridStore } from "../stores/gridStore";

describe("showFormulas toggle", () => {
  beforeEach(() => {
    useGridStore.setState({ showFormulas: false });
  });

  it("defaults to false", () => {
    expect(useGridStore.getState().showFormulas).toBe(false);
  });

  it("toggles showFormulas from false to true", () => {
    useGridStore.getState().toggleShowFormulas();
    expect(useGridStore.getState().showFormulas).toBe(true);
  });

  it("toggles showFormulas from true to false", () => {
    useGridStore.setState({ showFormulas: true });
    useGridStore.getState().toggleShowFormulas();
    expect(useGridStore.getState().showFormulas).toBe(false);
  });

  it("toggles back and forth", () => {
    const { toggleShowFormulas } = useGridStore.getState();
    toggleShowFormulas();
    expect(useGridStore.getState().showFormulas).toBe(true);
    toggleShowFormulas();
    expect(useGridStore.getState().showFormulas).toBe(false);
  });
});
