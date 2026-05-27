import Leave from '../models/Leave.js';
import LeaveBalance from '../models/LeaveBalance.js';
import mongoose from 'mongoose';

export async function fetchOrCreateBalance(userId: string | mongoose.Types.ObjectId) {
  let balance = await LeaveBalance.findOne({ userId });
  if (!balance) {
    balance = new LeaveBalance({ userId, annual: 0, sick: 0 });
    await balance.save();
  }
  return balance;
}

export async function setBalance(userId: string | mongoose.Types.ObjectId, annual: number, sick: number) {
  const balance = await LeaveBalance.findOneAndUpdate(
    { userId },
    { $set: { annual, sick } },
    { new: true, upsert: true }
  );
  return balance;
}

export async function createLeaveForUser(userId: string | mongoose.Types.ObjectId, type: string, startDate: Date, endDate: Date) {
  const leave = new Leave({ userId, type, startDate, endDate });
  await leave.save();
  return leave;
}

export async function getLeaves(userId: string | mongoose.Types.ObjectId) {
  return Leave.find({ userId });
}
