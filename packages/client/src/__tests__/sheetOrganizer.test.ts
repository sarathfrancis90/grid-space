import { describe, it, expect } from "vitest";
import { analyzeSheetOrganization } from "../utils/sheetOrganizer";
import type { CellData } from "../types/grid";

function makeGetter(
  data: Record<string, CellData>,
): (row: number, col: number) => CellData | undefined {
  return (row: number, col: number) => data[`${row},${col}`];
}

describe("analyzeSheetOrganization", () => {
  it("suggests header formatting when first row looks like headers", () => {
    const data: Record<string, CellData> = {
      "0,0": { value: "Name" },
      "0,1": { value: "Age" },
      "0,2": { value: "Email" },
      "1,0": { value: "Alice" },
      "1,1": { value: 30 },
      "1,2": { value: "alice@example.com" },
      "2,0": { value: "Bob" },
      "2,1": { value: 25 },
      "2,2": { value: "bob@example.com" },
    };
    const getter = makeGetter(data);
    const suggestions = analyzeSheetOrganization(getter, 2, 2);

    expect(suggestions.length).toBeGreaterThan(0);
    const headerSuggestion = suggestions.find(
      (s) => s.type === "add-header-format",
    );
    expect(headerSuggestion).toBeDefined();
  });

  it("suggests freezing header row", () => {
    const data: Record<string, CellData> = {
      "0,0": { value: "Product" },
      "0,1": { value: "Price" },
      "1,0": { value: "Widget" },
      "1,1": { value: 9.99 },
      "2,0": { value: "Gadget" },
      "2,1": { value: 19.99 },
    };
    const getter = makeGetter(data);
    const suggestions = analyzeSheetOrganization(getter, 2, 1);

    const freezeSuggestion = suggestions.find(
      (s) => s.type === "freeze-header",
    );
    expect(freezeSuggestion).toBeDefined();
  });

  it("suggests filters when there are enough data rows", () => {
    const data: Record<string, CellData> = {
      "0,0": { value: "Category" },
      "0,1": { value: "Amount" },
    };
    for (let i = 1; i <= 10; i++) {
      data[`${i},0`] = { value: `Cat${i % 3}` };
      data[`${i},1`] = { value: i * 100 };
    }
    const getter = makeGetter(data);
    const suggestions = analyzeSheetOrganization(getter, 10, 1);

    const filterSuggestion = suggestions.find((s) => s.type === "add-filter");
    expect(filterSuggestion).toBeDefined();
  });

  it("suggests sorting for numeric columns", () => {
    const data: Record<string, CellData> = {
      "0,0": { value: "Name" },
      "0,1": { value: "Score" },
    };
    for (let i = 1; i <= 5; i++) {
      data[`${i},0`] = { value: `Person${i}` };
      data[`${i},1`] = { value: Math.random() * 100 };
    }
    const getter = makeGetter(data);
    const suggestions = analyzeSheetOrganization(getter, 5, 1);

    const sortSuggestion = suggestions.find((s) => s.type === "sort-column");
    expect(sortSuggestion).toBeDefined();
  });

  it("returns empty suggestions for empty sheet", () => {
    const getter = makeGetter({});
    const suggestions = analyzeSheetOrganization(getter, 0, 0);
    expect(suggestions).toHaveLength(0);
  });

  it("returns empty suggestions when no header row detected", () => {
    const data: Record<string, CellData> = {
      "0,0": { value: 1 },
      "0,1": { value: 2 },
      "1,0": { value: 3 },
      "1,1": { value: 4 },
    };
    const getter = makeGetter(data);
    const suggestions = analyzeSheetOrganization(getter, 1, 1);
    expect(suggestions).toHaveLength(0);
  });

  it("does not suggest header format when already bold", () => {
    const data: Record<string, CellData> = {
      "0,0": { value: "Name", format: { bold: true } },
      "0,1": { value: "Age", format: { bold: true } },
      "1,0": { value: "Alice" },
      "1,1": { value: 30 },
      "2,0": { value: "Bob" },
      "2,1": { value: 25 },
    };
    const getter = makeGetter(data);
    const suggestions = analyzeSheetOrganization(getter, 2, 1);

    const headerSuggestion = suggestions.find(
      (s) => s.type === "add-header-format",
    );
    expect(headerSuggestion).toBeUndefined();
  });

  it("returns suggestions sorted by priority", () => {
    const data: Record<string, CellData> = {
      "0,0": { value: "Name" },
      "0,1": { value: "Score" },
    };
    for (let i = 1; i <= 10; i++) {
      data[`${i},0`] = { value: `Person${i}` };
      data[`${i},1`] = { value: i * 10 };
    }
    const getter = makeGetter(data);
    const suggestions = analyzeSheetOrganization(getter, 10, 1);

    for (let i = 1; i < suggestions.length; i++) {
      expect(suggestions[i].priority).toBeGreaterThanOrEqual(
        suggestions[i - 1].priority,
      );
    }
  });
});
