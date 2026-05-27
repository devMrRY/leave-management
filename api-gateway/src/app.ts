import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { verifyJwtGateway } from './middleware/verifyJwt.js';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());

const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://localhost:3000';
const LEAVE_SERVICE = process.env.LEAVE_SERVICE_URL || 'http://localhost:4000';

// Public routes (no auth)
app.get('/', (_req, res) => res.send('API Gateway'));

// Proxy to user service (requires auth)
app.use('/api/users', verifyJwtGateway, createProxyMiddleware({
  target: USER_SERVICE,
  changeOrigin: true,
  pathRewrite: { '^/api/users': '' }
}));

// Proxy to leave service (requires auth)
app.use('/api/leaves', verifyJwtGateway, createProxyMiddleware({
  target: LEAVE_SERVICE,
  changeOrigin: true,
  pathRewrite: { '^/api/leaves': '' }
}));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API Gateway listening on ${PORT}`));
