import "./utils/loadEnvConfig.js";
import "./tracing.js";
import express from "express";
import "express-async-errors";
import leaveRouter from "./routes/leave";
import pinoHttp from "pino-http";
import connectDB from "./db.js";
import { startConsumer } from "./events/leave.consumer.js";
import { logger, serviceRegistry } from "@myorg/shared";
import { handleCrash } from "./utils/errorHandler.js";
import { globalErrorHandler } from "./middleware/globalErrorHandler.js";
import { randomUUID } from "crypto";
import { startServiceRefresh } from "./bootstrap/service-refresh.js";

const app = express();
process.on("uncaughtException", handleCrash);
process.on("unhandledRejection", handleCrash);
app.use(express.json());

async function start() {
  app.use(pinoHttp({ logger }));

  connectDB();
  startConsumer();

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "healthy", service: "leave-service" });
  });

  app.use(leaveRouter);
  app.use(globalErrorHandler);

  const PORT = parseInt(process.env.PORT || "4000", 10);
  startServiceRefresh(5000);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Leave service listening on ${PORT}`);
    // Register this service in the discovery registry
    const serviceHost: string = randomUUID() as string;
    serviceRegistry.register("leave-service", serviceHost, PORT);
  });

  process.on("SIGTERM", async () => {
    await serviceRegistry.deregister("leave-service");
    process.exit(0);
  });
}
start();
