import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { AppError } from "../utils/AppError";
import { apiSuccess } from "../utils/apiResponse";
import * as extensionService from "../services/extension.service";

function paramStr(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] ?? "";
  return val ?? "";
}

export async function listExtensions(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const extensions = await extensionService.listExtensions(req.user.id);
    res.json(apiSuccess(extensions));
  } catch (err) {
    next(err);
  }
}

export async function getExtension(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);
    const ext = await extensionService.getExtension(req.user.id, id);
    res.json(apiSuccess(ext));
  } catch (err) {
    next(err);
  }
}

export async function installExtension(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const { manifest, grantedPermissions } = req.body;
    const ext = await extensionService.installExtension(
      req.user.id,
      manifest,
      grantedPermissions,
    );
    res.status(201).json(apiSuccess(ext));
  } catch (err) {
    next(err);
  }
}

export async function uninstallExtension(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);
    await extensionService.uninstallExtension(req.user.id, id);
    res.json(apiSuccess({ deleted: true }));
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);
    const { status, errorMessage } = req.body;
    const ext = await extensionService.updateExtensionStatus(
      req.user.id,
      id,
      status,
      errorMessage,
    );
    res.json(apiSuccess(ext));
  } catch (err) {
    next(err);
  }
}

export async function updatePermissions(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);
    const { grantedPermissions } = req.body;
    const ext = await extensionService.updatePermissions(
      req.user.id,
      id,
      grantedPermissions,
    );
    res.json(apiSuccess(ext));
  } catch (err) {
    next(err);
  }
}

export async function updateStorage(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);
    const { key, value } = req.body;
    await extensionService.updateStorage(req.user.id, id, key, value);
    res.json(apiSuccess({ updated: true }));
  } catch (err) {
    next(err);
  }
}
