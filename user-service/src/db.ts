import mongoose from "mongoose";
import { seedUsers } from "./seed/initialUserSeed.js";
import { logger } from "@myorg/shared";
import { AppError } from "./utils/customError.js";

export default async function connectDB() {
  const { MONGO_HOST, MONGO_PORT, SERVICE_NAME } = process.env;
  const MONGO_URI: string = `mongodb://${MONGO_HOST}:${MONGO_PORT}/${SERVICE_NAME}`;

  const maxRetries = 20;
  logger.info(`🔗 Connecting to MongoDB at ${MONGO_URI}...`);
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await mongoose.connect(MONGO_URI);

      logger.info("✅ User DB connected");
      seedUsers()
        .then(() => {
          logger.info("✅ User DB seeding complete");
        })
        .catch((err) => {
          logger.error({ err }, "❌ User DB seeding failed");
        });
      break;
    } catch (error) {
      logger.error(`❌ User DB connection failed (attempt ${i}/${maxRetries})`);

      if (i === maxRetries) {
        logger.error(
          { err: error },
          "🚨 Max retries reached. Could not connect to the database.",
        );
        throw new AppError(
          500,
          "Failed to connect to the database after multiple attempts",
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}
