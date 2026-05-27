import { Request, Response } from 'express';
import * as leaveService from '../services/leaveService.js';

export const getLeaveBalance = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const balance = await leaveService.fetchOrCreateBalance(userId);
    res.json(balance);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const updateLeaveBalance = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { annual, sick } = req.body;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const balance = await leaveService.setBalance(userId, annual, sick);
    res.json(balance);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const createLeave = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { type, startDate, endDate } = req.body;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const leave = await leaveService.createLeaveForUser(userId, type, new Date(startDate), new Date(endDate));
    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getLeavesForUser = async (req: Request, res: Response) => {
  const userId = req.params.userId || (req as any).userId;
  try {
    const leaves = await leaveService.getLeaves(userId);
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
