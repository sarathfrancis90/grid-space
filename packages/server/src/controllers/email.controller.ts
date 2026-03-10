import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { AppError } from "../utils/AppError";
import { apiSuccess } from "../utils/apiResponse";
import { sendWithAttachment } from "../services/email.service";
import logger from "../utils/logger";

interface SheetData {
  name: string;
  cells: Record<string, { value?: string | number | boolean | null }>;
}

interface SendEmailBody {
  recipients: string[];
  subject: string;
  message: string;
  format: "xlsx" | "csv";
  spreadsheetData: {
    sheets: SheetData[];
  };
}

function sheetsToCSV(sheets: SheetData[]): Buffer {
  const sheet = sheets[0];
  if (!sheet) return Buffer.from("");

  let maxRow = 0;
  let maxCol = 0;
  for (const key of Object.keys(sheet.cells)) {
    const [r, c] = key.split(",").map(Number);
    if (r > maxRow) maxRow = r;
    if (c > maxCol) maxCol = c;
  }

  const lines: string[] = [];
  for (let r = 0; r <= maxRow; r++) {
    const row: string[] = [];
    for (let c = 0; c <= maxCol; c++) {
      const cell = sheet.cells[`${r},${c}`];
      const val = cell?.value != null ? String(cell.value) : "";
      // Escape CSV values containing commas, quotes, or newlines
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        row.push(`"${val.replace(/"/g, '""')}"`);
      } else {
        row.push(val);
      }
    }
    lines.push(row.join(","));
  }

  return Buffer.from(lines.join("\n"), "utf-8");
}

async function sheetsToXLSX(sheets: SheetData[]): Promise<Buffer> {
  // Dynamic import to avoid loading SheetJS at startup
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    let maxRow = 0;
    let maxCol = 0;
    for (const key of Object.keys(sheet.cells)) {
      const [r, c] = key.split(",").map(Number);
      if (r > maxRow) maxRow = r;
      if (c > maxCol) maxCol = c;
    }

    const aoa: (string | number | boolean | null)[][] = [];
    for (let r = 0; r <= maxRow; r++) {
      const row: (string | number | boolean | null)[] = [];
      for (let c = 0; c <= maxCol; c++) {
        const cell = sheet.cells[`${r},${c}`];
        row.push(cell?.value ?? null);
      }
      aoa.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(workbook, ws, sheet.name.slice(0, 31));
  }

  const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buf);
}

export async function sendEmailAttachment(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const body = req.body as SendEmailBody;
    const { recipients, subject, message, format, spreadsheetData } = body;

    const senderName = req.user.name || req.user.email;

    let content: Buffer;
    let filename: string;
    let contentType: string;

    if (format === "csv") {
      content = sheetsToCSV(spreadsheetData.sheets);
      filename = "spreadsheet.csv";
      contentType = "text/csv";
    } else {
      content = await sheetsToXLSX(spreadsheetData.sheets);
      filename = "spreadsheet.xlsx";
      contentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    }

    const results: Array<{ email: string; success: boolean }> = [];

    for (const recipient of recipients) {
      const result = await sendWithAttachment(
        recipient,
        subject,
        message,
        senderName,
        { filename, content, contentType },
      );
      results.push({ email: recipient, success: result.success });
    }

    logger.info(
      { userId: req.user.id, recipients, format },
      "Email attachment sent",
    );

    res.json(apiSuccess({ sent: results }));
  } catch (err) {
    next(err);
  }
}
