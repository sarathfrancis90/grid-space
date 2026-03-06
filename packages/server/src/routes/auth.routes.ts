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
  oauthProviders,
  oauthGoogleRedirect,
  oauthGoogleCallback,
  oauthGithubRedirect,
  oauthGithubCallback,
} from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import {
  authAttemptLimiter,
  authSessionLimiter,
} from "../middleware/rateLimit.middleware";

const router = Router();

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
router.post(
  "/register",
  authAttemptLimiter,
  validate(registerSchema),
  register,
);

// POST /api/auth/login
router.post("/login", authAttemptLimiter, validate(loginSchema), login);

// POST /api/auth/refresh
router.post("/refresh", authSessionLimiter, refresh);

// POST /api/auth/logout
router.post("/logout", authSessionLimiter, logout);

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  authAttemptLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);

// POST /api/auth/reset-password
router.post(
  "/reset-password",
  authAttemptLimiter,
  validate(resetPasswordSchema),
  resetPassword,
);

// GET /api/auth/verify-email/:token
router.get("/verify-email/:token", authSessionLimiter, verifyEmailToken);

// OAuth provider availability (public, no auth needed)
router.get("/oauth/providers", oauthProviders);

// OAuth routes (stubs)
router.get("/oauth/google", authSessionLimiter, oauthGoogleRedirect);
router.get("/oauth/google/callback", authSessionLimiter, oauthGoogleCallback);
router.get("/oauth/github", authSessionLimiter, oauthGithubRedirect);
router.get("/oauth/github/callback", authSessionLimiter, oauthGithubCallback);

export default router;
