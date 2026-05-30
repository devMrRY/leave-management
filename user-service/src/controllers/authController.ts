import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { logger } from '../logger';
import { getTraceContext } from '../helpers/tracing';

export const registerController = async (req: Request, res: Response) => {
    const { username, email, password, managerId } = req.body;
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
            username,
            email,
            password: hashedPassword,
            managerId: managerId || null,
            createdBy: null,
            createdOn: Date.now(),
        });
        await user.save();
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
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '5m' }
        );
        // Long-lived refresh token (e.g., 7d)
        const refreshToken = jwt.sign(
            { userId: user._id, email: user.email },
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

export const getEmployeesController = async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const reports = await User.find({ managerId: userId }).lean();
        res.json(reports);
    } catch (err) {
        logger.error(`Error fetching employees: ${(err as Error).message}`);
        res.status(500).json({ error: (err as Error).message });
    }
};

export const refreshTokenController = (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken;
    if (!token) {
        logger.info('Refresh token not provided');
        return res.status(401).json({ error: 'No refresh token provided' });
    }
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string, email: string };
        // Issue new short-lived access token
        const accessToken = jwt.sign(
            { userId: payload.userId, email: payload.email },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '5m' }
        );
        res.json({ accessToken });
    } catch (err: any) {
        logger.error({ error: err?.message }, 'Invalid or expired refresh token');
        res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
};

export const updateUserController = async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { email, managerId } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            logger.info(`Attempt to update non-existent user with email: ${email}`);
            return res.status(404).json({ error: 'User not found' });
        }
        if (managerId) {
            user.managerId = managerId;
        }
        user.updatedOn = Date.now();
        user.updatedBy = userId;

        await user.save();
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        logger.error(`Error updating user: ${(err as Error).message}`);
        res.status(500).json({ error: (err as Error).message });
    }
};
