import './tracing.js';
import express from 'express';
import dotenv from 'dotenv';
import leaveRouter from './routes/leave';
import pinoHttp from 'pino-http';
import connectDB from './db.ts';
import { startConsumer } from './events/leave.consumer.js';
import { logger, serviceRegistry } from '@myorg/shared';
import { attachUserContext } from './middleware/extendReq';

dotenv.config();
const app = express();
app.use(express.json());
app.use(attachUserContext);

async function start() {
  await connectDB();
  await startConsumer();
}
start();
app.use(pinoHttp({ logger }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'leave-service' });
});

app.use(leaveRouter);

const PORT = parseInt(process.env.PORT || '4000', 10);
app.listen(PORT, () => {
  console.log(`Leave service listening on ${PORT}`);

  // Register this service in the discovery registry
  const serviceHost: string = process.env.HOSTNAME as string;
  serviceRegistry.register('leave-service', serviceHost, PORT);
});

process.on('SIGTERM', async () => {
  await serviceRegistry.deregister(
    `leave-service-${process.env.HOSTNAME}`);

  process.exit(0);
});