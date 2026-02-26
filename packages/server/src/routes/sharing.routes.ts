import { Router } from "express";
import { z } from "zod/v4";
import {
  listCollaborators,
  addCollaborator,
  changeRole,
  removeCollaborator,
  createShareLink,
  getShareLink,
  disableShareLink,
  accessViaShareLink,
  transferOwnership,
  publishToWeb,
  unpublishFromWeb,
  accessPublished,
} from "../controllers/sharing.controller";
import { authenticate, optionalAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";

const router = Router({ mergeParams: true });

// All sharing routes require authentication (except share link access)
router.use(authenticate);

const addCollaboratorSchema = {
  body: z.object({
    email: z.email(),
    role: z.enum(["viewer", "commenter", "editor"]),
  }),
};

const changeRoleSchema = {
  body: z.object({
    role: z.enum(["viewer", "commenter", "editor"]),
  }),
};

const shareLinkSchema = {
  body: z.object({
    role: z.enum(["viewer", "commenter", "editor"]).optional(),
  }),
};

const transferSchema = {
  body: z.object({
    email: z.email(),
  }),
};

// GET /api/spreadsheets/:id/access — list collaborators
router.get("/", listCollaborators);

// POST /api/spreadsheets/:id/access — add collaborator
router.post(
  "/",
  writeLimiter,
  validate(addCollaboratorSchema),
  addCollaborator,
);

// PUT /api/spreadsheets/:id/access/:userId — change role
router.put("/:userId", writeLimiter, validate(changeRoleSchema), changeRole);

// DELETE /api/spreadsheets/:id/access/:userId — remove access
router.delete("/:userId", writeLimiter, removeCollaborator);

// Share link routes — nested under the access router but distinct paths
// These are mounted separately in the index router

export default router;

// ─── Share link + publish routes ─────────────────────────────
export const shareLinkRouter = Router({ mergeParams: true });
shareLinkRouter.use(authenticate);

// GET /api/spreadsheets/:id/share-link
shareLinkRouter.get("/", getShareLink);

// POST /api/spreadsheets/:id/share-link
shareLinkRouter.post(
  "/",
  writeLimiter,
  validate(shareLinkSchema),
  createShareLink,
);

// DELETE /api/spreadsheets/:id/share-link
shareLinkRouter.delete("/", writeLimiter, disableShareLink);

// ─── Transfer ownership ──────────────────────────────────────
export const transferRouter = Router({ mergeParams: true });
transferRouter.use(authenticate);

transferRouter.post(
  "/",
  writeLimiter,
  validate(transferSchema),
  transferOwnership,
);

// ─── Publish to web ──────────────────────────────────────────
export const publishRouter = Router({ mergeParams: true });
publishRouter.use(authenticate);

publishRouter.post("/", writeLimiter, publishToWeb);
publishRouter.delete("/", writeLimiter, unpublishFromWeb);

// ─── Public access routes (no auth required) ─────────────────
export const publicShareRouter = Router();

// GET /api/share/:token — access via share link
publicShareRouter.get("/:token", accessViaShareLink as never);

// GET /api/published/:token — public published spreadsheet
publicShareRouter.get("/:token", accessPublished as never);
