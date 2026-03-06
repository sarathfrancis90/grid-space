import type { Request, Response, NextFunction } from "express";
import { fetchUrl } from "../services/proxy.service";
import { apiSuccess } from "../utils/apiResponse";

export async function proxyFetch(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { url } = req.body as { url: string };
    const result = await fetchUrl(url);
    res.json(apiSuccess(result));
  } catch (error) {
    next(error);
  }
}
