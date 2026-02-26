/**
 * File operations: CSV/TSV/XLSX/PDF/JSON import and export.
 * Pure utility functions — no store or DOM access.
 */
import type { CellData, CellFormat } from "../types/grid";

// ── CSV / TSV ────────────────────────────────────────────────

/** Auto-detect delimiter from CSV content */
export function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0] ?? "";
  const tab = (firstLine.match(/\t/g) ?? []).length;
  const semi = (firstLine.match(/;/g) ?? []).length;
  const comma = (firstLine.match(/,/g) ?? []).length;
  if (tab > comma && tab > semi) return "\t";
  if (semi > comma) return ";";
  return ",";
}

/** Parse CSV/TSV text into 2D string array, handling quoted fields */
export function parseCSV(text: string, delimiter?: string): string[][] {
  const delim = delimiter ?? detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === delim) {
        row.push(field);
        field = "";
        i++;
      } else if (ch === "\n" || ch === "\r") {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
        if (ch === "\r" && i + 1 < text.length && text[i + 1] === "\n") {
          i++;
        }
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Last field/row
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/** Convert 2D cell data to CSV string */
export function toCSV(
  cells: Map<string, CellData>,
  delimiter: string = ",",
  rangeOnly?: {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  },
): string {
  const { maxRow, maxCol, minRow, minCol } = rangeOnly
    ? {
        minRow: rangeOnly.startRow,
        minCol: rangeOnly.startCol,
        maxRow: rangeOnly.endRow,
        maxCol: rangeOnly.endCol,
      }
    : getDataBounds(cells);

  const lines: string[] = [];
  for (let r = minRow; r <= maxRow; r++) {
    const fields: string[] = [];
    for (let c = minCol; c <= maxCol; c++) {
      const cell = cells.get(`${r},${c}`);
      const val = cell?.value != null ? String(cell.value) : "";
      // Quote if contains delimiter, quotes, or newlines
      if (val.includes(delimiter) || val.includes('"') || val.includes("\n")) {
        fields.push('"' + val.replace(/"/g, '""') + '"');
      } else {
        fields.push(val);
      }
    }
    lines.push(fields.join(delimiter));
  }
  return lines.join("\n");
}

/** Convert 2D cell data to JSON array of objects */
export function toJSON(cells: Map<string, CellData>): string {
  const { maxRow, maxCol } = getDataBounds(cells);

  // First row = headers
  const headers: string[] = [];
  for (let c = 0; c <= maxCol; c++) {
    const cell = cells.get(`0,${c}`);
    headers.push(cell?.value != null ? String(cell.value) : `col_${c}`);
  }

  const rows: Record<string, string | number | boolean | null>[] = [];
  for (let r = 1; r <= maxRow; r++) {
    const obj: Record<string, string | number | boolean | null> = {};
    for (let c = 0; c <= maxCol; c++) {
      const cell = cells.get(`${r},${c}`);
      obj[headers[c]] = cell?.value ?? null;
    }
    rows.push(obj);
  }

  return JSON.stringify(rows, null, 2);
}

function getDataBounds(cells: Map<string, CellData>): {
  minRow: number;
  minCol: number;
  maxRow: number;
  maxCol: number;
} {
  let maxRow = 0;
  let maxCol = 0;
  for (const key of cells.keys()) {
    const [r, c] = key.split(",").map(Number);
    if (r > maxRow) maxRow = r;
    if (c > maxCol) maxCol = c;
  }
  return { minRow: 0, minCol: 0, maxRow, maxCol };
}

// ── XLSX (SheetJS) ───────────────────────────────────────────

interface XLSXSheet {
  name: string;
  cells: Map<string, CellData>;
}

/** Import XLSX file buffer into sheet data */
export async function importXLSX(buffer: ArrayBuffer): Promise<XLSXSheet[]> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellFormula: true,
    cellStyles: true,
  });
  const sheets: XLSXSheet[] = [];

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    if (!ws) continue;
    const cells = new Map<string, CellData>();
    const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");

    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        if (!cell) continue;

        const data: CellData = { value: null };

        // Preserve formula
        if (cell.f) {
          data.formula = `=${cell.f}`;
        }

        // Value
        if (cell.t === "n") data.value = cell.v as number;
        else if (cell.t === "b") data.value = cell.v as boolean;
        else if (cell.t === "s") data.value = cell.v as string;
        else if (cell.w) data.value = cell.w;

        // Preserve basic formatting from cell style
        if (cell.s) {
          const fmt: CellFormat = {};
          const s = cell.s as Record<string, unknown>;
          if (s.font) {
            const font = s.font as Record<string, unknown>;
            if (font.bold) fmt.bold = true;
            if (font.italic) fmt.italic = true;
            if (font.underline) fmt.underline = true;
            if (font.strike) fmt.strikethrough = true;
            if (font.name) fmt.fontFamily = font.name as string;
            if (font.sz) fmt.fontSize = font.sz as number;
          }
          if (Object.keys(fmt).length > 0) data.format = fmt;
        }

        cells.set(`${r},${c}`, data);
      }
    }

    sheets.push({ name: sheetName, cells });
  }

  return sheets;
}

