import { describe, it, expect } from "vitest";
import {
  colToLetter,
  letterToCol,
  cellRefToPosition,
  positionToCellRef,
  formatCellRef,
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

describe("formatCellRef", () => {
  it("converts (0, 0) to A1", () => {
    expect(formatCellRef(0, 0)).toBe("A1");
  });

  it("converts (1, 1) to B2", () => {
    expect(formatCellRef(1, 1)).toBe("B2");
  });

  it("converts (0, 25) to Z1", () => {
    expect(formatCellRef(0, 25)).toBe("Z1");
  });

  it("converts (0, 26) to AA1", () => {
    expect(formatCellRef(0, 26)).toBe("AA1");
  });

  it("converts (0, 51) to AZ1", () => {
    expect(formatCellRef(0, 51)).toBe("AZ1");
  });

  it("converts (0, 52) to BA1", () => {
    expect(formatCellRef(0, 52)).toBe("BA1");
  });

  it("handles large indices", () => {
    expect(formatCellRef(999, 701)).toBe("ZZ1000");
    expect(formatCellRef(0, 702)).toBe("AAA1");
  });

  it("is consistent with positionToCellRef", () => {
    const cases = [
      { row: 0, col: 0 },
      { row: 5, col: 10 },
      { row: 99, col: 25 },
      { row: 0, col: 26 },
    ];
    for (const pos of cases) {
      expect(formatCellRef(pos.row, pos.col)).toBe(positionToCellRef(pos));
    }
  });
});

describe("getCellKey", () => {
  it("creates key from row and col", () => {
    expect(getCellKey(0, 0)).toBe("0,0");
    expect(getCellKey(5, 10)).toBe("5,10");
  });
});

import { parseCellKey } from "../utils/coordinates";

describe("parseCellKey", () => {
  it("parses a valid cell key", () => {
    expect(parseCellKey("0,0")).toEqual({ row: 0, col: 0 });
    expect(parseCellKey("5,10")).toEqual({ row: 5, col: 10 });
  });

  it("returns null for invalid keys", () => {
    expect(parseCellKey("abc")).toBeNull();
    expect(parseCellKey("")).toBeNull();
    expect(parseCellKey("1,2,3")).toBeNull();
  });

  it("round-trips with getCellKey", () => {
    const key = getCellKey(3, 7);
    const parsed = parseCellKey(key);
    expect(parsed).toEqual({ row: 3, col: 7 });
  });
});
