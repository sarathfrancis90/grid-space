import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { AppError } from "../utils/AppError";
import { apiSuccess } from "../utils/apiResponse";
import * as notificationRuleService from "../services/notificationRule.service";

function paramStr(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] ?? "";
  return val ?? "";
}

export async function listRules(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = paramStr(req.params.spreadsheetId);
    const rules = await notificationRuleService.listRules(
      req.user.id,
      spreadsheetId,
    );

    res.json(apiSuccess(rules));
  } catch (err) {
    next(err);
  }
}

export async function createRule(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = paramStr(req.params.spreadsheetId);
    const rule = await notificationRuleService.createRule(
      req.user.id,
      spreadsheetId,
      req.body,
    );

    res.status(201).json(apiSuccess(rule));
  } catch (err) {
    next(err);
  }
}

export async function updateRule(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const ruleId = paramStr(req.params.ruleId);
    const rule = await notificationRuleService.updateRule(
      req.user.id,
      ruleId,
      req.body,
    );

    res.json(apiSuccess(rule));
  } catch (err) {
    next(err);
  }
}

export async function deleteRule(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const ruleId = paramStr(req.params.ruleId);
    await notificationRuleService.deleteRule(req.user.id, ruleId);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
