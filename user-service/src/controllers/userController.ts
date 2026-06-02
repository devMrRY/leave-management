import { Request, Response } from 'express';
import User from '../models/User';
import { logger } from '../logger';
import { publishManagerUpdated } from '../events/user.publisher';

export const getEmployeeController = async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    let { empId } = req.params;
    if (!empId) {
        empId = userId; // If no empId is provided, fetch the logged-in user's details
    }
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const employee = await User.findOne({ employeeId: empId }).select('-password -_id -__v').lean();
        if (!employee) {
            logger.info(`Employee not found with ID: ${empId}`);
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(employee);
    } catch (err) {
        logger.error(`Error fetching employee: ${(err as Error).message}`);
        res.status(500).json({ error: (err as Error).message });
    }
};

export const updateManagerIdController = async (req: Request, res: Response) => {
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

        await user.save();
        await publishManagerUpdated({ employeeId: user.employeeId, managerId });
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        logger.error(`Error updating user: ${(err as Error).message}`);
        res.status(500).json({ error: (err as Error).message });
    }
};
export const getEmployeesController = async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const employeeIds = req.body.employeeIds;
    const filter = { managerId: userId } as any;
    if (employeeIds) {
        filter['employeeId'] = { $in: employeeIds };
    }

    try {
        const employees = await User.find(filter)
            .select('employeeId managerId username name email role -_id')
            .lean();

        res.json(employees);
    } catch (err) {
        logger.error(`Error fetching employees by ids: ${(err as Error).message}`);
        res.status(500).json({ error: (err as Error).message });
    }
};
export const deleteUserController = async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { empId } = req.params;
    if (!empId) {
        return res.status(400).json({ error: 'Employee ID is required' });
    }
    try {
        const user = await User.findOneAndDelete({ employeeId: empId });
        if (!user) {
            logger.info(`Attempt to delete non-existent user with employee ID: ${empId}`);
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        logger.error(`Error deleting user: ${(err as Error).message}`);
        res.status(500).json({ error: (err as Error).message });
    }
};