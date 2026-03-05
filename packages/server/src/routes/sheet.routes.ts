import { Router } from "express";
import { z } from "zod/v4";
import {
  listSheets,
  getSheet,
  createSheet,
  updateSheet,
  deleteSheet,
  saveSheetData,
} from "../controllers/sheet.controller";
import { authenticate } from "../middleware/auth.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";
import { validate } from "../middleware/validate.middleware";

const router = Router({ mergeParams: true });

// All sheet routes require authentication
router.use(authenticate);

const createSheetSchema = {
  body: z.object({
    name: z.string().max(100).optional(),
    color: z.string().max(20).optional(),
  }),
};

const updateSheetSchema = {
  body: z.object({
    name: z.string().max(100).optional(),
    color: z.string().max(20).nullable().optional(),
    isHidden: z.boolean().optional(),
    frozenRows: z.number().int().min(0).optional(),
    frozenCols: z.number().int().min(0).optional(),
  }),
};

const saveSheetDataSchema = {
  body: z.object({
    cellData: z.record(z.string(), z.unknown()),
    columnMeta: z.record(z.string(), z.unknown()).optional(),
    rowMeta: z.record(z.string(), z.unknown()).optional(),
  }),
};

// GET /api/spreadsheets/:id/sheets — list sheets in a spreadsheet
router.get("/", listSheets);

// GET /api/spreadsheets/:id/sheets/:sheetId — get a single sheet
router.get("/:sheetId", getSheet);

// POST /api/spreadsheets/:id/sheets — create new sheet
router.post("/", writeLimiter, validate(createSheetSchema), createSheet);

// PUT /api/spreadsheets/:id/sheets/:sheetId — update sheet
router.put("/:sheetId", writeLimiter, validate(updateSheetSchema), updateSheet);

// PUT /api/spreadsheets/:id/sheets/:sheetId/save — auto-save sheet data
router.put(
  "/:sheetId/save",
  writeLimiter,
  validate(saveSheetDataSchema),
  saveSheetData,
);

// DELETE /api/spreadsheets/:id/sheets/:sheetId — delete sheet
router.delete("/:sheetId", writeLimiter, deleteSheet);

export default router;
