import { Router } from "express";
import { getProjectStats } from "../controllers/stats.controller";

const router = Router();

// GET /api/stats — public, no auth required
router.get("/", getProjectStats);

export default router;
