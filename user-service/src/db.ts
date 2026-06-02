import mongoose from 'mongoose';
import { seedUsers } from './seed/initialUserSeed.js';
import { logger } from '@myorg/shared';

export default async function connectDB() {
  const MONGO: string = process.env.MONGO_URI || 'mongodb://localhost:27017/leave-service';
  const maxRetries = 20;
  logger.info(`🔗 Connecting to MongoDB at ${MONGO}...`);
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await mongoose.connect(MONGO);

      logger.info('✅ User DB connected');
      seedUsers().then(() => {
        logger.info('✅ User DB seeding complete');
      }).catch((err) => {
        logger.error({ err }, '❌ User DB seeding failed');
      });
      return;
    } catch (error) {
      logger.error(
        `❌ User DB connection failed (attempt ${i}/${maxRetries})`
      );

      if (i === maxRetries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}
