import { Request, Response } from 'express';
import * as leaveService from '../services/leaveService.js';
import { callService } from '../shared-config/httpClient.js';
import { publishLeaveApproved, publishLeaveCreated, publishLeaveRejected } from '../events/leave.publisher.js';

interface AuthRequest extends Request {
  userId?: string;
  role?: string;
}

/**
 * Get employee's leave balance for all leave types
 */
export const getLeaveBalance = async (req: AuthRequest, res: Response) => {
  const employeeId = req.userId;
  if (!employeeId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const currentYear = new Date().getFullYear();
    const balances = await leaveService.getLeaveBalanceByYear(employeeId, currentYear);
    res.json({ year: currentYear, balances });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

/**
 * Employee applies for leave
 */
export const applyForLeave = async (req: AuthRequest, res: Response) => {
  const employeeId = req.userId;
  if (!employeeId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { type, startDate, endDate, reason } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);
    let userDetails = null;
    try {
      const userResp = await callService('user-service', `/${encodeURIComponent(employeeId)}`, {
        method: 'GET',
        req,
      });
      if (userResp.ok) {
        userDetails = await userResp.json();
      } else {
        console.warn('Failed to fetch user details from user-service', userResp.status);
      }
    } catch (err) {
      console.warn('Error fetching user details from user-service:', (err as Error).message);
    }

    const leave = await leaveService.applyLeave({
      employeeId,
      type,
      startDate: start,
      endDate: end,
      reason,
      reportingManager: userDetails?.managerId,
      email: userDetails?.email,
      name: userDetails?.name
    });

    // trigger notification to manager about new leave request
    await publishLeaveCreated({
      employeeId,
      email: userDetails?.email,
      name: userDetails?.name,
      leaveType: type,
      startDate: start,
      endDate: end,
      managerId: userDetails?.managerId
    });

    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

/**
 * Manager views pending leave requests for their team
 */
export const getPendingLeaveRequests = async (req: AuthRequest, res: Response) => {
  const managerId = req.userId;
  if (!managerId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { status, employeeId, startDate, type, endDate, page = 1, limit = 10 } = req.query as any;
    const filter: any = {
      managerId,
      status,
      employeeId,
      startDate,
      endDate,
      type
    };
    const result = await leaveService.getLeaveRequests(filter, page, limit);

    const employeeIds = Array.from(new Set(result.leaves.map((leave) => String(leave.employeeId))));
    let userDetailsMap = new Map<string, any>();

    if (employeeIds.length > 0) {
      try {
        const resp = await callService('user-service', '/employees', {
          method: 'POST',
          req,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeIds }),
        });

        if (resp.ok) {
          const users = await resp.json();
          userDetailsMap = new Map(users.map((user: any) => [user.employeeId, user]));
        } else {
          console.warn('Failed to fetch employee details from user-service', resp.status);
        }
      } catch (err) {
        console.warn('Error fetching employee details from user-service:', (err as Error).message);
      }
    }

    const leavesWithDetails = result.leaves.map((leave) => {
      const leaveObj = typeof leave.toObject === 'function' ? leave.toObject() : leave;
      return {
        ...leaveObj,
        employeeDetails: userDetailsMap.get(String(leave.employeeId)) || null,
      };
    });

    res.json({ ...result, leaves: leavesWithDetails });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

/**
 * Manager approves pending leave request
 */
export const approveLeave = async (req: AuthRequest, res: Response) => {
  const managerId = req.userId;
  if (!managerId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const leaveId = String(req.params.leaveId);
    const { comment } = req.body;

    const leave = await leaveService.approveLeaveRequest(leaveId, managerId, comment);
    
    // trigger notification to employee about approval
    await publishLeaveApproved({
      employeeId: leave.employeeId,
      email: leave.email,
      name: leave.name,
      leaveType: leave.type,
      startDate: leave.startDate,
      endDate: leave.endDate
    });

    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

/**
 * Manager rejects pending leave request
 */
export const rejectLeave = async (req: AuthRequest, res: Response) => {
  const managerId = req.userId;
  if (!managerId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const leaveId = String(req.params.leaveId);
    const { comment } = req.body;

    const leave = await leaveService.rejectLeaveRequest(leaveId, managerId, comment);
    // trigger notification to employee about rejection
    await publishLeaveRejected({
      employeeId: leave.employeeId,
      email: leave.email,
      name: leave.name,
      leaveType: leave.type,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: comment
    });
    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

/**
 * Employee cancels their pending leave request
 */
export const cancelLeave = async (req: AuthRequest, res: Response) => {
  const employeeId = req.userId;
  if (!employeeId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const leaveId = String(req.params.leaveId);
    const leave = await leaveService.cancelLeaveRequest(leaveId, employeeId);
    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

/**
 * Employee views their leave history with filters
 */
export const getLeaveHistory = async (req: AuthRequest, res: Response) => {
  const employeeId = req.userId;
  if (!employeeId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { status, startDate, endDate, managerId, type, page = 1, limit = 10 } = req.query as any;

    const filter: any = {
      employeeId,
      status,
      startDate,
      endDate,
      managerId,
      type
    };

    const leaves = await leaveService.getLeaveRequests(filter, page, limit);
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
