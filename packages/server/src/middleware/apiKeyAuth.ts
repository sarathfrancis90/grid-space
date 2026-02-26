/**
 * API key authentication middleware.
 * Reads X-API-Key header, validates the key, and attaches user to request.
 */
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { validateApiKey } from "../services/apiKey.service";
import { AppError } from "../utils/AppError";
import prisma from "../models/prisma";

export async function apiKeyAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey || typeof apiKey !== "string") {
      throw new AppError(401, "API key required (X-API-Key header)");
    }

    const result = await validateApiKey(apiKey);

    if (!result) {
      throw new AppError(401, "Invalid or expired API key");
    }

    const user = await prisma.user.findUnique({
      where: { id: result.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw new AppError(401, "API key owner not found");
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
