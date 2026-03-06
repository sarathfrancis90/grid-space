import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { AppError } from "../utils/AppError";
import { apiSuccess } from "../utils/apiResponse";
import * as suggestionService from "../services/suggestion.service";

function paramStr(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] ?? "";
  return val ?? "";
}

export async function listSuggestions(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = paramStr(req.params.id);
    const sheetId = req.query.sheetId as string | undefined;

    const suggestions = await suggestionService.listSuggestions(
      spreadsheetId,
      req.user.id,
      sheetId,
    );

    res.json(apiSuccess(suggestions));
  } catch (err) {
    next(err);
  }
}

export async function createSuggestion(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = paramStr(req.params.id);
    const { sheetId, cellKey, oldValue, newValue, oldFormula, newFormula } =
      req.body;

    const suggestion = await suggestionService.createSuggestion(
      spreadsheetId,
      req.user.id,
      sheetId,
      cellKey,
      oldValue ?? null,
      newValue ?? null,
      oldFormula ?? null,
      newFormula ?? null,
    );

    res.status(201).json(apiSuccess(suggestion));
  } catch (err) {
    next(err);
  }
}

export async function reviewSuggestion(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = paramStr(req.params.id);
    const suggestionId = paramStr(req.params.suggestionId);
    const { action } = req.body;

    const suggestion = await suggestionService.reviewSuggestion(
      spreadsheetId,
      req.user.id,
      suggestionId,
      action,
    );

    res.json(apiSuccess(suggestion));
  } catch (err) {
    next(err);
  }
}

export async function bulkReview(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = paramStr(req.params.id);
    const { action } = req.body;

    const count = await suggestionService.bulkReview(
      spreadsheetId,
      req.user.id,
      action,
    );

    res.json(apiSuccess({ count }));
  } catch (err) {
    next(err);
  }
}
