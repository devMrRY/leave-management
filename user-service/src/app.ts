import './tracing.js';
import express from 'express';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';
import connectDB from './db.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import { logger, serviceRegistry } from '@myorg/shared';
import { attachUserContext } from './middleware/extendReq.js';
import { handleCrash } from './utils/errorHandler.js';

const app = express();
process.on("uncaughtException", handleCrash);
process.on("unhandledRejection", handleCrash);
app.use(express.json());
app.use(attachUserContext);

dotenv.config();
connectDB();

app.use(pinoHttp({ logger }));
// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'user-service', instance: process.env.HOSTNAME });
});

// Auth routes
app.use(authRouter);
app.use(userRouter);

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`User service running on port ${PORT}`);

  // Register this service in the discovery registry
  const serviceHost: string = process.env.HOSTNAME as string;
  serviceRegistry.register('user-service', serviceHost, PORT);
});

process.on('SIGTERM', async () => {
  await serviceRegistry.deregister(
    `user-service-${process.env.HOSTNAME}`);

  process.exit(0);
});