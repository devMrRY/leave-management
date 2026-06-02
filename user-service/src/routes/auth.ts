import express from 'express';
import { validateBody } from '../middleware/validateBody.js';
import { loginSchema, registerSchema } from '../schemas/userSchemas.js';
import { loginController, registerController, refreshTokenController } from '../controllers/authController.js';

const router = express.Router();

// POST /register - Register a new user
router.post('/auth/register', validateBody(registerSchema), registerController);

// POST /login - Authenticate user and return JWT
router.post('/auth/login', validateBody(loginSchema), loginController);

// GET /refresh-token - Issue new access token using refresh token cookie
router.get('/auth/refresh-token', refreshTokenController);

export default router;
