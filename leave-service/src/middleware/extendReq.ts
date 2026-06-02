import { Request, Response, NextFunction } from "express";
import { UserRole } from "../shared/constants";

export const attachUserContext = (
  req: Request & { userId?: string; role?: UserRole },
  res: Response,
  next: NextFunction
) => {
  req.userId = req.header("x-user-id") || undefined;
  req.role = req.header("x-user-role") as UserRole | undefined;

  next();
};