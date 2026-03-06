import { describe, it, expect, beforeEach } from "vitest";
import { useNamedFunctionStore } from "../stores/namedFunctionStore";

describe("namedFunctionStore", () => {
  beforeEach(() => {
    useNamedFunctionStore.setState({ functions: new Map() });
  });

  it("adds and retrieves a function", () => {
    const added = useNamedFunctionStore.getState().addFunction({
      name: "DOUBLE",
      formula: "x * 2",
      description: "Doubles a number",
      args: [{ name: "x", description: "The number to double" }],
    });

    expect(added).toBe(true);
    const fn = useNamedFunctionStore.getState().getFunction("DOUBLE");
    expect(fn).toBeDefined();
    expect(fn?.formula).toBe("x * 2");
    expect(fn?.args).toHaveLength(1);
  });

  it("prevents duplicate names (case-insensitive)", () => {
    useNamedFunctionStore.getState().addFunction({
      name: "MyFunc",
      formula: "a + b",
      description: "",
      args: [
        { name: "a", description: "" },
        { name: "b", description: "" },
      ],
    });

    const added = useNamedFunctionStore.getState().addFunction({
      name: "MYFUNC",
      formula: "x",
      description: "",
      args: [],
    });

    expect(added).toBe(false);
    expect(useNamedFunctionStore.getState().getAllFunctions()).toHaveLength(1);
  });

  it("removes a function", () => {
    useNamedFunctionStore.getState().addFunction({
      name: "ToRemove",
      formula: "1",
      description: "",
      args: [],
    });

    useNamedFunctionStore.getState().removeFunction("ToRemove");
    expect(
      useNamedFunctionStore.getState().getFunction("ToRemove"),
    ).toBeUndefined();
  });

  it("updates a function", () => {
    useNamedFunctionStore.getState().addFunction({
      name: "Calc",
      formula: "a + 1",
      description: "Old",
      args: [{ name: "a", description: "value" }],
    });

    useNamedFunctionStore.getState().updateFunction("Calc", {
      formula: "a * 10",
      description: "Updated",
    });

    const fn = useNamedFunctionStore.getState().getFunction("Calc");
    expect(fn?.formula).toBe("a * 10");
    expect(fn?.description).toBe("Updated");
  });

  it("renames a function", () => {
    useNamedFunctionStore.getState().addFunction({
      name: "OldName",
      formula: "x",
      description: "",
      args: [{ name: "x", description: "" }],
    });

    const renamed = useNamedFunctionStore
      .getState()
      .renameFunction("OldName", "NewName");
    expect(renamed).toBe(true);
    expect(
      useNamedFunctionStore.getState().getFunction("OldName"),
    ).toBeUndefined();
    expect(
      useNamedFunctionStore.getState().getFunction("NewName"),
    ).toBeDefined();
    expect(useNamedFunctionStore.getState().getFunction("NewName")?.name).toBe(
      "NewName",
    );
  });

  it("prevents rename to existing name", () => {
    useNamedFunctionStore.getState().addFunction({
      name: "A",
      formula: "1",
      description: "",
      args: [],
    });
    useNamedFunctionStore.getState().addFunction({
      name: "B",
      formula: "2",
      description: "",
      args: [],
    });

    const renamed = useNamedFunctionStore.getState().renameFunction("A", "B");
    expect(renamed).toBe(false);
  });

  it("getAllFunctions returns all functions", () => {
    useNamedFunctionStore.getState().addFunction({
      name: "F1",
      formula: "1",
      description: "",
      args: [],
    });
    useNamedFunctionStore.getState().addFunction({
      name: "F2",
      formula: "2",
      description: "",
      args: [],
    });

    expect(useNamedFunctionStore.getState().getAllFunctions()).toHaveLength(2);
  });

  it("hasFunction checks case-insensitively", () => {
    useNamedFunctionStore.getState().addFunction({
      name: "MyFn",
      formula: "1",
      description: "",
      args: [],
    });

    expect(useNamedFunctionStore.getState().hasFunction("myfn")).toBe(true);
    expect(useNamedFunctionStore.getState().hasFunction("MYFN")).toBe(true);
    expect(useNamedFunctionStore.getState().hasFunction("nope")).toBe(false);
  });
});
