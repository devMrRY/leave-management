import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload { userId: string; role: string }

export function verifyJwtGateway(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || req.cookies?.token;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
    (req as any).user = {
      userId: payload.userId,
      role: payload.role
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token or expired token' });
  }
}
