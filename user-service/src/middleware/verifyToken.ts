import { Request, Response, NextFunction } from 'express';
import { verifyToken as jwtVerify } from '../utils/tokenUtils';
interface JwtPayload { userId: string; role: string }

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  console.log("Verifying token for request:", req.headers["internal-api-key"], process.env.INTERNAL_API_KEY);

  if (req.headers["internal-api-key"] === process.env.INTERNAL_API_KEY) {
    const userId = req.headers["x-user-id"] as string;
    const role = req.headers["x-user-role"] as string;
    if (!userId || !role) {
      return res.status(401).json({ error: "Missing internal user context" });
    }
    (req as any).userId = userId;
    (req as any).role = role;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwtVerify(token) as JwtPayload;
    (req as any).userId = payload.userId;
    (req as any).role = payload.role;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
