import { Router } from "express";
import { z } from "zod/v4";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";
import * as extensionController from "../controllers/extension.controller";

const router = Router();

router.use(authenticate);

const installSchema = {
  body: z.object({
    manifest: z.object({
      id: z.string().min(1).max(200),
      name: z.string().min(1).max(200),
      version: z.string().min(1).max(50),
      description: z.string().max(2000),
      author: z.object({
        name: z.string().min(1).max(200),
        email: z.string().email().optional(),
        url: z.string().max(500).optional(),
      }),
      permissions: z.array(z.string()),
      entryPoint: z.string().min(1).max(500),
      minAppVersion: z.string().max(50).optional(),
      icon: z.string().max(500).optional(),
      menuItems: z
        .array(
          z.object({
            label: z.string().min(1).max(100),
            handler: z.string().min(1).max(200),
            menu: z.enum(["extensions", "tools", "data"]),
          }),
        )
        .optional(),
      csp: z.string().max(1000).optional(),
      homepage: z.string().max(500).optional(),
    }),
    grantedPermissions: z.array(z.string()),
  }),
};

const updateStatusSchema = {
  body: z.object({
    status: z.enum(["installed", "active", "disabled", "error"]),
    errorMessage: z.string().max(1000).optional(),
  }),
};

const updatePermissionsSchema = {
  body: z.object({
    grantedPermissions: z.array(z.string()),
  }),
};

const updateStorageSchema = {
  body: z.object({
    key: z.string().min(1).max(200),
    value: z.string().max(10000).nullable(),
  }),
};

// GET /api/extensions — list installed extensions
router.get("/", extensionController.listExtensions);

// GET /api/extensions/:id — get a single extension
router.get("/:id", extensionController.getExtension);

// POST /api/extensions — install an extension
router.post(
  "/",
  writeLimiter,
  validate(installSchema),
  extensionController.installExtension,
);

// DELETE /api/extensions/:id — uninstall an extension
router.delete("/:id", writeLimiter, extensionController.uninstallExtension);

// PATCH /api/extensions/:id/status — update status
router.patch(
  "/:id/status",
  writeLimiter,
  validate(updateStatusSchema),
  extensionController.updateStatus,
);

// PATCH /api/extensions/:id/permissions — update granted permissions
router.patch(
  "/:id/permissions",
  writeLimiter,
  validate(updatePermissionsSchema),
  extensionController.updatePermissions,
);

// POST /api/extensions/:id/storage — update local storage
router.post(
  "/:id/storage",
  writeLimiter,
  validate(updateStorageSchema),
  extensionController.updateStorage,
);

export default router;
