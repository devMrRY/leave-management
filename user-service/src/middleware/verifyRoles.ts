import { Request, Response, NextFunction } from "express";
import { UserRole } from "../models/User";

export const authorizeRoles = (allowedRoles: UserRole[]) => {
    return (req: Request & { userId: string; role: UserRole }, res: Response, next: NextFunction) => {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!allowedRoles.includes(req.role)) {
            return res.status(403).json({ message: "Forbidden: insufficient role" });
        }

        next();
    };
};