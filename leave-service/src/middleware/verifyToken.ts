import { Request, Response, NextFunction } from "express";
import { verifyToken as jwtVerify } from "../utils/tokenUtils.js";
import { requestContext } from "../utils/request-context";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      role?: string;
    }
  }
}

interface JwtPayload {
  userId: string;
  role: string;
}

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  if (req.headers["internal-api-key"] === process.env.INTERNAL_API_KEY) {
    const userId = req.headers["x-user-id"] as string;
    const role = req.headers["x-user-role"] as string;
    if (!userId || !role) {
      return res.status(401).json({ error: "Missing internal user context" });
    }
    (req as any).userId = userId;
    (req as any).role = role;
    return requestContext.run(
      {
        userId: userId,
        role: role,
        authorization: req.headers.authorization,
      },
      () => next(),
    );
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwtVerify(token) as JwtPayload;
    (req as any).userId = payload.userId;
    (req as any).role = payload.role;
    requestContext.run(
      {
        userId: payload.userId,
        role: payload.role,
        authorization: req.headers.authorization,
      },
      () => next(),
    );
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
