import { Router } from "express";
import { z } from "zod/v4";
import {
  listSpreadsheets,
  getSpreadsheet,
  createSpreadsheet,
  updateSpreadsheet,
  deleteSpreadsheet,
  duplicateSpreadsheet,
  toggleStar,
} from "../controllers/spreadsheet.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

// All spreadsheet routes require authentication
router.use(authenticate);

const createSchema = {
  body: z.object({
    title: z.string().min(1).max(200).optional(),
  }),
};

const updateSchema = {
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    isStarred: z.boolean().optional(),
  }),
};

// GET /api/spreadsheets — list user's spreadsheets
router.get("/", listSpreadsheets);

// GET /api/spreadsheets/:id — get single spreadsheet with sheets
router.get("/:id", getSpreadsheet);

// POST /api/spreadsheets — create new spreadsheet
router.post("/", writeLimiter, validate(createSchema), createSpreadsheet);

// PUT /api/spreadsheets/:id — update spreadsheet metadata
router.put("/:id", writeLimiter, validate(updateSchema), updateSpreadsheet);

// DELETE /api/spreadsheets/:id — delete spreadsheet
router.delete("/:id", writeLimiter, deleteSpreadsheet);

// POST /api/spreadsheets/:id/duplicate — duplicate spreadsheet
router.post("/:id/duplicate", writeLimiter, duplicateSpreadsheet);

// POST /api/spreadsheets/:id/star — toggle star
router.post("/:id/star", writeLimiter, toggleStar);

export default router;
