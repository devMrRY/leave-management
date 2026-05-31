import './tracing';
import express from 'express';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';
import { logger } from './logger';
import connectDB from './db.ts';
import authRouter from './routes/auth.ts';
import { serviceRegistry } from './shared-config/serviceRegistry';
import { config } from './shared-config/config';

const app = express();
app.use(express.json());

dotenv.config();
connectDB();
app.use(
  pinoHttp({
    logger
  })
);
// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'user-service', instance: process.env.HOSTNAME });
});

// Auth routes
app.use(authRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`User service running on port ${PORT}`);

  // Register this service in the discovery registry
  const serviceHost: string = (process.env.HOSTNAME) as string;
  serviceRegistry.register('user-service', serviceHost, parseInt(PORT as string, 10));
});

process.on('SIGTERM', async () => {
  await serviceRegistry.deregister(
    'user-service',
    process.env.HOSTNAME!
  );

  process.exit(0);
});