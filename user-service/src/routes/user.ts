import express, { RequestHandler } from 'express';
import { validateBody } from '../middleware/validateBody.js';
import { getEmployeesByIdsSchema, updateManagerIdSchema } from '../schemas/userSchemas.js';
import { getEmployeeController, updateManagerIdController, deleteUserController, getEmployeesController } from '../controllers/userController.js';
import { authorizeRoles } from '../middleware/verifyRoles.js';
import { UserRole } from '../models/User.js';

const router = express.Router();

// GET /employees - returns all employees reporting to the manager
router.post('/employees',  authorizeRoles([UserRole.MANAGER]) as RequestHandler, validateBody(getEmployeesByIdsSchema), getEmployeesController);
router.get('/:empId', authorizeRoles([UserRole.MANAGER, UserRole.EMPLOYEE]) as RequestHandler, getEmployeeController);
router.patch('/update/manager', authorizeRoles([UserRole.MANAGER]) as RequestHandler, validateBody(updateManagerIdSchema), updateManagerIdController);
router.delete('/:empId', authorizeRoles([UserRole.MANAGER]) as RequestHandler, deleteUserController);
export default router;
