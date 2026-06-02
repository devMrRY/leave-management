import express, { RequestHandler } from 'express';
import { validateBody } from '../middleware/validateBody';
import { getEmployeesByIdsSchema, loginSchema, registerSchema, updateManagerIdSchema } from '../schemas/userSchemas';
import { loginController, registerController, refreshTokenController } from '../controllers/authController.js';
import { getEmployeeController, updateManagerIdController, deleteUserController, getEmployeesController } from '../controllers/userController';
import { authorizeRoles } from '../middleware/verifyRoles';
import { UserRole } from '../models/User';

const router = express.Router();

// POST /register - Register a new user
router.post('/auth/register', validateBody(registerSchema), registerController);

// POST /login - Authenticate user and return JWT
router.post('/auth/login', validateBody(loginSchema), loginController);

// GET /refresh-token - Issue new access token using refresh token cookie
router.get('/auth/refresh-token', refreshTokenController);

// GET /employees - returns all employees reporting to the manager
router.post('/employees',  authorizeRoles([UserRole.MANAGER]) as RequestHandler, validateBody(getEmployeesByIdsSchema), getEmployeesController);
router.get('/:empId', authorizeRoles([UserRole.MANAGER, UserRole.EMPLOYEE]) as RequestHandler, getEmployeeController);
router.patch('/update/manager', validateBody(updateManagerIdSchema), authorizeRoles([UserRole.MANAGER]) as RequestHandler, updateManagerIdController);
router.delete('/:empId', authorizeRoles([UserRole.MANAGER]) as RequestHandler, deleteUserController);
export default router;
