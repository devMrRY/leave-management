import express, { RequestHandler } from "express";
import { validateBody } from "../middleware/validateBody.js";
import {
  getEmployeesByIdsSchema,
  updateManagerIdSchema,
} from "../schemas/userSchemas.js";
import {
  getEmployeeController,
  updateManagerIdController,
  deleteUserController,
  getEmployeesController,
} from "../controllers/userController.js";
import { authorizeRoles } from "../middleware/verifyRoles.js";
import { UserRole } from "../models/User.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// GET /employees - returns employees reporting to the manager
router.post(
  "/employees",
  verifyToken,
  authorizeRoles([UserRole.MANAGER]) as RequestHandler,
  validateBody(getEmployeesByIdsSchema),
  getEmployeesController,
);
// GET /profile - returns profile of the logged in user (manager or employee)
router.get(
  "/profile",
  verifyToken,
  authorizeRoles([UserRole.MANAGER, UserRole.EMPLOYEE]) as RequestHandler,
  getEmployeeController,
);
// PATCH /update/manager - update managerId for an employee (manager only)
router.patch(
  "/update/manager",
  verifyToken,
  authorizeRoles([UserRole.MANAGER]) as RequestHandler,
  validateBody(updateManagerIdSchema),
  updateManagerIdController,
);
// DELETE /:empId - delete a user by employeeId (manager only, can only delete users reporting to them)
router.delete(
  "/:empId",
  verifyToken,
  authorizeRoles([UserRole.MANAGER]) as RequestHandler,
  deleteUserController,
);

export default router;
