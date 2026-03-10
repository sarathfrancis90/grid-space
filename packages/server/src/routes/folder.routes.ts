import { Router } from "express";
import { z } from "zod/v4";
import {
  listFolders,
  getFolder,
  getFolderBreadcrumbs,
  createFolder,
  updateFolder,
  deleteFolder,
  moveSpreadsheet,
  moveFolder,
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
    parentId: z.string().nullable().optional(),
  }),
};

const updateSchema = {
  body: z.object({
    name: z.string().min(1).max(200).optional(),
  }),
};

const moveSpreadsheetSchema = {
  body: z.object({
    spreadsheetId: z.string().min(1),
    folderId: z.string().nullable(),
  }),
};

const moveFolderSchema = {
  body: z.object({
    targetParentId: z.string().nullable(),
  }),
};

// GET /api/folders — list folders (optionally by parentId)
router.get("/", listFolders);

// GET /api/folders/:id — get single folder
router.get("/:id", getFolder);

// GET /api/folders/:id/breadcrumbs — get breadcrumb path
router.get("/:id/breadcrumbs", getFolderBreadcrumbs);

// POST /api/folders — create a folder
router.post("/", writeLimiter, validate(createSchema), createFolder);

// PUT /api/folders/:id — rename a folder
router.put("/:id", writeLimiter, validate(updateSchema), updateFolder);

// DELETE /api/folders/:id — delete a folder
router.delete("/:id", writeLimiter, deleteFolder);

// POST /api/folders/move-spreadsheet — move spreadsheet to folder
router.post(
  "/move-spreadsheet",
  writeLimiter,
  validate(moveSpreadsheetSchema),
  moveSpreadsheet,
);

// POST /api/folders/:id/move — move folder to another parent
router.post("/:id/move", writeLimiter, validate(moveFolderSchema), moveFolder);

export default router;
