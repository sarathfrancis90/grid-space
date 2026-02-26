import { Router } from "express";
import { healthCheck, statusCheck } from "../controllers/health.controller";

const router = Router();

router.get("/", healthCheck);
router.get("/status", statusCheck);

export default router;
