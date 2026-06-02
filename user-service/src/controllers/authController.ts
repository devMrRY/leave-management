import { Request, Response } from 'express';
import { randomUUID } from "crypto";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User, { UserRole } from '../models/User';
import { logger } from '../logger';
import { getTraceContext } from '../helpers/tracing';
import { publishUserCreated } from '../events/user.publisher';

export const registerController = async (req: Request, res: Response) => {
    const { username, email, password, managerId, role, name } = req.body;
    try {
        // Check for existing user
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            logger.info({ email, ...getTraceContext(), }, `Attempt to register existing user with email: ${email}`);
            return res.status(409).json({ error: 'Email or username already exists.' });
        }
        // Use salt and pepper for hashing
        const saltRounds = 10;
        const pepper = process.env.PEPPER || '';
        const saltedPassword = password + pepper;
        const hashedPassword = await bcrypt.hash(saltedPassword, saltRounds);
        const user = new User({
            employeeId: randomUUID(),
            username,
            email,
            role,
            password: hashedPassword,
            managerId: managerId || null,
            name,
        });
        await user.save();
        await publishUserCreated({
            employeeId: user.employeeId,
            email: user.email,
            role: user.role,
            name: user.name,
        });
        logger.info(`User registered successfully: ${email}`);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        logger.error(`Error registering user: ${(err as Error).message}`);
        res.status(500).json({ error: (err as Error).message });
    }
};

export const loginController = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).lean();
        if (!user) {
            logger.info({ email, ...getTraceContext(), }, `Login attempt with non-existent email: ${email}`);
            return res.status(401).json({ error: 'Invalid email' });
        }
        // Use pepper for password comparison
        const pepper = process.env.PEPPER || '';
        const saltedPassword = password + pepper;
        const isMatch = await bcrypt.compare(saltedPassword, user.password);
        if (!isMatch) {
            logger.info(`Login attempt with invalid password for email: ${email}`);
            return res.status(401).json({ error: 'Invalid password' });
        }
        // Short-lived access token (e.g., 5m)
        const accessToken = jwt.sign(
            { userId: user.employeeId, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '5m' }
        );
        // Long-lived refresh token (e.g., 7d)
        const refreshToken = jwt.sign(
            { userId: user.employeeId, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );
        // Store refresh token in HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        res.json({ accessToken });
    } catch (err) {
        logger.error(`Error during login: ${(err as Error).message}`);
        res.status(500).json({ error: (err as Error).message });
    }
};

export const refreshTokenController = (req: Request, res: Response) => {
    const cookieHeader = req.headers.cookie;
    let token;

    if (cookieHeader) {
        const refreshTokenMatch = cookieHeader.match(/refreshToken=([^;]+)/);
        token = refreshTokenMatch ? refreshTokenMatch[1] : undefined;
    }

    if (!token) {
        logger.info('Refresh token not provided');
        return res.status(401).json({ error: 'No refresh token provided' });
    }
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string, role: UserRole };
        // Issue new short-lived access token
        const accessToken = jwt.sign(
            { userId: payload.userId, role: payload.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '5m' }
        );
        res.json({ accessToken });
    } catch (err: any) {
        logger.error({ error: err?.message }, 'Invalid or expired refresh token');
        res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
};