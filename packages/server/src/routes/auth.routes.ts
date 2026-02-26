import { Router } from "express";
import { z } from "zod/v4";
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmailToken,
  oauthGoogleRedirect,
  oauthGoogleCallback,
  oauthGithubRedirect,
  oauthGithubCallback,
} from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { authLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

// Rate limit all auth endpoints
router.use(authLimiter);

const registerSchema = {
  body: z.object({
    email: z.email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().min(1).max(100).optional(),
  }),
};

const loginSchema = {
  body: z.object({
    email: z.email(),
    password: z.string().min(1),
  }),
};

const forgotPasswordSchema = {
  body: z.object({
    email: z.email(),
  }),
};

const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(1),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
};

// POST /api/auth/register
router.post("/register", validate(registerSchema), register);

// POST /api/auth/login
router.post("/login", validate(loginSchema), login);

// POST /api/auth/refresh
router.post("/refresh", refresh);

// POST /api/auth/logout
router.post("/logout", logout);

// POST /api/auth/forgot-password
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);

// POST /api/auth/reset-password
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

// GET /api/auth/verify-email/:token
router.get("/verify-email/:token", verifyEmailToken);

// OAuth routes (stubs)
router.get("/oauth/google", oauthGoogleRedirect);
router.get("/oauth/google/callback", oauthGoogleCallback);
router.get("/oauth/github", oauthGithubRedirect);
router.get("/oauth/github/callback", oauthGithubCallback);

export default router;
