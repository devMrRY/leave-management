import { logger } from "@myorg/shared";
import CircuitBreaker from "opossum";

export interface RequestOptions extends RequestInit {
  method: string;
  path: string;
}
type FetchFn = (init: RequestOptions) => Promise<Response>;

const breakerRegistry: Record<
  string,
  CircuitBreaker<[RequestOptions], Response>
> = {};

export function getCircuitBreaker(serviceName: string, fetchFn: FetchFn) {
  if (breakerRegistry[serviceName]) {
    return breakerRegistry[serviceName];
  }

  const breaker = new CircuitBreaker(fetchFn, {
    timeout: 5000, // request timeout
    errorThresholdPercentage: 50, // open if 50% fail
    resetTimeout: 10000, // retry after 10s
    volumeThreshold: 5,
    rollingCountTimeout: 6000,
    rollingCountBuckets: 60,
  });

  // optional logging
  breaker.on("open", () => logger.info(`[CB] OPEN: ${serviceName}`));
  breaker.on("halfOpen", () => logger.info(`[CB] HALF-OPEN: ${serviceName}`));
  breaker.on("close", () => logger.info(`[CB] CLOSED: ${serviceName}`));
  breaker.on("failure", (error) =>
    logger.error(
      { err: error, stats: breaker.stats },
      `[CB] FAILED: ${serviceName}`,
    ),
  );
  breaker.on("reject", (error) =>
    logger.error(
      { err: error, stats: breaker.stats },
      `[CB] FAILED: ${serviceName}`,
    ),
  );

  breakerRegistry[serviceName] = breaker;

  return breaker;
}
