import { Request, Response } from "express";
import { UserRole } from "../models/User.js";
import { signToken, verifyToken } from "../utils/tokenUtils.js";
import { logger } from "@myorg/shared";
import { publishUserCreated } from "../events/user.publisher.js";
import { getUser, createUser, findByEmail } from "../repository/auth.js";
import { hashPassword, comparePassword } from "../utils/authUtils.js";

export const registerController = async (req: Request, res: Response) => {
  const { username, email, password, managerId, role, name } = req.body;
  // Check for existing user
  const existingUser = await getUser({ email, username });
  if (existingUser) {
    logger.info(
      { email, username },
      `Attempt to register existing user with email`,
    );
    return res.status(409).json({ error: "Email or username already exists." });
  }
  const hashedPassword = await hashPassword(password);
  const user = await createUser({
    username,
    email,
    role,
    password: hashedPassword,
    managerId,
    name,
  });

  await publishUserCreated({
    employeeId: user.employeeId,
    email: user.email,
    role: user.role,
    name: user.name,
  });
  logger.info({ email }, `User registered successfully`);
  res.status(201).json({ message: "User registered successfully" });
};

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await findByEmail(email);
  if (!user) {
    logger.info({ email }, `Login attempt with non-existent email`);
    return res.status(401).json({ error: "No user found with that email" });
  }
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    logger.info({ email }, `Login attempt with invalid password`);
    return res.status(401).json({ error: "Invalid password" });
  }
  // Short-lived access token (e.g., 15m)
  const accessToken = signToken({ userId: user.employeeId, role: user.role as UserRole }, "15m");
  // Long-lived refresh token (e.g., 7d)
  const refreshToken = signToken({ userId: user.employeeId, role: user.role as UserRole }, "7d");
  // Store refresh token in HTTP-only cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  res.json({ accessToken });
};

export const refreshTokenController = (req: Request, res: Response) => {
  const cookieHeader = req.headers.cookie;
  let token;

  if (cookieHeader) {
    const refreshTokenMatch = cookieHeader.match(/refreshToken=([^;]+)/);
    token = refreshTokenMatch ? refreshTokenMatch[1] : undefined;
  }

  if (!token) {
    logger.info("Refresh token not provided");
    return res.status(401).json({ error: "No refresh token provided" });
  }
  const payload = verifyToken(token) as {
    userId: string;
    role: UserRole;
  };
  // Issue new short-lived access token
  const accessToken = signToken({ userId: payload.userId, role: payload.role }, "15m");
  res.json({ accessToken });
};
