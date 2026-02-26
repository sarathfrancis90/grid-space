import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import spreadsheetRoutes from "./spreadsheet.routes";
import sheetRoutes from "./sheet.routes";
import cellRoutes from "./cell.routes";
import docsRoutes from "./docs.routes";
import sharingRoutes, {
  shareLinkRouter,
  transferRouter,
  publishRouter,
  publicShareRouter,
} from "./sharing.routes";

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

// Sharing — collaborator access management
router.use("/spreadsheets/:id/access", sharingRoutes);

// Share link management
router.use("/spreadsheets/:id/share-link", shareLinkRouter);

// Transfer ownership
router.use("/spreadsheets/:id/transfer-ownership", transferRouter);

// Publish to web
router.use("/spreadsheets/:id/publish", publishRouter);

// Public access — share link (no auth required)
router.use("/share", publicShareRouter);

// Public access — published spreadsheets (no auth required)
router.use("/published", publicShareRouter);

export default router;
