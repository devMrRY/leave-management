import './tracing.js';
import { startConsumer } from "./messaging/consumer";

(async () => {
  await startConsumer();
})();