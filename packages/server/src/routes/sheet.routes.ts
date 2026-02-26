import { Router } from "express";
import {
  listSheets,
  getSheet,
  createSheet,
  updateSheet,
  deleteSheet,
} from "../controllers/sheet.controller";
import { writeLimiter } from "../middleware/rateLimit.middleware";

const router = Router({ mergeParams: true });

// GET /api/spreadsheets/:id/sheets — list sheets in a spreadsheet
router.get("/", listSheets);

// GET /api/spreadsheets/:id/sheets/:sheetId — get a single sheet
router.get("/:sheetId", getSheet);

// POST /api/spreadsheets/:id/sheets — create new sheet
router.post("/", writeLimiter, createSheet);

// PUT /api/spreadsheets/:id/sheets/:sheetId — update sheet
router.put("/:sheetId", writeLimiter, updateSheet);

// DELETE /api/spreadsheets/:id/sheets/:sheetId — delete sheet
router.delete("/:sheetId", writeLimiter, deleteSheet);

export default router;
