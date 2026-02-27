/**
 * PDF Export utility — renders spreadsheet data to a styled HTML page
 * and triggers print/save as PDF via the browser's print dialog.
 * Supports formatting, page orientation, margins, headers/footers.
 */
import type { CellData, CellFormat } from "../types/grid";

export interface PDFExportOptions {
  title?: string;
  orientation?: "portrait" | "landscape";
  pageSize?: "A4" | "Letter";
  marginMm?: number;
  headerText?: string;
  footerText?: string;
  showGridlines?: boolean;
  fitToPage?: boolean;
}

function formatStyleString(fmt: CellFormat): string {
  const styles: string[] = [];
  if (fmt.bold) styles.push("font-weight:bold");
  if (fmt.italic) styles.push("font-style:italic");
  if (fmt.underline) styles.push("text-decoration:underline");
  if (fmt.strikethrough) {
    styles.push(
      fmt.underline
        ? "text-decoration:underline line-through"
        : "text-decoration:line-through",
    );
  }
  if (fmt.fontFamily) styles.push(`font-family:${fmt.fontFamily}`);
  if (fmt.fontSize) styles.push(`font-size:${fmt.fontSize}px`);
  if (fmt.textColor) styles.push(`color:${fmt.textColor}`);
  if (fmt.backgroundColor) {
    styles.push(`background-color:${fmt.backgroundColor}`);
  }
  if (fmt.horizontalAlign) styles.push(`text-align:${fmt.horizontalAlign}`);
  if (fmt.verticalAlign) styles.push(`vertical-align:${fmt.verticalAlign}`);
  return styles.join(";");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getDataBounds(cells: Map<string, CellData>): {
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
  return { maxRow, maxCol };
}

export function exportToPDF(
  cells: Map<string, CellData>,
  options: PDFExportOptions = {},
): void {
  const {
    title = "Spreadsheet",
    orientation = "portrait",
    pageSize = "A4",
    marginMm = 15,
    headerText = "",
    footerText = "",
    showGridlines = true,
    fitToPage = false,
  } = options;

  const { maxRow, maxCol } = getDataBounds(cells);
  const borderStyle = showGridlines ? "1px solid #ccc" : "none";

  const pageSizeCSS = pageSize === "A4" ? "210mm 297mm" : "8.5in 11in";

  let html = `<!DOCTYPE html><html><head><title>${escapeHtml(title)}</title>
<style>
  @page {
    size: ${orientation === "landscape" ? pageSizeCSS.split(" ").reverse().join(" ") : pageSizeCSS};
    margin: ${marginMm}mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: Arial, sans-serif;
    font-size: 10px;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .header {
    text-align: center;
    padding: 8px 0;
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 8px;
  }
  .footer {
    text-align: center;
    padding: 8px 0;
    font-size: 9px;
    color: #666;
    margin-top: 8px;
    position: fixed;
    bottom: 0;
    width: 100%;
  }
  table {
    border-collapse: collapse;
    ${fitToPage ? "width:100%;" : ""}
    page-break-inside: auto;
  }
  tr { page-break-inside: avoid; page-break-after: auto; }
  td, th {
    border: ${borderStyle};
    padding: 4px 6px;
    text-align: left;
    vertical-align: middle;
    white-space: nowrap;
    overflow: hidden;
    max-width: 200px;
    text-overflow: ellipsis;
  }
  th { background: #f0f0f0; font-weight: bold; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style></head><body>`;

  if (headerText) {
    html += `<div class="header">${escapeHtml(headerText)}</div>`;
  }

  html += `<div class="header">${escapeHtml(title)}</div><table>`;

  for (let r = 0; r <= maxRow; r++) {
    html += "<tr>";
    for (let c = 0; c <= maxCol; c++) {
      const cell = cells.get(`${r},${c}`);
      const val = cell?.value != null ? String(cell.value) : "";
      const tag = r === 0 ? "th" : "td";
      const styleAttr = cell?.format
        ? ` style="${formatStyleString(cell.format)}"`
        : "";
      html += `<${tag}${styleAttr}>${escapeHtml(val)}</${tag}>`;
    }
    html += "</tr>";
  }

  html += "</table>";

  if (footerText) {
    html += `<div class="footer">${escapeHtml(footerText)}</div>`;
  }

  html += "</body></html>";

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    // Wait for styles to load before printing
    printWindow.onload = () => {
      printWindow.print();
    };
    // Fallback: trigger print after a short delay
    setTimeout(() => {
      try {
        printWindow.print();
      } catch {
        // Window might already be closed
      }
    }, 500);
  }
}
