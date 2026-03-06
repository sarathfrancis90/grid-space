import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { AppError } from "../utils/AppError";
import { apiSuccess, apiPaginated } from "../utils/apiResponse";
import * as triggerService from "../services/trigger.service";

/** GET /api/spreadsheets/:id/triggers */
export async function listTriggers(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = req.params.id;
    const triggers = await triggerService.listTriggers(
      req.user.id,
      spreadsheetId,
    );

    res.json(apiSuccess(triggers));
  } catch (err) {
    next(err);
  }
}

/** POST /api/spreadsheets/:id/triggers */
export async function createTrigger(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = req.params.id;
    const { macroId, eventType, intervalMinutes } = req.body;

    const trigger = await triggerService.createTrigger(
      req.user.id,
      spreadsheetId,
      macroId,
      eventType,
      intervalMinutes,
    );

    res.status(201).json(apiSuccess(trigger));
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/spreadsheets/:id/triggers/:triggerId */
export async function updateTrigger(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const { triggerId } = req.params;
    const { isEnabled, intervalMinutes } = req.body;

    const trigger = await triggerService.updateTrigger(req.user.id, triggerId, {
      isEnabled,
      intervalMinutes,
    });

    res.json(apiSuccess(trigger));
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/spreadsheets/:id/triggers/:triggerId */
export async function deleteTrigger(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const { triggerId } = req.params;
    await triggerService.deleteTrigger(req.user.id, triggerId);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/** GET /api/spreadsheets/:id/triggers/:triggerId/logs */
export async function getTriggerLogs(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const { triggerId } = req.params;
    const page = Math.max(1, parseInt(String(req.query.page)) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit)) || 20),
    );

    const { logs, total } = await triggerService.getTriggerLogs(
      req.user.id,
      triggerId,
      page,
      limit,
    );

    res.json(apiPaginated(logs, page, limit, total));
  } catch (err) {
    next(err);
  }
}
