import { describe, it, expect } from "vitest";
import {
  parseStructuredRef,
  resolveAtColumnRef,
  getTableStyleColors,
} from "../utils/structuredRef";
import type { TableConfig } from "../types/grid";

describe("parseStructuredRef", () => {
  it("parses a valid structured reference", () => {
    const result = parseStructuredRef("Sales[#Data]");
    expect(result).toEqual({ tableName: "Sales", specifier: "#Data" });
  });

  it("parses column reference", () => {
    const result = parseStructuredRef("Sales[Price]");
    expect(result).toEqual({ tableName: "Sales", specifier: "Price" });
  });

  it("parses #All", () => {
    const result = parseStructuredRef("MyTable[#All]");
    expect(result).toEqual({ tableName: "MyTable", specifier: "#All" });
  });

  it("parses #This Row", () => {
    const result = parseStructuredRef("Sales[#This Row]");
    expect(result).toEqual({ tableName: "Sales", specifier: "#This Row" });
  });

  it("parses @ reference", () => {
    const result = parseStructuredRef("Sales[@]");
    expect(result).toEqual({ tableName: "Sales", specifier: "@" });
  });

  it("parses @Column reference", () => {
    const result = parseStructuredRef("Sales[@Amount]");
    expect(result).toEqual({ tableName: "Sales", specifier: "@Amount" });
  });

  it("returns null for no bracket", () => {
    expect(parseStructuredRef("Sales")).toBeNull();
  });

  it("returns null for missing closing bracket", () => {
    expect(parseStructuredRef("Sales[Data")).toBeNull();
  });

  it("returns null for empty table name", () => {
    expect(parseStructuredRef("[Data]")).toBeNull();
  });

  it("returns null for empty specifier", () => {
    expect(parseStructuredRef("Sales[]")).toBeNull();
  });

  it("handles whitespace", () => {
    const result = parseStructuredRef("  Sales [ #Data ] ");
    expect(result).toEqual({ tableName: "Sales", specifier: "#Data" });
  });
});

describe("resolveAtColumnRef", () => {
  const table: TableConfig = {
    id: "t1",
    name: "T",
    sheetId: "s1",
    startRow: 0,
    startCol: 0,
    endRow: 5,
    endCol: 2,
    columns: [
      { id: "c1", headerName: "Name" },
      { id: "c2", headerName: "Age" },
      { id: "c3", headerName: "Score" },
    ],
    showHeaderRow: true,
    showTotalRow: false,
    showBandedRows: false,
    showBandedCols: false,
    stylePreset: "blue-medium-1",
    autoExpand: true,
  };

  it("resolves @Column to index", () => {
    expect(resolveAtColumnRef("@Name", table)).toBe(0);
    expect(resolveAtColumnRef("@Age", table)).toBe(1);
    expect(resolveAtColumnRef("@Score", table)).toBe(2);
  });

  it("is case-insensitive", () => {
    expect(resolveAtColumnRef("@name", table)).toBe(0);
    expect(resolveAtColumnRef("@AGE", table)).toBe(1);
  });

  it("returns -1 for non-@ specifier", () => {
    expect(resolveAtColumnRef("Name", table)).toBe(-1);
  });

  it("returns -1 for @only", () => {
    expect(resolveAtColumnRef("@", table)).toBe(-1);
  });

  it("returns -1 for unknown column", () => {
    expect(resolveAtColumnRef("@Missing", table)).toBe(-1);
  });
});

describe("getTableStyleColors", () => {
  it("returns colors for a known preset", () => {
    const colors = getTableStyleColors("blue-medium-1");
    expect(colors.headerBg).toBe("#4472C4");
    expect(colors.headerText).toBe("#FFFFFF");
    expect(colors.bandColor).toBe("#D6E4F0");
    expect(colors.borderColor).toBe("#8FAADC");
  });

  it("returns colors for green preset", () => {
    const colors = getTableStyleColors("green-medium-1");
    expect(colors.headerBg).toBe("#70AD47");
  });

  it("returns default for unknown preset", () => {
    const colors = getTableStyleColors("unknown-preset");
    expect(colors.headerBg).toBe("#4472C4");
  });
});
