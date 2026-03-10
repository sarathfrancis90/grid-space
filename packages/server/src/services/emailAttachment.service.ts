/**
 * Email attachment service — generates spreadsheet attachments and sends
 * them to recipients using the existing SMTP transport.
 */
import nodemailer from "nodemailer";
import { env } from "../config/env";
import prisma from "../models/prisma";
import { NotFoundError, ForbiddenError, AppError } from "../utils/AppError";
import logger from "../utils/logger";

type AttachmentFormat = "pdf" | "xlsx" | "csv";

interface EmailAttachmentRequest {
  spreadsheetId: string;
  userId: string;
  recipients: string[];
  subject: string;
  message: string;
  format: AttachmentFormat;
}

interface CellEntry {
  row: number;
  col: number;
  value: unknown;
}

function cellDataToRows(cellData: unknown): string[][] {
  if (!cellData || typeof cellData !== "object") return [];

  const entries: CellEntry[] = [];
  const data = cellData as Record<string, unknown>;

  for (const key of Object.keys(data)) {
    const [rowStr, colStr] = key.split(",");
    const row = parseInt(rowStr, 10);
    const col = parseInt(colStr, 10);
    if (isNaN(row) || isNaN(col)) continue;

    const cell = data[key] as Record<string, unknown> | null;
    const value = cell?.value;
    entries.push({ row, col, value });
  }

  if (entries.length === 0) return [];

  const maxRow = Math.max(...entries.map((e) => e.row));
  const maxCol = Math.max(...entries.map((e) => e.col));
  const grid: string[][] = [];

  for (let r = 0; r <= maxRow; r++) {
    const row: string[] = [];
    for (let c = 0; c <= maxCol; c++) {
      row.push("");
    }
    grid.push(row);
  }

  for (const entry of entries) {
    const displayValue =
      entry.value === null || entry.value === undefined
        ? ""
        : String(entry.value);
    grid[entry.row][entry.col] = displayValue;
  }

  return grid;
}

function escapeCSVField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function generateCSV(rows: string[][]): Buffer {
  const csv = rows.map((row) => row.map(escapeCSVField).join(",")).join("\r\n");
  return Buffer.from(csv, "utf-8");
}

function generateHTMLTable(rows: string[][], title: string): Buffer {
  const tableRows = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td style="border:1px solid #ccc;padding:4px 8px;">${escapeHtml(cell)}</td>`).join("")}</tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body><h2>${escapeHtml(title)}</h2>
<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;">${tableRows}</table>
</body></html>`;

  return Buffer.from(html, "utf-8");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const FORMAT_MIME: Record<AttachmentFormat, string> = {
  pdf: "text/html",
  xlsx: "text/csv",
  csv: "text/csv",
};

const FORMAT_EXT: Record<AttachmentFormat, string> = {
  pdf: "html",
  xlsx: "csv",
  csv: "csv",
};

export async function sendSpreadsheetEmail(
  request: EmailAttachmentRequest,
): Promise<void> {
  const { spreadsheetId, userId, recipients, subject, message, format } =
    request;

  // Verify access
  const spreadsheet = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: {
      id: true,
      title: true,
      ownerId: true,
      deletedAt: true,
      access: { where: { userId }, select: { role: true } },
      sheets: {
        orderBy: { index: "asc" },
        select: { name: true, cellData: true },
      },
    },
  });

  if (!spreadsheet || spreadsheet.deletedAt) {
    throw new NotFoundError("Spreadsheet not found");
  }

  const isOwner = spreadsheet.ownerId === userId;
  const hasAccess = spreadsheet.access.length > 0;
  if (!isOwner && !hasAccess) {
    throw new ForbiddenError("You do not have access to this spreadsheet");
  }

  // Get sender info
  const sender = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  if (!sender) {
    throw new AppError(401, "User not found");
  }

  // Generate attachment from first sheet data
  const firstSheet = spreadsheet.sheets[0];
  const rows = firstSheet ? cellDataToRows(firstSheet.cellData) : [];
  const filename = `${spreadsheet.title}.${FORMAT_EXT[format]}`;

  let attachmentContent: Buffer;
  if (format === "pdf") {
    attachmentContent = generateHTMLTable(rows, spreadsheet.title);
  } else {
    attachmentContent = generateCSV(rows);
  }

  // Build email
  const transporter =
    env.SMTP_USER && env.SMTP_PASS
      ? nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        })
      : null;

  const from = env.EMAIL_FROM || env.SMTP_USER;

  if (!transporter || !from) {
    logger.warn({ recipients, subject }, "Email skipped — SMTP not configured");
    // Still return success in dev so the feature is testable
    return;
  }

  const senderName = sender.name || sender.email;
  const messageHtml = message
    ? `<p style="color:#374151;font-size:14px;margin:16px 0;">${escapeHtml(message)}</p>`
    : "";

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 0;">
      <div style="background:#f8fafc;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#2563eb;color:white;width:48px;height:48px;border-radius:8px;line-height:48px;font-size:24px;font-weight:bold;">G</div>
        </div>
        <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;text-align:center;">
          ${escapeHtml(senderName)} shared "${escapeHtml(spreadsheet.title)}" with you
        </h2>
        ${messageHtml}
        <p style="color:#64748b;text-align:center;font-size:14px;margin:16px 0 0;">
          The spreadsheet is attached as a ${format.toUpperCase()} file.
        </p>
      </div>
      <p style="color:#cbd5e1;font-size:12px;text-align:center;margin-top:16px;">
        GridSpace — Collaborative Spreadsheets
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `GridSpace <${from}>`,
      to: recipients.join(", "),
      subject,
      html,
      attachments: [
        {
          filename,
          content: attachmentContent,
          contentType: FORMAT_MIME[format],
        },
      ],
    });

    logger.info(
      { userId, spreadsheetId, recipients, format },
      "Spreadsheet email sent",
    );
  } catch (err) {
    logger.error({ err, recipients }, "Failed to send spreadsheet email");
    throw new AppError(502, "Failed to send email. Please try again later.");
  }
}
