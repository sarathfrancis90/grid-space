import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { apiSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import * as emailService from "../services/email.service";
import prisma from "../models/prisma";
import logger from "../utils/logger";

function paramStr(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0];
  return val ?? "";
}

/** POST /api/spreadsheets/:id/email — send spreadsheet as email attachment */
export async function sendEmailAttachment(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = paramStr(req.params.id);
    if (!spreadsheetId) throw new AppError(400, "Spreadsheet ID is required");

    const { recipients, subject, message, format, spreadsheetData } = req.body;

    // Verify user has access to the spreadsheet
    const access = await prisma.spreadsheetAccess.findFirst({
      where: {
        spreadsheetId,
        userId: req.user.id,
      },
    });

    if (!access) {
      throw new AppError(403, "You do not have access to this spreadsheet");
    }

    const spreadsheet = await prisma.spreadsheet.findUnique({
      where: { id: spreadsheetId },
      select: { title: true },
    });

    if (!spreadsheet) {
      throw new AppError(404, "Spreadsheet not found");
    }

    // Generate the attachment from the provided data
    const attachment = generateAttachment(
      spreadsheetData,
      spreadsheet.title || "Spreadsheet",
      format,
    );

    const senderName = req.user.name || req.user.email;

    // Send to each recipient
    const results: Array<{ email: string; success: boolean }> = [];
    for (const email of recipients) {
      const result = await emailService.sendWithAttachment(
        email,
        subject,
        message,
        attachment,
        senderName,
      );
      results.push({ email, success: result.success });
    }

    const allSent = results.every((r) => r.success);
    const sentCount = results.filter((r) => r.success).length;

    logger.info(
      {
        userId: req.user.id,
        spreadsheetId,
        recipients: recipients.length,
        sentCount,
        format,
      },
      "Email attachment request processed",
    );

    res.json(
      apiSuccess({
        sent: sentCount,
        total: recipients.length,
        allSent,
        results,
      }),
    );
  } catch (err) {
    next(err);
  }
}

function generateAttachment(
  rawData: string,
  title: string,
  format: "csv" | "xlsx" | "pdf",
): emailService.EmailAttachment {
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9_\- ]/g, "_");

  if (format === "csv") {
    return {
      filename: `${sanitizedTitle}.csv`,
      content: Buffer.from(rawData, "utf-8"),
      contentType: "text/csv",
    };
  }

  if (format === "xlsx") {
    // Client sends base64-encoded XLSX data
    return {
      filename: `${sanitizedTitle}.xlsx`,
      content: Buffer.from(rawData, "base64"),
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }

  // PDF — client sends base64-encoded PDF data
  return {
    filename: `${sanitizedTitle}.pdf`,
    content: Buffer.from(rawData, "base64"),
    contentType: "application/pdf",
  };
}
