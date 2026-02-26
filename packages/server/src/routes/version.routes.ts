import { Router } from "express";
import { z } from "zod/v4";
import {
  createVersion,
  listVersions,
  listGroupedVersions,
  getVersion,
  restoreVersion,
  nameVersion,
  diffVersions,
  copyVersionAsSpreadsheet,
} from "../controllers/version.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";

const router = Router({ mergeParams: true });

// All version routes require authentication
router.use(authenticate);

const nameSchema = {
  body: z.object({
    name: z.string().min(1).max(200),
  }),
};

// GET /api/spreadsheets/:id/versions — list versions (paginated)
router.get("/", listVersions);

// GET /api/spreadsheets/:id/versions/grouped — list grouped by period
router.get("/grouped", listGroupedVersions);

// POST /api/spreadsheets/:id/versions — create snapshot
router.post("/", writeLimiter, createVersion);

// GET /api/spreadsheets/:id/versions/:versionId — get single version
router.get("/:versionId", getVersion);

// POST /api/spreadsheets/:id/versions/:versionId/restore — restore version
router.post("/:versionId/restore", writeLimiter, restoreVersion);

// PUT /api/spreadsheets/:id/versions/:versionId/name — name/label a version
router.put("/:versionId/name", writeLimiter, validate(nameSchema), nameVersion);

// GET /api/spreadsheets/:id/versions/:versionId/diff — get visual diff
router.get("/:versionId/diff", diffVersions);

// POST /api/spreadsheets/:id/versions/:versionId/copy — copy as new spreadsheet
router.post("/:versionId/copy", writeLimiter, copyVersionAsSpreadsheet);

export default router;
