import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { AppError } from "../utils/AppError";
import { apiSuccess } from "../utils/apiResponse";
import * as templateService from "../services/template.service";

function paramStr(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] ?? "";
  return val ?? "";
}

export async function listTemplates(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const templates = await templateService.listTemplates(req.user.id);
    res.json(apiSuccess(templates));
  } catch (err) {
    next(err);
  }
}

export async function createFromTemplate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const templateId = paramStr(req.params.templateId);
    const spreadsheet = await templateService.createFromTemplate(
      req.user.id,
      templateId,
    );

    res.status(201).json(apiSuccess(spreadsheet));
  } catch (err) {
    next(err);
  }
}

export async function saveAsTemplate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = paramStr(req.params.id);
    const { templateName } = req.body;

    const template = await templateService.saveAsTemplate(
      spreadsheetId,
      req.user.id,
      templateName,
    );

    res.json(apiSuccess(template));
  } catch (err) {
    next(err);
  }
}
