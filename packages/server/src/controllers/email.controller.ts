import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { apiSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import * as emailAttachmentService from "../services/emailAttachment.service";

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

    const { recipients, subject, message, format } = req.body;

    const result = await emailAttachmentService.sendSpreadsheetEmail({
      spreadsheetId,
      userId: req.user.id,
      senderName: req.user.name ?? req.user.email,
      recipients,
      subject,
      message,
      format,
    });

    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
}
