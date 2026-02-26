import { Router } from "express";
import { getCells, updateCells } from "../controllers/cell.controller";
import { writeLimiter } from "../middleware/rateLimit.middleware";

const router = Router({ mergeParams: true });

// GET /api/spreadsheets/:id/sheets/:sheetId/cells — get cell data
router.get("/", getCells);

// PUT /api/spreadsheets/:id/sheets/:sheetId/cells — update cells
router.put("/", writeLimiter, updateCells);

export default router;
