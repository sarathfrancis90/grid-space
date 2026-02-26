import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import spreadsheetRoutes from "./spreadsheet.routes";
import sheetRoutes from "./sheet.routes";
import cellRoutes from "./cell.routes";
import docsRoutes from "./docs.routes";

const router = Router();

// Health & status
router.use("/health", healthRoutes);

// API documentation
router.use("/docs", docsRoutes);

// Auth (login, register, refresh, OAuth)
router.use("/auth", authRoutes);

// User profile
router.use("/users", userRoutes);

// Spreadsheets CRUD
router.use("/spreadsheets", spreadsheetRoutes);

// Sheets (nested under spreadsheets)
router.use("/spreadsheets/:id/sheets", sheetRoutes);

// Cells (nested under sheets)
router.use("/spreadsheets/:id/sheets/:sheetId/cells", cellRoutes);

export default router;
