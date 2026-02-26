/**
 * Public API routes — /api/v1/ endpoints with API key auth.
 * Rate limited to 60 requests/minute per key.
 */
import { Router } from "express";
import { z } from "zod/v4";
import rateLimit from "express-rate-limit";
import { apiKeyAuth } from "../middleware/apiKeyAuth";
import { validate } from "../middleware/validate.middleware";
import * as publicApi from "../controllers/publicApi.controller";

const router = Router();

const isTest = process.env.NODE_ENV === "test";

/** API key rate limit: 60 requests per minute */
const apiKeyLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: isTest ? 10000 : 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 429,
      message: "API rate limit exceeded (60 requests/minute)",
    },
  },
});

// All routes require API key auth + rate limiting
router.use(apiKeyAuth);
router.use(apiKeyLimiter);

// GET /api/v1/spreadsheets/:id — read spreadsheet
router.get("/spreadsheets/:id", publicApi.getSpreadsheet);

// GET /api/v1/spreadsheets/:id/sheets — list sheets
router.get("/spreadsheets/:id/sheets", publicApi.listSheets);

// GET /api/v1/spreadsheets/:id/sheets/:sheetId/cells — read cells
router.get("/spreadsheets/:id/sheets/:sheetId/cells", publicApi.getCells);

// PUT /api/v1/spreadsheets/:id/sheets/:sheetId/cells — write cells
const updateCellsSchema = {
  body: z.object({
    cells: z.array(
      z.object({
        cell: z.string().min(1).max(10),
        value: z.unknown(),
      }),
    ),
  }),
};

router.put(
  "/spreadsheets/:id/sheets/:sheetId/cells",
  validate(updateCellsSchema),
  publicApi.updateCells,
);

// GET /api/v1/spreadsheets/:id/export/:format — export
router.get("/spreadsheets/:id/export/:format", publicApi.exportSpreadsheet);

export default router;
