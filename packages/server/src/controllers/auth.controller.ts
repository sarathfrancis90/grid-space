import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import * as authService from "../services/auth.service";
import { apiSuccess } from "../utils/apiResponse";

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth/refresh",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password, name } = req.body;
    const result = await authService.register(email, password, name);

    res.cookie(
      "refreshToken",
      result.tokens.refreshToken,
      REFRESH_COOKIE_OPTIONS,
    );

    res.status(201).json(
      apiSuccess({
        user: result.user,
        accessToken: result.tokens.accessToken,
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.cookie(
      "refreshToken",
      result.tokens.refreshToken,
      REFRESH_COOKIE_OPTIONS,
    );

    res.json(
      apiSuccess({
        user: result.user,
        accessToken: result.tokens.accessToken,
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: 401, message: "Refresh token required" },
      });
      return;
    }

    const result = await authService.refreshTokens(token);

    res.cookie(
      "refreshToken",
      result.tokens.refreshToken,
      REFRESH_COOKIE_OPTIONS,
    );

    res.json(
      apiSuccess({
        user: result.user,
        accessToken: result.tokens.accessToken,
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
  res.json(apiSuccess({ message: "Logged out" }));
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.forgotPassword(req.body.email);
    res.json(
      apiSuccess({ message: "If the email exists, a reset link was sent" }),
    );
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json(apiSuccess({ message: "Password reset successfully" }));
  } catch (err) {
    next(err);
  }
}

export async function verifyEmailToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = Array.isArray(req.params.token)
      ? req.params.token[0]
      : req.params.token;
    await authService.verifyEmail(token);
    res.json(apiSuccess({ message: "Email verified" }));
  } catch (err) {
    next(err);
  }
}

export async function getProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await authService.getProfile(req.user!.id);
    res.json(apiSuccess(user));
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await authService.updateProfile(req.user!.id, req.body);
    res.json(apiSuccess(user));
  } catch (err) {
    next(err);
  }
}

export async function changePassword(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.changePassword(
      req.user!.id,
      req.body.currentPassword,
      req.body.newPassword,
    );
    res.json(apiSuccess({ message: "Password changed" }));
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.deleteAccount(req.user!.id);
    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
    res.json(apiSuccess({ message: "Account deleted" }));
  } catch (err) {
    next(err);
  }
}

// OAuth stubs — route structure ready, actual OAuth requires client IDs
export function oauthGoogleRedirect(_req: Request, res: Response): void {
  // TODO: Sprint 10 — implement with Passport Google Strategy
  res.status(501).json(apiSuccess({ message: "Google OAuth not configured" }));
}

export function oauthGoogleCallback(_req: Request, res: Response): void {
  // TODO: Sprint 10 — handle Google callback, issue JWT, redirect to client
  res.status(501).json(apiSuccess({ message: "Google OAuth not configured" }));
}

export function oauthGithubRedirect(_req: Request, res: Response): void {
  // TODO: Sprint 10 — implement with Passport GitHub Strategy
  res.status(501).json(apiSuccess({ message: "GitHub OAuth not configured" }));
}

export function oauthGithubCallback(_req: Request, res: Response): void {
  // TODO: Sprint 10 — handle GitHub callback, issue JWT, redirect to client
  res.status(501).json(apiSuccess({ message: "GitHub OAuth not configured" }));
}
