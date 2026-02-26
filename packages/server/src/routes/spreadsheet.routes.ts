import { Router } from "express";
import {
  listSpreadsheets,
  getSpreadsheet,
  createSpreadsheet,
  updateSpreadsheet,
  deleteSpreadsheet,
} from "../controllers/spreadsheet.controller";
import { writeLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

// GET /api/spreadsheets — list user's spreadsheets
router.get("/", listSpreadsheets);

// GET /api/spreadsheets/:id — get single spreadsheet
router.get("/:id", getSpreadsheet);

// POST /api/spreadsheets — create new spreadsheet
router.post("/", writeLimiter, createSpreadsheet);

// PUT /api/spreadsheets/:id — update spreadsheet
router.put("/:id", writeLimiter, updateSpreadsheet);

// DELETE /api/spreadsheets/:id — delete spreadsheet
router.delete("/:id", writeLimiter, deleteSpreadsheet);

export default router;
