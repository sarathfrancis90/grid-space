import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { apiSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import * as sharingService from "../services/sharing.service";

function paramStr(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0];
  return val ?? "";
}

/** GET /api/spreadsheets/:id/access — list collaborators */
export async function listCollaborators(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);
    if (!id) throw new AppError(400, "Spreadsheet ID is required");

    const collaborators = await sharingService.listCollaborators(
      id,
      req.user.id,
    );

    res.json(apiSuccess(collaborators));
  } catch (err) {
    next(err);
  }
}

/** POST /api/spreadsheets/:id/access — add collaborator */
export async function addCollaborator(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);
    if (!id) throw new AppError(400, "Spreadsheet ID is required");

    const { email, role } = req.body;

    const collaborator = await sharingService.addCollaborator(
      id,
      req.user.id,
      email,
      role,
    );

    res.status(201).json(apiSuccess(collaborator));
  } catch (err) {
    next(err);
  }
}

/** PUT /api/spreadsheets/:id/access/:userId — change role */
export async function changeRole(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);
    const targetUserId = paramStr(req.params.userId);
    if (!id || !targetUserId) {
      throw new AppError(400, "Spreadsheet ID and User ID are required");
    }

    const { role } = req.body;

    const updated = await sharingService.changeRole(
      id,
      req.user.id,
      targetUserId,
      role,
    );

    res.json(apiSuccess(updated));
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/spreadsheets/:id/access/:userId — remove access */
export async function removeCollaborator(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);
    const targetUserId = paramStr(req.params.userId);
    if (!id || !targetUserId) {
      throw new AppError(400, "Spreadsheet ID and User ID are required");
    }

    await sharingService.removeCollaborator(id, req.user.id, targetUserId);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/** POST /api/spreadsheets/:id/share-link — create/update share link */
export async function createShareLink(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);
    if (!id) throw new AppError(400, "Spreadsheet ID is required");

    const { role } = req.body;

    const result = await sharingService.createShareLink(
      id,
      req.user.id,
      role || "viewer",
    );

    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
}

/** GET /api/spreadsheets/:id/share-link — get share link info */
export async function getShareLink(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);
    if (!id) throw new AppError(400, "Spreadsheet ID is required");

    const result = await sharingService.getShareLink(id, req.user.id);

    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/spreadsheets/:id/share-link — disable share link */
export async function disableShareLink(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);
    if (!id) throw new AppError(400, "Spreadsheet ID is required");

    await sharingService.disableShareLink(id, req.user.id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/** GET /api/share/:token — access via share link */
export async function accessViaShareLink(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = paramStr(req.params.token);
    if (!token) throw new AppError(400, "Share token is required");

    const result = await sharingService.accessViaShareLink(token);

    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
}

/** POST /api/spreadsheets/:id/transfer-ownership */
export async function transferOwnership(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);
    if (!id) throw new AppError(400, "Spreadsheet ID is required");

    const { email } = req.body;

    await sharingService.transferOwnership(id, req.user.id, email);

    res.json(apiSuccess({ message: "Ownership transferred" }));
  } catch (err) {
    next(err);
  }
}

/** POST /api/spreadsheets/:id/publish */
export async function publishToWeb(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);
    if (!id) throw new AppError(400, "Spreadsheet ID is required");

    const result = await sharingService.publishToWeb(id, req.user.id);

    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/spreadsheets/:id/publish */
export async function unpublishFromWeb(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);
    if (!id) throw new AppError(400, "Spreadsheet ID is required");

    await sharingService.unpublishFromWeb(id, req.user.id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/** GET /api/published/:token — public read-only access */
export async function accessPublished(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = paramStr(req.params.token);
    if (!token) throw new AppError(400, "Publish token is required");

    const result = await sharingService.accessPublished(token);

    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
}
