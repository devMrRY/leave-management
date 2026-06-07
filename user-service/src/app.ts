import "./utils/loadEnvConfig.js";
import "./tracing.js";
import express from "express";
import "express-async-errors";
import dotenv from "dotenv";
import pinoHttp from "pino-http";
import { randomUUID } from "crypto";
import connectDB from "./db.js";
import authRouter from "./routes/auth.js";
import userRouter from "./routes/user.js";
import { logger, serviceRegistry } from "@myorg/shared";
import { attachUserContext } from "./middleware/extendReq.js";
import { globalErrorHandler } from "./middleware/globalErrorHandler.js";
import { handleCrash } from "./utils/errorHandler.js";
import { startServiceRefresh } from "./bootstrap/service-refresh";

const app = express();
process.on("uncaughtException", handleCrash);
process.on("unhandledRejection", handleCrash);
app.use(express.json());
app.use(attachUserContext);

dotenv.config();
connectDB();

app.use(pinoHttp({ logger }));
// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "user-service",
    instance: process.env.HOSTNAME,
  });
});

// Auth routes
app.use(authRouter);
app.use(userRouter);
app.use(globalErrorHandler);

async function start() {
  startServiceRefresh(5000);
  const PORT = parseInt(process.env.PORT || "3000", 10);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`User service running on port ${PORT}`);

    // Register this service in the discovery registry
    const serviceID: string = randomUUID() as string;
    serviceRegistry.register("user-service", serviceID, PORT);
  });
}
start();

process.on("SIGTERM", async () => {
  await serviceRegistry.deregister(
    "user-service",
    `user-service-${process.env.HOSTNAME}`,
  );

  process.exit(0);
});
