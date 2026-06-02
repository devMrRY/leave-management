import mongoose from 'mongoose';
import { logger } from '@myorg/shared';
export default async function connectDB() {
  const MONGO: string = process.env.MONGO_URI || 'mongodb://localhost:27017/leave-management';
  const maxRetries = 20;
  logger.info(`🔗 Connecting to MongoDB at ${MONGO}...`);
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await mongoose.connect(MONGO);
      logger.info('✅ Leave DB connected');
      return;
    } catch (error) {
      logger.error(
        `❌ Leave DB connection failed (attempt ${i}/${maxRetries})`
      );

      if (i === maxRetries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}
