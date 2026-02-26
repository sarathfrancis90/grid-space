import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { AppError } from "../utils/AppError";
import { apiSuccess, apiPaginated } from "../utils/apiResponse";
import * as notificationService from "../services/notification.service";

function paramStr(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] ?? "";
  return val ?? "";
}

export async function listNotifications(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const { notifications, total, page, limit } =
      await notificationService.listNotifications(req.user.id, {
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
      });

    res.json(apiPaginated(notifications, page, limit, total));
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const count = await notificationService.getUnreadCount(req.user.id);
    res.json(apiSuccess({ count }));
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const notificationId = paramStr(req.params.id);
    const notif = await notificationService.markAsRead(
      req.user.id,
      notificationId,
    );

    res.json(apiSuccess(notif));
  } catch (err) {
    next(err);
  }
}

export async function markAsUnread(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const notificationId = paramStr(req.params.id);
    const notif = await notificationService.markAsUnread(
      req.user.id,
      notificationId,
    );

    res.json(apiSuccess(notif));
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    await notificationService.markAllAsRead(req.user.id);
    res.json(apiSuccess({ message: "All notifications marked as read" }));
  } catch (err) {
    next(err);
  }
}

export async function deleteNotification(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const notificationId = paramStr(req.params.id);
    await notificationService.deleteNotification(req.user.id, notificationId);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getPreferences(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = (req.query.spreadsheetId as string) || null;
    const prefs = await notificationService.getPreferences(
      req.user.id,
      spreadsheetId,
    );

    res.json(apiSuccess(prefs));
  } catch (err) {
    next(err);
  }
}

export async function updatePreferences(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = req.body.spreadsheetId ?? null;
    const prefs = await notificationService.updatePreferences(
      req.user.id,
      spreadsheetId,
      req.body,
    );

    res.json(apiSuccess(prefs));
  } catch (err) {
    next(err);
  }
}
