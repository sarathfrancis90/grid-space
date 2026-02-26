import type { Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import { apiError } from "../utils/apiResponse";

interface ValidationSchemas {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Array<{ field: string; message: string }> = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            field: `body.${issue.path.join(".")}`,
            message: issue.message,
          });
        }
      } else {
        req.body = result.data;
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            field: `params.${issue.path.join(".")}`,
            message: issue.message,
          });
        }
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            field: `query.${issue.path.join(".")}`,
            message: issue.message,
          });
        }
      }
    }

    if (errors.length > 0) {
      res.status(422).json({
        ...apiError(422, "Validation failed"),
        details: errors,
      });
      return;
    }

    next();
  };
}
