import { Router } from "express";
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

const router = Router({ mergeParams: true });

// All sheet routes require authentication
router.use(authenticate);

// GET /api/spreadsheets/:id/sheets — list sheets in a spreadsheet
router.get("/", listSheets);

// GET /api/spreadsheets/:id/sheets/:sheetId — get a single sheet
router.get("/:sheetId", getSheet);

// POST /api/spreadsheets/:id/sheets — create new sheet
router.post("/", writeLimiter, createSheet);

// PUT /api/spreadsheets/:id/sheets/:sheetId — update sheet
router.put("/:sheetId", writeLimiter, updateSheet);

// PUT /api/spreadsheets/:id/sheets/:sheetId/save — auto-save sheet data
router.put("/:sheetId/save", writeLimiter, saveSheetData);

// DELETE /api/spreadsheets/:id/sheets/:sheetId — delete sheet
router.delete("/:sheetId", writeLimiter, deleteSheet);

export default router;
