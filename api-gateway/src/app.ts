import "./tracing";
import express from "express";
import "express-async-errors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { globalLimiter } from "./middleware/rateLimit";
import { maybeVerifyJwt } from "./middleware/auth";

import { userProxy } from "./proxy/userProxy";
import { leaveProxy } from "./proxy/leaveProxy";

import { serviceRegistry } from "@myorg/shared";
import { handleCrash } from "./utils.ts/errorHandler";
import { startServiceRefresh } from "./bootstrap/service-refresh";
import { globalErrorHandler } from "./middleware/globalErrorHandler.js";

dotenv.config();
const app = express();

process.on("uncaughtException", handleCrash);
process.on("unhandledRejection", handleCrash);

app.set("trust proxy", 1);
app.use(cookieParser());
app.use(globalLimiter);

app.use("/api/users", maybeVerifyJwt, userProxy);
app.use("/api/leaves", maybeVerifyJwt, leaveProxy);

app.use(express.json());

app.get("/health/services", (_req, res) => {
  res.json({
    gateway: "healthy",
    services: serviceRegistry.getAll(),
  });
});
app.use(globalErrorHandler);

async function start() {
  await startServiceRefresh(5000);
  const PORT = parseInt(process.env.PORT || "5000", 10);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`API Gateway listening on ${PORT}`);
  });
}
start();