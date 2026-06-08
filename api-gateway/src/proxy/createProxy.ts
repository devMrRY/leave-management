import { createProxyMiddleware } from "http-proxy-middleware";
import { serviceRegistry, getCircuitBreaker } from "@myorg/shared";

export function createServiceProxy({
  serviceName,
  pathRewrite,
}: {
  serviceName: string;
  pathRewrite: Record<string, string>;
}) {
  return createProxyMiddleware({
    changeOrigin: true,
    proxyTimeout: 5000,
    timeout: 5000,
    cookieDomainRewrite: "localhost",

    router: async () => {
      // protect discovery with a circuit breaker so gateway can fast-fail when service unstable
      const discoverAction = async () => {
        const url = await serviceRegistry.discover(serviceName);
        if (!url) throw new Error(`No healthy ${serviceName} instance found`);
        return url;
      };

      const discoverBreaker = getCircuitBreaker(`service:${serviceName}`, discoverAction, async () => {
        // fallback: throw service unavailable to cause proxy to return 503
        throw new Error(`Service ${serviceName} unavailable`);
      });

      const url = await discoverBreaker.fire();
      return url;
    },

    pathRewrite,

    onProxyReq: (proxyReq, req: any) => {
      const user = req.user;

      if (user) {
        proxyReq.setHeader("x-user-id", user.userId);
        proxyReq.setHeader("x-user-role", user.role);
        proxyReq.setHeader("internal-api-key", process.env.INTERNAL_API_KEY || "");
      }
    },

    onError: (err: any, req: any, res: any, next: any) => {
      next(err);
    },
  });
}