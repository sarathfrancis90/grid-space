import prisma from "../models/prisma";
import { NotFoundError, ForbiddenError } from "../utils/AppError";
import { sendSpreadsheetAttachment } from "./email.service";
import logger from "../utils/logger";

type AttachmentFormat = "csv" | "xlsx";

interface CellValue {
  value?: string | number | boolean | null;
  formula?: string;
}

/** Check user has at least viewer access to the spreadsheet */
async function checkViewerAccess(
  spreadsheetId: string,
  userId: string,
): Promise<void> {
  const spreadsheet = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: {
      ownerId: true,
      deletedAt: true,
      access: { where: { userId }, select: { role: true } },
    },
  });

  if (!spreadsheet || spreadsheet.deletedAt) {
    throw new NotFoundError("Spreadsheet not found");
  }

  if (spreadsheet.ownerId !== userId && spreadsheet.access.length === 0) {
    throw new ForbiddenError("You do not have access to this spreadsheet");
  }
}

/** Convert stored cell data (JSON) to CSV string */
function sheetsToCSV(cellData: unknown): string {
  const cells = parseCellData(cellData);
  const { maxRow, maxCol } = getDataBounds(cells);

  const lines: string[] = [];
  for (let r = 0; r <= maxRow; r++) {
    const fields: string[] = [];
    for (let c = 0; c <= maxCol; c++) {
      const cell = cells.get(`${r},${c}`);
      const val = cell?.value != null ? String(cell.value) : "";
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        fields.push('"' + val.replace(/"/g, '""') + '"');
      } else {
        fields.push(val);
      }
    }
    lines.push(fields.join(","));
  }
  return lines.join("\n");
}

/** Convert stored cell data to XLSX buffer */
async function sheetsToXLSX(
  sheetsData: Array<{ name: string; cellData: unknown }>,
): Promise<Buffer> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheetsData) {
    const cells = parseCellData(sheet.cellData);
    const { maxRow, maxCol } = getDataBounds(cells);
    const aoa: (string | number | boolean | null)[][] = [];

    for (let r = 0; r <= maxRow; r++) {
      const row: (string | number | boolean | null)[] = [];
      for (let c = 0; c <= maxCol; c++) {
        const cell = cells.get(`${r},${c}`);
        row.push(cell?.value ?? null);
      }
      aoa.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
  }

  const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buf);
}

function parseCellData(cellData: unknown): Map<string, CellValue> {
  const cells = new Map<string, CellValue>();
  if (!cellData || typeof cellData !== "object") return cells;

  const data = cellData as Record<string, unknown>;
  for (const [key, val] of Object.entries(data)) {
    if (val && typeof val === "object") {
      cells.set(key, val as CellValue);
    }
  }
  return cells;
}

function getDataBounds(cells: Map<string, CellValue>): {
  maxRow: number;
  maxCol: number;
} {
  let maxRow = 0;
  let maxCol = 0;
  for (const key of cells.keys()) {
    const parts = key.split(",");
    const r = parseInt(parts[0], 10);
    const c = parseInt(parts[1], 10);
    if (!isNaN(r) && r > maxRow) maxRow = r;
    if (!isNaN(c) && c > maxCol) maxCol = c;
  }
  return { maxRow, maxCol };
}

interface EmailResult {
  sent: number;
  failed: number;
}

/** Send a spreadsheet as an email attachment to one or more recipients */
export async function sendSpreadsheetEmail(
  spreadsheetId: string,
  userId: string,
  senderName: string,
  recipients: string[],
  subject: string | undefined,
  message: string,
  format: AttachmentFormat,
): Promise<EmailResult> {
  await checkViewerAccess(spreadsheetId, userId);

  const spreadsheet = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: {
      title: true,
      sheets: {
        orderBy: { index: "asc" },
        select: { name: true, cellData: true },
      },
    },
  });

  if (!spreadsheet) {
    throw new NotFoundError("Spreadsheet not found");
  }

  let attachmentBuffer: Buffer;
  let filename: string;
  let contentType: string;

  const safeTitle = spreadsheet.title.replace(/[^a-zA-Z0-9_-]/g, "_");

  if (format === "csv") {
    // CSV only exports first sheet
    const firstSheet = spreadsheet.sheets[0];
    const csvContent = firstSheet ? sheetsToCSV(firstSheet.cellData) : "";
    attachmentBuffer = Buffer.from(csvContent, "utf-8");
    filename = `${safeTitle}.csv`;
    contentType = "text/csv";
  } else {
    attachmentBuffer = await sheetsToXLSX(spreadsheet.sheets);
    filename = `${safeTitle}.xlsx`;
    contentType =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }

  const emailSubject =
    subject ?? `${senderName} sent you "${spreadsheet.title}"`;

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendSpreadsheetAttachment(
      recipient,
      senderName,
      spreadsheet.title,
      message,
      { filename, content: attachmentBuffer, contentType },
    );
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  logger.info(
    {
      spreadsheetId,
      userId,
      recipients: recipients.length,
      format,
      sent,
      failed,
    },
    "Email attachment send complete",
  );

  return { sent, failed };
}
