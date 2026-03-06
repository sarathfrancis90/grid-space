import { describe, it, expect, beforeEach } from "vitest";
import { useNamedFunctionStore } from "../stores/namedFunctionStore";
import {
  exportNamedFunctionsJSON,
  importNamedFunctionsJSON,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from "../utils/fileOps";
import type { NamedFunction } from "../types/grid";

function createTestFunction(overrides?: Partial<NamedFunction>): NamedFunction {
  return {
    name: "DOUBLE",
    formulaBody: "x * 2",
    description: "Doubles a value",
    arguments: [{ name: "x", description: "The value to double" }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe("Named Functions JSON export/import", () => {
  it("exports named functions to JSON", () => {
    const fns = [
      createTestFunction(),
      createTestFunction({ name: "TRIPLE", formulaBody: "x * 3" }),
    ];
    const json = exportNamedFunctionsJSON(fns);
    const parsed = JSON.parse(json);
    expect(parsed.namedFunctions).toHaveLength(2);
    expect(parsed.namedFunctions[0].name).toBe("DOUBLE");
    expect(parsed.namedFunctions[1].name).toBe("TRIPLE");
  });

  it("imports named functions from valid JSON", () => {
    const json = JSON.stringify({
      namedFunctions: [createTestFunction()],
    });
    const result = importNamedFunctionsJSON(json);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("DOUBLE");
    expect(result[0].formulaBody).toBe("x * 2");
  });

  it("returns empty array for JSON without namedFunctions key", () => {
    const result = importNamedFunctionsJSON('{"other": true}');
    expect(result).toEqual([]);
  });

  it("round-trips through export and import", () => {
    const original = [
      createTestFunction(),
      createTestFunction({
        name: "ADD",
        formulaBody: "a + b",
        arguments: [
          { name: "a", description: "First" },
          { name: "b", description: "Second" },
        ],
      }),
    ];
    const json = exportNamedFunctionsJSON(original);
    const imported = importNamedFunctionsJSON(json);
    expect(imported).toHaveLength(2);
    expect(imported[0].name).toBe("DOUBLE");
    expect(imported[1].arguments).toHaveLength(2);
  });
});

describe("Named Functions in autosave data", () => {
  beforeEach(() => {
    clearLocalStorage();
    useNamedFunctionStore.getState().clearAll();
  });

  it("persists named functions in autosave data", () => {
    const data = {
      timestamp: Date.now(),
      title: "Test",
      sheets: [{ id: "s1", name: "Sheet 1", cells: [] }],
      namedFunctions: [createTestFunction()],
    };
    saveToLocalStorage(data);
    const loaded = loadFromLocalStorage();
    expect(loaded?.namedFunctions).toHaveLength(1);
    expect(loaded?.namedFunctions?.[0].name).toBe("DOUBLE");
  });

  it("loads autosave without namedFunctions (backwards compat)", () => {
    const data = {
      timestamp: Date.now(),
      title: "Old format",
      sheets: [{ id: "s1", name: "Sheet 1", cells: [] }],
    };
    saveToLocalStorage(data);
    const loaded = loadFromLocalStorage();
    expect(loaded?.namedFunctions).toBeUndefined();
  });
});

describe("Named Functions store import/export integration", () => {
  beforeEach(() => {
    useNamedFunctionStore.getState().clearAll();
  });

  it("exports from store and imports via JSON round-trip", () => {
    const store = useNamedFunctionStore.getState();
    store.addFunction(createTestFunction());
    store.addFunction(
      createTestFunction({ name: "TRIPLE", formulaBody: "x * 3" }),
    );

    const exported = store.exportFunctions();
    const json = exportNamedFunctionsJSON(exported);

    store.clearAll();
    expect(store.getAllFunctions()).toHaveLength(0);

    const imported = importNamedFunctionsJSON(json);
    store.importFunctions(imported);
    expect(store.getAllFunctions()).toHaveLength(2);
    expect(store.hasFunction("DOUBLE")).toBe(true);
    expect(store.hasFunction("TRIPLE")).toBe(true);
  });
});
