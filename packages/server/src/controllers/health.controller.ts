import type { Request, Response } from "express";
import { env } from "../config/env";
import { apiSuccess } from "../utils/apiResponse";
import featureCount from "../generated/feature-count.json";
import prisma from "../models/prisma";

const startTime = Date.now();

export async function healthCheck(_req: Request, res: Response): Promise<void> {
  let databaseStatus: "connected" | "disconnected" = "disconnected";

  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseStatus = "connected";
  } catch {
    // database is unreachable
  }

  const isHealthy = databaseStatus === "connected";
  const status = isHealthy ? "ok" : "error";
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  const payload = apiSuccess({
    status,
    uptime: uptimeSeconds,
    timestamp: new Date().toISOString(),
    database: databaseStatus,
    version: env.COMMIT_SHA,
    environment: env.NODE_ENV,
  });

  res.status(isHealthy ? 200 : 503).json(payload);
}

export function statusCheck(_req: Request, res: Response): void {
  res.json(
    apiSuccess({
      app: "GridSpace",
      version: "0.1.0",
      features: featureCount,
    }),
  );
}
