import { Router } from "express";
import { z } from "zod/v4";
import {
  listFolders,
  getFolder,
  createFolder,
  updateFolder,
  deleteFolder,
  moveSpreadsheet,
  getFolderBreadcrumbs,
} from "../controllers/folder.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

// All folder routes require authentication
router.use(authenticate);

const createSchema = {
  body: z.object({
    name: z.string().min(1).max(200),
    color: z.string().max(20).optional(),
    parentId: z.string().optional(),
  }),
};

const updateSchema = {
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    color: z.string().max(20).nullable().optional(),
  }),
};

const moveSchema = {
  body: z.object({
    folderId: z.string().nullable(),
  }),
};

// GET /api/folders — list folders (optionally filtered by parentId)
router.get("/", listFolders);

// GET /api/folders/:id — get single folder
router.get("/:id", getFolder);

// GET /api/folders/:id/breadcrumbs — get breadcrumb path
router.get("/:id/breadcrumbs", getFolderBreadcrumbs);

// POST /api/folders — create new folder
router.post("/", writeLimiter, validate(createSchema), createFolder);

// PUT /api/folders/:id — update folder
router.put("/:id", writeLimiter, validate(updateSchema), updateFolder);

// DELETE /api/folders/:id — delete folder
router.delete("/:id", writeLimiter, deleteFolder);

// POST /api/folders/move-spreadsheet/:spreadsheetId — move spreadsheet to folder
router.post(
  "/move-spreadsheet/:spreadsheetId",
  writeLimiter,
  validate(moveSchema),
  moveSpreadsheet,
);

export default router;
