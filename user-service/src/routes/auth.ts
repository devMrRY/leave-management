import express from 'express';
import { validateBody } from '../middleware/validateBody.ts';
import { loginSchema, registerSchema } from '../schemas/authSchemas.ts';
import { loginController, registerController, refreshTokenController, getEmployeesController, updateUserController } from '../controllers/authController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// POST /register - Register a new user
router.post('/auth/register', validateBody(registerSchema), registerController);

// POST /login - Authenticate user and return JWT
router.post('/auth/login', validateBody(loginSchema), loginController);

// GET /refresh-token - Issue new access token using refresh token cookie
router.get('/auth/refresh-token', refreshTokenController);

// GET /employees - returns users managed by logged-in user
router.get('/employees', verifyToken, getEmployeesController);
router.patch('/user', verifyToken, updateUserController);

export default router;
