import jwt from "jsonwebtoken";
import { UserRole } from "../models/User.js";

const JWT_SECRET: jwt.Secret = (process.env.JWT_SECRET || "secret") as jwt.Secret;

export const signToken = (
  payload: { userId: string; role: UserRole },
  expiresIn: jwt.SignOptions["expiresIn"] = "15m",
) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};

export default { signToken, verifyToken };
