import { Router } from "express";
import { z } from "zod/v4";
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

// All user routes require authentication
router.use(authenticate);

const updateProfileSchema = {
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    avatarUrl: z.url().optional(),
  }),
};

const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
  }),
};

// GET /api/users/me
router.get("/me", getProfile);

// PUT /api/users/me
router.put("/me", writeLimiter, validate(updateProfileSchema), updateProfile);

// PUT /api/users/me/password
router.put(
  "/me/password",
  writeLimiter,
  validate(changePasswordSchema),
  changePassword,
);

// DELETE /api/users/me
router.delete("/me", writeLimiter, deleteAccount);

export default router;
