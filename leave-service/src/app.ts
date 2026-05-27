import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import leaveRouter from './routes/leave.ts';
import { serviceRegistry } from './shared-config/serviceRegistry';
import { config } from './shared-config/config';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/leave-service';
mongoose.connect(MONGO).then(()=> console.log('Leave-service DB connected'))
  .catch(err=> console.error('DB conn error', err));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'leave-service' });
});

app.use('/leaves', leaveRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Leave service listening on ${PORT}`);

  // Register this service in the discovery registry
  const serviceHost = config.services.leaveService.host || process.env.SERVICE_HOST || `http://localhost`;
  serviceRegistry.register('leave-service', serviceHost, parseInt(PORT as string, 10));
});
