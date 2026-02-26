import type { Request, Response, NextFunction } from "express";
import passport from "passport";
import type { AuthRequest } from "../types/index";
import * as authService from "../services/auth.service";
import { apiSuccess, apiError } from "../utils/apiResponse";
import { env } from "../config/env";

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
      res.status(401).json(apiError(401, "Refresh token required"));
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

interface OAuthResult {
  user: { id: string };
  tokens: { accessToken: string; refreshToken: string };
}

export function oauthGoogleRedirect(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!env.GOOGLE_CLIENT_ID) {
    res.status(501).json(apiError(501, "Google OAuth not configured"));
    return;
  }
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })(req, res, next);
}

export function oauthGoogleCallback(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  passport.authenticate(
    "google",
    { session: false },
    (err: Error | null, result: OAuthResult | false) => {
      if (err || !result) {
        return res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
      }
      res.cookie("refreshToken", result.tokens.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/api/auth/refresh",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.redirect(
        `${env.CLIENT_URL}/auth/callback?token=${result.tokens.accessToken}`,
      );
    },
  )(req, res, next);
}

export function oauthGithubRedirect(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!env.GITHUB_CLIENT_ID) {
    res.status(501).json(apiError(501, "GitHub OAuth not configured"));
    return;
  }
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
  })(req, res, next);
}

export function oauthGithubCallback(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  passport.authenticate(
    "github",
    { session: false },
    (err: Error | null, result: OAuthResult | false) => {
      if (err || !result) {
        return res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
      }
      res.cookie("refreshToken", result.tokens.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/api/auth/refresh",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.redirect(
        `${env.CLIENT_URL}/auth/callback?token=${result.tokens.accessToken}`,
      );
    },
  )(req, res, next);
}
