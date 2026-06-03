import { createProxyMiddleware } from "http-proxy-middleware";
import { serviceRegistry, logger } from "@myorg/shared";

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
      const url = await serviceRegistry.discover(serviceName);

      if (!url) {
        throw new Error(`No healthy ${serviceName} instance found`);
      }

      return url;
    },

    pathRewrite,

    onProxyReq: (proxyReq, req: any) => {
      const user = req.user;

      if (user) {
        proxyReq.setHeader("x-user-id", user.userId);
        proxyReq.setHeader("x-user-role", user.role);
      }
    },

    onError: (err: any, req: any, res: any) => {
      logger.error({ error: err?.message }, `${serviceName} proxy error`);

      if (!res.headersSent) {
        res.status(502).json({
          error: err.message || `${serviceName} unavailable`,
        });
      }
    },
  });
}