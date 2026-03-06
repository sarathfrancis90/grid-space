import type { Request, Response, NextFunction } from "express";
import { apiSuccess } from "../utils/apiResponse";
import { getStats } from "../services/stats.service";

export async function getProjectStats(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const stats = await getStats();
    res.json(apiSuccess(stats));
  } catch (err) {
    next(err);
  }
}
