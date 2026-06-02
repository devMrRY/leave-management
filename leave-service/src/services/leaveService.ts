import Leave, { ILeave } from '../models/Leave.js';
import LeaveBalance, { ILeaveBalance } from '../models/LeaveBalance.js';
import { DefaultLeaveAllocation, LeaveStatus, LeaveType } from '../models/constants.js';
import { calculateWorkingDays } from '../utils/dateUtils.js';

/**
 * Get or create leave balance for an employee for a specific year
 */
export async function getLeaveBalanceByYear(
  employeeId: string,
  year: number
): Promise<any[]> {
  let balances = await LeaveBalance.find({ employeeId, year });

  // If no balances exist, create default ones for all leave types
  if (balances.length === 0) {
    const leaveTypes = Object.values(LeaveType);
    const defaultAllocation = (type: LeaveType) =>
      DefaultLeaveAllocation[type as keyof typeof DefaultLeaveAllocation] ?? 0;

    const newBalances = leaveTypes.map(type => ({
      employeeId,
      year,
      leaveType: type,
      allocated: defaultAllocation(type),
      carriedForward: 0,
      used: 0,
    }));

    balances = await LeaveBalance.insertMany(newBalances);
  }

  // Convert to objects with virtuals included
  return balances.map(balance => balance.toObject({ virtuals: true }));
}

/**
 * Apply for leave
 */
export async function applyLeave(data: {
  employeeId: string;
  email?: string;
  name?: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  reportingManager?: string;
}): Promise<any> {
  // Check for overlapping leave requests
  const overlapping = await Leave.findOne({
    employeeId: data.employeeId,
    status: { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
    $or: [
      { startDate: { $lte: data.endDate }, endDate: { $gte: data.startDate } },
    ],
  });

  if (overlapping) {
    throw new Error('Leave request overlaps with an existing request');
  }

  // Calculate working days (excluding weekends)
  const { workingDays, weekendDays, skippedDates } = calculateWorkingDays(
    data.startDate,
    data.endDate
  );

  if (workingDays === 0) {
    throw new Error('Leave period contains only weekends. Please select different dates.');
  }

  // Check leave balance
  const currentYear = new Date().getFullYear();
  const balance = await LeaveBalance.findOne({
    employeeId: data.employeeId,
    year: currentYear,
    leaveType: data.type,
  });

  // Calculate remaining leaves (allocated + carriedForward - used)
  const remainingDays = balance
    ? balance.allocated + balance.carriedForward - balance.used
    : 0;

  if (!balance || remainingDays < workingDays) {
    throw new Error(
      `Insufficient leave balance. Required: ${workingDays} days, Available: ${remainingDays} days`
    );
  }

  // Create leave request
  const leave = new Leave({
    ...data,
    numberOfDays: workingDays,
    status: LeaveStatus.PENDING,
  });

  const savedLeave = await leave.save();

  // Return response with weekend info
  return Object.assign(savedLeave.toObject(), {
    weekendInfo: {
      hasWeekends: weekendDays > 0,
      weekendDaysCount: weekendDays,
      skippedDates: skippedDates,
      workingDaysApprovalCount: workingDays,
    },
  });
}

/**
 * Get leave requests with pagination and filtering
 */
export async function getLeaveRequests(
  filter: any,
  page: number = 1,
  limit: number = 10
): Promise<{ leaves: ILeave[]; total: number; page: number; limit: number }> {
  const skip = (page - 1) * limit;
  const { managerId, status, employeeId, startDate, endDate, type } = filter;
  const query: any = {};
  if (managerId) query.reportingManager = managerId;
  if (status) query.status = status;
  if (employeeId) query.employeeId = employeeId;
  if (type) query.type = type;
  if (startDate || endDate) {
    query.$and = [];
    if (startDate) query.$and.push({ startDate: { $gte: new Date(startDate) } });
    if (endDate) query.$and.push({ endDate: { $lte: new Date(endDate) } });
  }
  const [leaves, total] = await Promise.all([
    Leave.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Leave.countDocuments(query),
  ]);

  return { leaves, total, page, limit };
}

/**
 * Approve leave request
 */
export async function approveLeaveRequest(
  leaveId: string,
  managerId: string,
  comment?: string
): Promise<ILeave> {
  const leave = await Leave.findById(leaveId);
  if (!leave) {
    throw new Error('Leave request not found');
  }

  if (leave.status !== LeaveStatus.PENDING) {
    throw new Error('Only pending leave requests can be approved');
  }

  if (leave.reportingManager && leave.reportingManager !== managerId) {
    throw new Error('Unauthorized: You are not the reporting manager');
  }

  // Deduct from leave balance
  const currentYear = new Date().getFullYear();
  await LeaveBalance.findOneAndUpdate(
    {
      employeeId: leave.employeeId,
      year: currentYear,
      leaveType: leave.type,
    },
    {
      $inc: { used: leave.numberOfDays },
    },
    { new: true }
  );

  // Update leave status
  leave.status = LeaveStatus.APPROVED;
  leave.reviewedAt = new Date();
  if (comment) leave.reviewComment = comment;
  await leave.save();

  return leave;
}

/**
 * Reject leave request
 */
export async function rejectLeaveRequest(
  leaveId: string,
  managerId: string,
  comment: string
): Promise<ILeave> {
  const leave = await Leave.findById(leaveId);
  if (!leave) {
    throw new Error('Leave request not found');
  }

  if (leave.status !== LeaveStatus.PENDING) {
    throw new Error('Only pending leave requests can be rejected');
  }

  if (leave.reportingManager && leave.reportingManager !== managerId) {
    throw new Error('Unauthorized: You are not the reporting manager');
  }

  leave.status = LeaveStatus.REJECTED;
  leave.reviewedAt = new Date();
  leave.reviewComment = comment;
  await leave.save();

  return leave;
}

export async function cancelLeaveRequest(
  leaveId: string,
  employeeId: string
): Promise<ILeave> {
  const leave = await Leave.findById(leaveId);
  if (!leave) {
    throw new Error('Leave request not found');
  }

  if (leave.employeeId !== employeeId) {
    throw new Error('Unauthorized: You can only cancel your own leave requests');
  }

  if (leave.status !== LeaveStatus.PENDING) {
    throw new Error('Only pending leave requests can be cancelled');
  }

  leave.status = LeaveStatus.CANCELLED;
  leave.reviewedAt = new Date();
  leave.reviewComment = 'Cancelled by employee';
  await leave.save();

  return leave;
}

export async function setDefaultLeaveAllocation(employeeId: string, year: number): Promise<ILeaveBalance[]> {
  let balances = await LeaveBalance.find({ employeeId });

  // If no balances exist, create default ones for all leave types
  if (balances.length === 0) {
    const leaveTypes = Object.values(LeaveType);
    const defaultAllocation = (type: LeaveType) =>
      DefaultLeaveAllocation[type as keyof typeof DefaultLeaveAllocation] ?? 0;

    const newBalances = leaveTypes.map(type => ({
      employeeId,
      year,
      leaveType: type,
      allocated: defaultAllocation(type),
      carriedForward: 0,
      used: 0,
    }));

    balances = await LeaveBalance.insertMany(newBalances);
  }
  return balances;
}

export async function updateManagerInLeaves(employeeId: string, managerId: string): Promise<void> {
  await Leave.updateMany({ employeeId, status: LeaveStatus.PENDING }, { reportingManager: managerId });
}