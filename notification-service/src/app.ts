import './utils/loadEnvConfig.js'
import './tracing.js';
import { startConsumer } from "./messaging/consumer.js";
import { handleCrash } from './utils/errorHandler.js';

process.on("uncaughtException", handleCrash);
process.on("unhandledRejection", handleCrash);
startConsumer();
