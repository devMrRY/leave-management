import { serviceRegistry, logger } from "@myorg/shared";

export async function startServiceRefresh(intervalMs = 5000) {
  // initial warm-up
  await serviceRegistry.refreshAll();

  setInterval(async () => {
    try {
      await serviceRegistry.refreshAll();
    } catch (err: any) {
      logger.error(
        { error: err?.message },
        "Service Refresh failed"
      );
    }
  }, intervalMs);
}