import mongoose from "mongoose";
import { logger } from "@myorg/shared";

export default async function connectDB() {
  const { MONGO_HOST, MONGO_PORT, SERVICE_NAME } = process.env;
  const MONGO_URI: string = `mongodb://${MONGO_HOST}:${MONGO_PORT}/${SERVICE_NAME}`;

  const maxRetries = 20;
  logger.info(`🔗 Connecting to MongoDB at ${MONGO_URI}...`);
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await mongoose.connect(MONGO_URI);
      logger.info("✅ Leave DB connected");
      break;
    } catch (error) {
      logger.error(
        `❌ Leave DB connection failed (attempt ${i}/${maxRetries})`,
      );

      if (i === maxRetries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}
