import { Request, Response } from "express";
import { logger } from "@myorg/shared";
import { publishManagerUpdated } from "../events/user.publisher.js";
import {
  findByEmployeeId,
  updateByEmail,
  deleteByEmployeeId,
  getTeamList,
} from "../repository/auth.js";

export const getEmployeeController = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const employee = await findByEmployeeId(userId);
  if (!employee) {
    logger.info({ userId }, "Employee not found");
    return res.status(404).json({ error: "Employee not found" });
  }
  res.json(employee);
};

export const updateManagerIdController = async (
  req: Request,
  res: Response,
) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { email, managerId } = req.body;
  const user = await updateByEmail({
    email,
    managerId: userId,
    newManagerId: managerId,
  });
  if (!user) {
    logger.info(
      { email },
      "Attempt to update either non-existent user or user outside your team",
    );
    return res.status(404).json({ error: "User not found" });
  }
  await publishManagerUpdated({ employeeId: user.employeeId, managerId });
  res.json({ message: "User updated successfully" });
};

export const getEmployeesController = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { employeeIds = [] } = req.body;
  const employees = await getTeamList(userId, employeeIds);
  if (employees.length === 0) {
    logger.info(
      { userId, employeeIds },
      "No employees found for the given IDs under this manager",
    );
    return res.status(200).json({ employees: [], message: "No employees found" });
  }
  res.json({
    employees: employees.map((e: any) => ({
      employeeId: e.employeeId,
      managerId: e.managerId,
      username: e.username,
      name: e.name,
      email: e.email,
      role: e.role,
    })),
  });
};

export const deleteUserController = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { empId } = req.params;
  if (!empId) {
    return res.status(400).json({ error: "Employee ID is required" });
  }
  const resp = await deleteByEmployeeId(empId as string, userId);
  if (!resp) {
    logger.info(
      { empId },
      "Attempt to delete either non-existent user or user outside your team",
    );
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ message: "User deleted successfully" });
};
