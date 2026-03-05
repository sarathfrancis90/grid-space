import type { Request, Response } from "express";
import { apiSuccess } from "../utils/apiResponse";
import { getHealthStatus } from "../services/health.service";
import featureCount from "../generated/feature-count.json";

export function healthCheck(_req: Request, res: Response): void {
  const health = getHealthStatus();
  const statusCode = health.status === "ok" ? 200 : 503;
  res.status(statusCode).json(apiSuccess(health));
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
