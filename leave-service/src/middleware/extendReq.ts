import { Request, Response, NextFunction } from "express";
import { UserRole } from "../shared/constants";
import { requestContext } from "../utils/request-context";

export const attachUserContext = (
  req: Request & { userId?: string; role?: UserRole },
  _res: Response,
  next: NextFunction
) => {
  req.userId = req.header("x-user-id");
  req.role = req.header("x-user-role") as UserRole | undefined;

  requestContext.run(
    {
      userId: req.userId,
      role: req.role,
      authorization: req.headers.authorization,
    },
    () => next()
  );
};