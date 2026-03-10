import { describe, it, expect, vi, beforeEach } from "vitest";
import { toCSV } from "../../../utils/fileOps";
import type { CellData } from "../../../types/grid";

vi.mock("../../../utils/fileOps", async () => {
  const actual = await vi.importActual<typeof import("../../../utils/fileOps")>(
    "../../../utils/fileOps",
  );
  return {
    ...actual,
    downloadFile: vi.fn(),
  };
});

describe("Download as CSV", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("toCSV generates correct CSV from cell data", () => {
    const cells = new Map<string, CellData>();
    cells.set("0,0", { value: "Name" });
    cells.set("0,1", { value: "Age" });
    cells.set("1,0", { value: "Alice" });
    cells.set("1,1", { value: 30 });

    const csv = toCSV(cells);
    expect(csv).toBe("Name,Age\nAlice,30");
  });

  it("toCSV handles values with commas by quoting", () => {
    const cells = new Map<string, CellData>();
    cells.set("0,0", { value: "Name, First" });
    cells.set("0,1", { value: "City" });

    const csv = toCSV(cells);
    expect(csv).toBe('"Name, First",City');
  });

  it("toCSV handles empty cells", () => {
    const cells = new Map<string, CellData>();
    cells.set("0,0", { value: "A" });
    cells.set("0,2", { value: "C" });

    const csv = toCSV(cells);
    expect(csv).toBe("A,,C");
  });

  it("toCSV handles values with quotes by escaping", () => {
    const cells = new Map<string, CellData>();
    cells.set("0,0", { value: 'He said "hello"' });

    const csv = toCSV(cells);
    expect(csv).toBe('"He said ""hello"""');
  });

  it("downloadFile is called with correct arguments from fileOps", async () => {
    const { downloadFile } = await import("../../../utils/fileOps");
    const cells = new Map<string, CellData>();
    cells.set("0,0", { value: "Test" });

    const csvString = toCSV(cells);
    (downloadFile as ReturnType<typeof vi.fn>)(
      csvString,
      "spreadsheet.csv",
      "text/csv",
    );

    expect(downloadFile).toHaveBeenCalledWith(
      "Test",
      "spreadsheet.csv",
      "text/csv",
    );
  });
});
