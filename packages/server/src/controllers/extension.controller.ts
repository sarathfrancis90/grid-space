import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { AppError } from "../utils/AppError";
import { apiSuccess } from "../utils/apiResponse";
import * as extensionService from "../services/extension.service";

function paramStr(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] ?? "";
  return val ?? "";
}

// ─── Marketplace ────────────────────────────────────────

export async function listPublished(
  _req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const extensions = await extensionService.listPublishedExtensions();
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
    const slug = paramStr(req.params.slug);
    const ext = await extensionService.getExtension(slug);
    res.json(apiSuccess(ext));
  } catch (err) {
    next(err);
  }
}

// ─── Author CRUD ────────────────────────────────────────

export async function createExtension(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const ext = await extensionService.createExtension(req.user.id, req.body);
    res.status(201).json(apiSuccess(ext));
  } catch (err) {
    next(err);
  }
}

export async function updateExtension(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const slug = paramStr(req.params.slug);
    const ext = await extensionService.updateExtension(
      req.user.id,
      slug,
      req.body,
    );
    res.json(apiSuccess(ext));
  } catch (err) {
    next(err);
  }
}

export async function deleteExtension(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const slug = paramStr(req.params.slug);
    await extensionService.deleteExtension(req.user.id, slug);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listMyExtensions(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const extensions = await extensionService.listMyExtensions(req.user.id);
    res.json(apiSuccess(extensions));
  } catch (err) {
    next(err);
  }
}

// ─── Install / Uninstall ────────────────────────────────

export async function installExtension(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const slug = paramStr(req.params.slug);
    const install = await extensionService.installExtension(req.user.id, slug);
    res.status(201).json(apiSuccess(install));
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
    const slug = paramStr(req.params.slug);
    await extensionService.uninstallExtension(req.user.id, slug);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listInstalled(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const installs = await extensionService.listInstalledExtensions(
      req.user.id,
    );
    res.json(apiSuccess(installs));
  } catch (err) {
    next(err);
  }
}

export async function toggleExtension(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const slug = paramStr(req.params.slug);
    const { isEnabled } = req.body;
    const result = await extensionService.toggleExtension(
      req.user.id,
      slug,
      isEnabled,
    );
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const slug = paramStr(req.params.slug);
    const result = await extensionService.updateExtensionSettings(
      req.user.id,
      slug,
      req.body.settings,
    );
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
}
