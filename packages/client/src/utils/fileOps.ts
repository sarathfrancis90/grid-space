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

/** Convert a hex color like #ff0000 to an XLSX-compatible RGB object */
function hexToXlsxColor(hex: string): { rgb: string } {
  const clean = hex.replace("#", "").toUpperCase();
  return { rgb: clean.length === 6 ? clean : "000000" };
}

/** Build a SheetJS style object from a CellFormat */
function buildXlsxStyle(fmt: CellFormat): Record<string, unknown> {
  const style: Record<string, unknown> = {};

  // Font
  const font: Record<string, unknown> = {};
  if (fmt.bold) font.bold = true;
  if (fmt.italic) font.italic = true;
  if (fmt.underline) font.underline = true;
  if (fmt.strikethrough) font.strike = true;
  if (fmt.fontFamily) font.name = fmt.fontFamily;
  if (fmt.fontSize) font.sz = fmt.fontSize;
  if (fmt.textColor) font.color = hexToXlsxColor(fmt.textColor);
  if (Object.keys(font).length > 0) style.font = font;

  // Fill (background color)
  if (fmt.backgroundColor && fmt.backgroundColor !== "#ffffff") {
    style.fill = {
      patternType: "solid",
      fgColor: hexToXlsxColor(fmt.backgroundColor),
    };
  }

  // Alignment
  const alignment: Record<string, unknown> = {};
  if (fmt.horizontalAlign) alignment.horizontal = fmt.horizontalAlign;
  if (fmt.verticalAlign) alignment.vertical = fmt.verticalAlign;
  if (fmt.wrapText === "wrap") alignment.wrapText = true;
  if (fmt.textRotation) alignment.textRotation = fmt.textRotation;
  if (fmt.indent) alignment.indent = fmt.indent;
  if (Object.keys(alignment).length > 0) style.alignment = alignment;

  // Number format
  if (fmt.numberFormat && fmt.numberFormat !== "General") {
    style.numFmt = fmt.numberFormat;
  }

  // Borders
  if (fmt.borders) {
    const border: Record<string, unknown> = {};
    const mapBorderSide = (
      side: { style: string; color: string } | undefined,
    ): Record<string, unknown> | undefined => {
      if (!side) return undefined;
      return { style: side.style, color: hexToXlsxColor(side.color) };
    };
    if (fmt.borders.top) border.top = mapBorderSide(fmt.borders.top);
    if (fmt.borders.bottom) border.bottom = mapBorderSide(fmt.borders.bottom);
    if (fmt.borders.left) border.left = mapBorderSide(fmt.borders.left);
    if (fmt.borders.right) border.right = mapBorderSide(fmt.borders.right);
    if (Object.keys(border).length > 0) style.border = border;
  }

  return style;
}

interface ExportXLSXOptions {
  columnWidths?: Map<number, number>;
  rowHeights?: Map<number, number>;
  mergedRegions?: Array<{
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  }>;
}

/** Export cell data to XLSX ArrayBuffer with full formatting */
export async function exportXLSX(
  sheetsData: Array<{
    name: string;
    cells: Map<string, CellData>;
    options?: ExportXLSXOptions;
  }>,
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

    // Write formulas and formatting back
    for (const [key, cell] of sheet.cells) {
      const [r, c] = key.split(",").map(Number);
      const addr = XLSX.utils.encode_cell({ r, c });

      if (!ws[addr]) continue;

      // Formula
      if (cell.formula) {
        ws[addr].f = cell.formula.startsWith("=")
          ? cell.formula.slice(1)
          : cell.formula;
      }

      // Style/formatting
      if (cell.format && Object.keys(cell.format).length > 0) {
        ws[addr].s = buildXlsxStyle(cell.format);
      }
    }

    // Column widths
    if (sheet.options?.columnWidths) {
      const cols: Array<{ wch: number }> = [];
      for (let c = 0; c <= maxCol; c++) {
        const w = sheet.options.columnWidths.get(c);
        cols.push({ wch: w ? Math.round(w / 7) : 10 });
      }
      ws["!cols"] = cols;
    }

    // Row heights
    if (sheet.options?.rowHeights) {
      const rows: Array<{ hpt: number }> = [];
      for (let r = 0; r <= maxRow; r++) {
        const h = sheet.options.rowHeights.get(r);
        rows.push({ hpt: h ?? 20 });
      }
      ws["!rows"] = rows;
    }

    // Merged cells
    if (
      sheet.options?.mergedRegions &&
      sheet.options.mergedRegions.length > 0
    ) {
      ws["!merges"] = sheet.options.mergedRegions.map((m) => ({
        s: { r: m.startRow, c: m.startCol },
        e: { r: m.endRow, c: m.endCol },
      }));
    }

    XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
  }

  const buf = XLSX.write(workbook, {
    type: "array",
    bookType: "xlsx",
    cellStyles: true,
  });
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
