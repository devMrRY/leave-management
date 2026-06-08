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
// Gateway supplies user context via headers; we no longer attach from headers here
import { globalErrorHandler } from "./middleware/globalErrorHandler.js";
import { handleCrash } from "./utils/errorHandler.js";
import { startServiceRefresh } from "./bootstrap/service-refresh.js";

const app = express();
process.on("uncaughtException", handleCrash);
process.on("unhandledRejection", handleCrash);
app.use(express.json());

dotenv.config();
connectDB();

// pino-http may export as a CJS default; support both ESM default and namespace imports
const _pinoHttp: any = (pinoHttp as any)?.default ?? pinoHttp;
app.use(_pinoHttp({ logger }));
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
  await serviceRegistry.deregister("user-service");

  process.exit(0);
});
