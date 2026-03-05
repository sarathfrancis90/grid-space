import type { Request, Response } from "express";
import { readFileSync } from "fs";
import { resolve } from "path";
import { apiSuccess } from "../utils/apiResponse";
import { getHealthStatus } from "../services/health.service";

interface FeatureCount {
  total: number;
  completed: number;
  remaining: number;
  sprints: number;
}

function loadFeatureCount(): FeatureCount {
  try {
    const filePath = resolve(__dirname, "../generated/feature-count.json");
    return JSON.parse(readFileSync(filePath, "utf-8")) as FeatureCount;
  } catch {
    return { total: 427, completed: 0, remaining: 427, sprints: 16 };
  }
}

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
      features: loadFeatureCount(),
    }),
  );
}