/** Export cell data to XLSX ArrayBuffer */
export async function exportXLSX(
  sheetsData: Array<{ name: string; cells: Map<string, CellData> }>,
): Promise<ArrayBuffer> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheetsData) {
    const { maxRow, maxCol } = getDataBounds(sheet.cells);
    const aoa: (string | number | boolean | null)[][] = [];

    for (let r = 0; r <= maxRow; r++) {
      const row: (string | number | boolean | null)[] = [];
      for (let c = 0; c <= maxCol; c++) {
        const cell = sheet.cells.get(`${r},${c}`);
        row.push(cell?.value ?? null);
      }
      aoa.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Write formulas back
    for (const [key, cell] of sheet.cells) {
      if (!cell.formula) continue;
      const [r, c] = key.split(",").map(Number);
      const addr = XLSX.utils.encode_cell({ r, c });
      if (ws[addr]) {
        ws[addr].f = cell.formula.startsWith("=")
          ? cell.formula.slice(1)
          : cell.formula;
      }
    }

    XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
  }

  const buf = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return buf as ArrayBuffer;
}

// ── PDF ──────────────────────────────────────────────────────

/** Generate simple PDF from cell data using canvas/print approach */
export function exportPDF(
  cells: Map<string, CellData>,
  title: string = "Spreadsheet",
): void {
  // Build an HTML table and use window.print()
  const { maxRow, maxCol } = getDataBounds(cells);
  let html = `<!DOCTYPE html><html><head><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 10px; }
      table { border-collapse: collapse; width: 100%; }
      td, th { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
      th { background: #f0f0f0; font-weight: bold; }
    </style></head><body><h2>${title}</h2><table>`;

  for (let r = 0; r <= maxRow; r++) {
    html += "<tr>";
    for (let c = 0; c <= maxCol; c++) {
      const cell = cells.get(`${r},${c}`);
      const val = cell?.value != null ? String(cell.value) : "";
      html +=
        r === 0 ? `<th>${escapeHtml(val)}</th>` : `<td>${escapeHtml(val)}</td>`;
    }
    html += "</tr>";
  }

  html += "</table></body></html>";

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── File download helper ─────────────────────────────────────

export function downloadFile(
  content: string | ArrayBuffer,
  filename: string,
  mimeType: string,
): void {
  const blob =
    content instanceof ArrayBuffer
      ? new Blob([content], { type: mimeType })
      : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Autosave ─────────────────────────────────────────────────

const AUTOSAVE_KEY = "gridspace_autosave";

export interface AutosaveData {
  timestamp: number;
  title: string;
  sheets: Array<{
    id: string;
    name: string;
    cells: Array<[string, CellData]>;
  }>;
}

export function saveToLocalStorage(data: AutosaveData): void {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function loadFromLocalStorage(): AutosaveData | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AutosaveData;
  } catch {
    return null;
  }
}

export function clearLocalStorage(): void {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch {
    // ignore
  }
}
