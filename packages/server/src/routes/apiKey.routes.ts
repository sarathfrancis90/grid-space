/**
 * API key management routes — /api/users/me/api-keys
 */
import { Router } from "express";
import { z } from "zod/v4";
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";
import { apiSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import * as apiKeyService from "../services/apiKey.service";

const router = Router();

// All routes require JWT auth
router.use(authenticate);

const createKeySchema = {
  body: z.object({
    name: z.string().min(1).max(100),
    expiresAt: z.string().datetime().optional(),
  }),
};

// GET /api/users/me/api-keys — list user's API keys
router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const keys = await apiKeyService.listApiKeys(req.user.id);
    res.json(apiSuccess(keys));
  } catch (err) {
    next(err);
  }
});

// POST /api/users/me/api-keys — create new API key
router.post(
  "/",
  writeLimiter,
  validate(createKeySchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, "Authentication required");

      const { name, expiresAt } = req.body;
      const result = await apiKeyService.createApiKey(
        req.user.id,
        name,
        expiresAt ? new Date(expiresAt) : undefined,
      );

      res.status(201).json(apiSuccess(result));
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/users/me/api-keys/:keyId — revoke API key
router.delete(
  "/:keyId",
  writeLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, "Authentication required");
      const keyId = req.params.keyId as string;
      await apiKeyService.revokeApiKey(keyId, req.user.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export default router;
