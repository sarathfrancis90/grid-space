import type { Request, Response } from "express";
import { env } from "../config/env";
import { apiSuccess } from "../utils/apiResponse";
import featureCount from "../generated/feature-count.json";

export function healthCheck(_req: Request, res: Response): void {
  res.json(
    apiSuccess({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: env.COMMIT_SHA,
      environment: env.NODE_ENV,
    }),
  );
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
