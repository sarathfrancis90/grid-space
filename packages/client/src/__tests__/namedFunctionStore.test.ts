import { describe, it, expect, beforeEach } from "vitest";
import { useNamedFunctionStore } from "../stores/namedFunctionStore";
import { isValidFunctionName } from "../stores/namedFunctionStore";
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

describe("namedFunctionStore", () => {
  beforeEach(() => {
    useNamedFunctionStore.getState().clearAll();
  });

  describe("addFunction", () => {
    it("adds a named function", () => {
      const fn = createTestFunction();
      const result = useNamedFunctionStore.getState().addFunction(fn);
      expect(result).toBe(true);
      expect(useNamedFunctionStore.getState().hasFunction("DOUBLE")).toBe(true);
    });

    it("prevents duplicate names (case-insensitive)", () => {
      useNamedFunctionStore.getState().addFunction(createTestFunction());
      const duplicate = useNamedFunctionStore
        .getState()
        .addFunction(createTestFunction({ name: "double" }));
      expect(duplicate).toBe(false);
    });

    it("prevents reserved names", () => {
      const result = useNamedFunctionStore
        .getState()
        .addFunction(createTestFunction({ name: "SUM" }));
      expect(result).toBe(false);
    });

    it("prevents invalid names", () => {
      const result = useNamedFunctionStore
        .getState()
        .addFunction(createTestFunction({ name: "123invalid" }));
      expect(result).toBe(false);
    });
  });

  describe("removeFunction", () => {
    it("removes a function by name", () => {
      useNamedFunctionStore.getState().addFunction(createTestFunction());
      useNamedFunctionStore.getState().removeFunction("DOUBLE");
      expect(useNamedFunctionStore.getState().hasFunction("DOUBLE")).toBe(
        false,
      );
    });
  });

  describe("updateFunction", () => {
    it("updates formula body and description", () => {
      useNamedFunctionStore.getState().addFunction(createTestFunction());
      useNamedFunctionStore.getState().updateFunction("DOUBLE", {
        formulaBody: "x * 3",
        description: "Triples a value",
      });
      const fn = useNamedFunctionStore.getState().getFunction("DOUBLE");
      expect(fn?.formulaBody).toBe("x * 3");
      expect(fn?.description).toBe("Triples a value");
    });

    it("updates arguments", () => {
      useNamedFunctionStore.getState().addFunction(createTestFunction());
      useNamedFunctionStore.getState().updateFunction("DOUBLE", {
        arguments: [
          { name: "x", description: "First" },
          { name: "y", description: "Second" },
        ],
      });
      const fn = useNamedFunctionStore.getState().getFunction("DOUBLE");
      expect(fn?.arguments).toHaveLength(2);
    });
  });

  describe("getFunction", () => {
    it("retrieves function case-insensitively", () => {
      useNamedFunctionStore.getState().addFunction(createTestFunction());
      expect(
        useNamedFunctionStore.getState().getFunction("double"),
      ).toBeDefined();
      expect(
        useNamedFunctionStore.getState().getFunction("DOUBLE"),
      ).toBeDefined();
      expect(
        useNamedFunctionStore.getState().getFunction("Double"),
      ).toBeDefined();
    });

    it("returns undefined for non-existent function", () => {
      expect(
        useNamedFunctionStore.getState().getFunction("NONEXISTENT"),
      ).toBeUndefined();
    });
  });

  describe("getAllFunctions", () => {
    it("returns all functions", () => {
      useNamedFunctionStore.getState().addFunction(createTestFunction());
      useNamedFunctionStore
        .getState()
        .addFunction(
          createTestFunction({ name: "TRIPLE", formulaBody: "x * 3" }),
        );
      const all = useNamedFunctionStore.getState().getAllFunctions();
      expect(all).toHaveLength(2);
    });
  });

  describe("renameFunction", () => {
    it("renames a function", () => {
      useNamedFunctionStore.getState().addFunction(createTestFunction());
      const result = useNamedFunctionStore
        .getState()
        .renameFunction("DOUBLE", "MULTIPLY_BY_TWO");
      expect(result).toBe(true);
      expect(useNamedFunctionStore.getState().hasFunction("DOUBLE")).toBe(
        false,
      );
      expect(
        useNamedFunctionStore.getState().hasFunction("MULTIPLY_BY_TWO"),
      ).toBe(true);
    });

    it("prevents renaming to reserved name", () => {
      useNamedFunctionStore.getState().addFunction(createTestFunction());
      const result = useNamedFunctionStore
        .getState()
        .renameFunction("DOUBLE", "SUM");
      expect(result).toBe(false);
    });

    it("prevents renaming to existing name", () => {
      useNamedFunctionStore.getState().addFunction(createTestFunction());
      useNamedFunctionStore
        .getState()
        .addFunction(
          createTestFunction({ name: "TRIPLE", formulaBody: "x * 3" }),
        );
      const result = useNamedFunctionStore
        .getState()
        .renameFunction("DOUBLE", "TRIPLE");
      expect(result).toBe(false);
    });

    it("allows same-case renaming", () => {
      useNamedFunctionStore.getState().addFunction(createTestFunction());
      const result = useNamedFunctionStore
        .getState()
        .renameFunction("DOUBLE", "DOUBLE");
      expect(result).toBe(true);
    });
  });

  describe("importFunctions / exportFunctions", () => {
    it("imports and exports functions", () => {
      const fns = [
        createTestFunction(),
        createTestFunction({ name: "TRIPLE", formulaBody: "x * 3" }),
      ];
      useNamedFunctionStore.getState().importFunctions(fns);
      const exported = useNamedFunctionStore.getState().exportFunctions();
      expect(exported).toHaveLength(2);
    });

    it("skips invalid names during import", () => {
      const fns = [
        createTestFunction({ name: "SUM" }), // reserved
        createTestFunction({ name: "VALID_FN" }),
      ];
      useNamedFunctionStore.getState().importFunctions(fns);
      const all = useNamedFunctionStore.getState().getAllFunctions();
      expect(all).toHaveLength(1);
      expect(all[0].name).toBe("VALID_FN");
    });
  });

  describe("clearAll", () => {
    it("clears all functions", () => {
      useNamedFunctionStore.getState().addFunction(createTestFunction());
      useNamedFunctionStore.getState().clearAll();
      expect(useNamedFunctionStore.getState().getAllFunctions()).toHaveLength(
        0,
      );
    });
  });
});

describe("isValidFunctionName", () => {
  it("accepts valid names", () => {
    expect(isValidFunctionName("MY_FUNC")).toBe(true);
    expect(isValidFunctionName("_private")).toBe(true);
    expect(isValidFunctionName("fn1")).toBe(true);
    expect(isValidFunctionName("CALC.TAX")).toBe(true);
  });

  it("rejects invalid names", () => {
    expect(isValidFunctionName("")).toBe(false);
    expect(isValidFunctionName("123abc")).toBe(false);
    expect(isValidFunctionName("SUM")).toBe(false);
    expect(isValidFunctionName("IF")).toBe(false);
    expect(isValidFunctionName("LAMBDA")).toBe(false);
  });
});
