import { Request, Response, NextFunction } from "express";
import { logger } from "@myorg/shared";
import { AppError } from "../utils/customError.js";

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  logger.error(
    {
      err,
      path: req.originalUrl,
      method: req.method,
    },
    err.message || "Request failed",
  );

  if (err instanceof AppError) {
    // `err` may be a custom AppError with `statusCode`.
    const status = (err as any).statusCode || 500;
    return res.status(status).json({
      success: false,
      error: err.message,
    });
  }

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};
