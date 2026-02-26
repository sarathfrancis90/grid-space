import { describe, it, expect } from "vitest";
import {
  colToLetter,
  letterToCol,
  cellRefToPosition,
  positionToCellRef,
  getCellKey,
} from "../utils/coordinates";

describe("colToLetter", () => {
  it("converts 0 to A", () => {
    expect(colToLetter(0)).toBe("A");
  });

  it("converts 1 to B", () => {
    expect(colToLetter(1)).toBe("B");
  });

  it("converts 25 to Z", () => {
    expect(colToLetter(25)).toBe("Z");
  });

  it("converts 26 to AA", () => {
    expect(colToLetter(26)).toBe("AA");
  });

  it("converts 27 to AB", () => {
    expect(colToLetter(27)).toBe("AB");
  });

  it("converts 51 to AZ", () => {
    expect(colToLetter(51)).toBe("AZ");
  });

  it("converts 52 to BA", () => {
    expect(colToLetter(52)).toBe("BA");
  });

  it("converts 701 to ZZ", () => {
    expect(colToLetter(701)).toBe("ZZ");
  });
});

describe("letterToCol", () => {
  it("converts A to 0", () => {
    expect(letterToCol("A")).toBe(0);
  });

  it("converts B to 1", () => {
    expect(letterToCol("B")).toBe(1);
  });

  it("converts Z to 25", () => {
    expect(letterToCol("Z")).toBe(25);
  });

  it("converts AA to 26", () => {
    expect(letterToCol("AA")).toBe(26);
  });

  it("converts AZ to 51", () => {
    expect(letterToCol("AZ")).toBe(51);
  });

  it("converts BA to 52", () => {
    expect(letterToCol("BA")).toBe(52);
  });

  it("handles lowercase", () => {
    expect(letterToCol("aa")).toBe(26);
  });
});

describe("cellRefToPosition", () => {
  it("converts A1 to {row:0, col:0}", () => {
    expect(cellRefToPosition("A1")).toEqual({ row: 0, col: 0 });
  });

  it("converts B2 to {row:1, col:1}", () => {
    expect(cellRefToPosition("B2")).toEqual({ row: 1, col: 1 });
  });

  it("converts Z100 to {row:99, col:25}", () => {
    expect(cellRefToPosition("Z100")).toEqual({ row: 99, col: 25 });
  });

  it("converts AA1 to {row:0, col:26}", () => {
    expect(cellRefToPosition("AA1")).toEqual({ row: 0, col: 26 });
  });

  it("throws on invalid ref", () => {
    expect(() => cellRefToPosition("123")).toThrow("Invalid cell reference");
  });
});

describe("positionToCellRef", () => {
  it("converts {row:0, col:0} to A1", () => {
    expect(positionToCellRef({ row: 0, col: 0 })).toBe("A1");
  });

  it("converts {row:1, col:1} to B2", () => {
    expect(positionToCellRef({ row: 1, col: 1 })).toBe("B2");
  });

  it("converts {row:99, col:25} to Z100", () => {
    expect(positionToCellRef({ row: 99, col: 25 })).toBe("Z100");
  });

  it("round-trips with cellRefToPosition", () => {
    const refs = ["A1", "B2", "Z100", "AA1", "AB27"];
    for (const ref of refs) {
      expect(positionToCellRef(cellRefToPosition(ref))).toBe(ref);
    }
  });
});

describe("getCellKey", () => {
  it("creates key from row and col", () => {
    expect(getCellKey(0, 0)).toBe("0,0");
    expect(getCellKey(5, 10)).toBe("5,10");
  });
});
