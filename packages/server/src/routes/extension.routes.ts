import { Router } from "express";
import { z } from "zod/v4";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";
import * as extensionController from "../controllers/extension.controller";

const router = Router();

// ─── Marketplace (public listing, auth required for details) ──

router.get("/marketplace", authenticate, extensionController.listPublished);

router.get(
  "/marketplace/:slug",
  authenticate,
  extensionController.getExtension,
);

// ─── Author CRUD ────────────────────────────────────────

const createExtensionSchema = {
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(2000).optional(),
    version: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/, "Version must be semver (e.g. 1.0.0)")
      .optional(),
    permissions: z.array(z.string()).max(20).optional(),
    entryPoint: z.string().max(200).optional(),
    sourceCode: z.string().max(500000).optional(),
    iconUrl: z.string().url().max(500).optional(),
  }),
};

const updateExtensionSchema = {
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(2000).optional(),
    version: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/, "Version must be semver (e.g. 1.0.0)")
      .optional(),
    permissions: z.array(z.string()).max(20).optional(),
    entryPoint: z.string().max(200).optional(),
    sourceCode: z.string().max(500000).optional(),
    iconUrl: z.string().url().max(500).nullable().optional(),
    isPublished: z.boolean().optional(),
  }),
};

router.get("/my", authenticate, extensionController.listMyExtensions);

router.post(
  "/",
  authenticate,
  writeLimiter,
  validate(createExtensionSchema),
  extensionController.createExtension,
);

router.put(
  "/:slug",
  authenticate,
  writeLimiter,
  validate(updateExtensionSchema),
  extensionController.updateExtension,
);

router.delete(
  "/:slug",
  authenticate,
  writeLimiter,
  extensionController.deleteExtension,
);

// ─── Install / Uninstall ────────────────────────────────

const toggleSchema = {
  body: z.object({ isEnabled: z.boolean() }),
};

const settingsSchema = {
  body: z.object({ settings: z.record(z.string(), z.unknown()) }),
};

router.get("/installed", authenticate, extensionController.listInstalled);

router.post(
  "/:slug/install",
  authenticate,
  writeLimiter,
  extensionController.installExtension,
);

router.delete(
  "/:slug/uninstall",
  authenticate,
  writeLimiter,
  extensionController.uninstallExtension,
);

router.patch(
  "/:slug/toggle",
  authenticate,
  writeLimiter,
  validate(toggleSchema),
  extensionController.toggleExtension,
);

router.put(
  "/:slug/settings",
  authenticate,
  writeLimiter,
  validate(settingsSchema),
  extensionController.updateSettings,
);

export default router;
