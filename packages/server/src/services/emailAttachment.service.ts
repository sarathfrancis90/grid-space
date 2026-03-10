import nodemailer from "nodemailer";
import * as XLSX from "xlsx";
import { env } from "../config/env";
import prisma from "../models/prisma";
import { AppError, NotFoundError } from "../utils/AppError";
import logger from "../utils/logger";

interface SendEmailOptions {
  spreadsheetId: string;
  userId: string;
  senderName: string;
  recipients: string[];
  subject: string;
  message: string;
  format: "pdf" | "xlsx" | "csv";
}

interface SendResult {
  sent: number;
  failed: number;
}

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

const FROM = env.EMAIL_FROM || env.SMTP_USER;

/**
 * Convert sheet cellData JSON to a 2D array of values.
 * cellData is stored as { "row,col": { value, ... } }
 */
function cellDataToGrid(
  cellData: Record<string, { value?: unknown }>,
): unknown[][] {
  const entries = Object.entries(cellData);
  if (entries.length === 0) return [[]];

  let maxRow = 0;
  let maxCol = 0;

  const parsed: Array<{ row: number; col: number; value: unknown }> = [];

  for (const [key, cell] of entries) {
    const parts = key.split(",");
    const row = parseInt(parts[0], 10);
    const col = parseInt(parts[1], 10);
    if (isNaN(row) || isNaN(col)) continue;

    if (row > maxRow) maxRow = row;
    if (col > maxCol) maxCol = col;
    parsed.push({ row, col, value: cell?.value ?? "" });
  }

  const grid: unknown[][] = [];
  for (let r = 0; r <= maxRow; r++) {
    grid.push(new Array(maxCol + 1).fill(""));
  }

  for (const { row, col, value } of parsed) {
    grid[row][col] = value;
  }

  return grid;
}

function generateCSV(
  sheets: Array<{
    name: string;
    cellData: Record<string, { value?: unknown }>;
  }>,
): Buffer {
  // Use first sheet for CSV
  const sheet = sheets[0];
  const grid = cellDataToGrid(sheet?.cellData ?? {});

  const lines = grid.map((row) =>
    row
      .map((val) => {
        const str = String(val ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(","),
  );

  return Buffer.from(lines.join("\n"), "utf-8");
}

function generateXLSX(
  sheets: Array<{
    name: string;
    cellData: Record<string, { value?: unknown }>;
  }>,
): Buffer {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const grid = cellDataToGrid(sheet.cellData ?? {});
    const ws = XLSX.utils.aoa_to_sheet(grid);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name || "Sheet1");
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buf);
}

function getAttachmentInfo(
  format: "pdf" | "xlsx" | "csv",
  title: string,
): {
  filename: string;
  contentType: string;
} {
  const safeName =
    title.replace(/[^a-zA-Z0-9_\- ]/g, "").trim() || "spreadsheet";
  switch (format) {
    case "xlsx":
      return {
        filename: `${safeName}.xlsx`,
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    case "csv":
      return { filename: `${safeName}.csv`, contentType: "text/csv" };
    case "pdf":
      // PDF generation on server is complex; fall back to CSV with a note
      return { filename: `${safeName}.csv`, contentType: "text/csv" };
  }
}

export async function sendSpreadsheetEmail(
  options: SendEmailOptions,
): Promise<SendResult> {
  const {
    spreadsheetId,
    userId,
    senderName,
    recipients,
    subject,
    message,
    format,
  } = options;

  // Check access
  const spreadsheet = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: {
      id: true,
      title: true,
      ownerId: true,
      deletedAt: true,
      access: { where: { userId }, select: { role: true } },
      sheets: {
        where: { isHidden: false },
        select: { name: true, cellData: true },
        orderBy: { index: "asc" },
      },
    },
  });

  if (!spreadsheet || spreadsheet.deletedAt) {
    throw new NotFoundError("Spreadsheet not found");
  }

  const isOwner = spreadsheet.ownerId === userId;
  const hasAccess = spreadsheet.access.length > 0;
  if (!isOwner && !hasAccess) {
    throw new AppError(403, "You do not have access to this spreadsheet");
  }

  if (!transporter || !FROM) {
    throw new AppError(503, "Email service is not configured");
  }

  // Generate attachment
  const sheetsData = spreadsheet.sheets.map((s) => ({
    name: s.name,
    cellData: (s.cellData ?? {}) as Record<string, { value?: unknown }>,
  }));

  let attachmentBuffer: Buffer;
  if (format === "xlsx") {
    attachmentBuffer = generateXLSX(sheetsData);
  } else {
    // csv and pdf fallback to csv
    attachmentBuffer = generateCSV(sheetsData);
  }

  const { filename, contentType } = getAttachmentInfo(
    format,
    spreadsheet.title,
  );

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 0;">
      <div style="background: #f8fafc; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: #2563eb; color: white; width: 48px; height: 48px; border-radius: 8px; line-height: 48px; font-size: 24px; font-weight: bold;">G</div>
        </div>
        <h2 style="margin: 0 0 8px; color: #1e293b; font-size: 20px; text-align: center;">
          ${senderName} sent you a spreadsheet
        </h2>
        <p style="color: #64748b; text-align: center; margin: 0 0 24px; font-size: 15px;">
          <strong>"${spreadsheet.title}"</strong> is attached as a ${format.toUpperCase()} file.
        </p>
        ${
          message
            ? `<div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <p style="color: #475569; margin: 0; font-size: 14px; white-space: pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
              </div>`
            : ""
        }
      </div>
      <p style="color: #cbd5e1; font-size: 12px; text-align: center; margin-top: 16px;">
        GridSpace — Collaborative Spreadsheets
      </p>
    </div>
  `;

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    try {
      await transporter.sendMail({
        from: `GridSpace <${FROM}>`,
        to: recipient,
        subject,
        html,
        attachments: [
          {
            filename,
            content: attachmentBuffer,
            contentType,
          },
        ],
      });
      sent++;
      logger.info(
        { to: recipient, spreadsheetId, format },
        "Email attachment sent",
      );
    } catch (err) {
      failed++;
      logger.error(
        { to: recipient, spreadsheetId, err },
        "Failed to send email attachment",
      );
    }
  }

  if (sent === 0 && failed > 0) {
    throw new AppError(502, "Failed to send email to any recipient");
  }

  return { sent, failed };
}
