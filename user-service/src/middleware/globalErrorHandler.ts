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
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};
