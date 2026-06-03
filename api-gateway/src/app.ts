import './tracing';
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { verifyJwtGateway } from './middleware/verifyJwt.ts';
import { serviceRegistry, logger } from '@myorg/shared';
import rateLimit from "express-rate-limit";
import { handleCrash } from './utils.ts/errorHandler.ts';

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 200 requests per window
  message: {
    error: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5, // brute-force protection
  message: {
    error: "Too many login attempts. Try again later.",
  },
});

dotenv.config();
const app = express();

process.on("uncaughtException", handleCrash);
process.on("unhandledRejection", handleCrash);

app.set("trust proxy", 1);
app.use(cookieParser());

app.use(globalLimiter);

async function startServiceRefresh() {
  await serviceRegistry.refreshAll();

  setInterval(async () => {
    try {
      await serviceRegistry.refreshAll();
    } catch (err: any) {
      logger.error({ error: err?.message }, 'Service Refresh failed:');
    }
  }, 5000);
}

startServiceRefresh();
const publicPrefixes = [
  "/auth",
  "/public",
  "/health"
];

function maybeVerifyJwt(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (publicPrefixes.some(prefix => req.path.startsWith(prefix))) return authLimiter(req, res, next);
  return verifyJwtGateway(req, res, next);
}

const userProxy = createProxyMiddleware({
  changeOrigin: true,
  proxyTimeout: 5000,
  timeout: 5000,
  cookieDomainRewrite: "localhost",
  router: async () => {
    const url =
      await serviceRegistry.discover(
        'user-service'
      );
    if (!url) {
      throw new Error(
        'No healthy user-service instance found'
      );
    }
    return url;
  },
  pathRewrite: {
    '^/api/users': ''
  },
  onProxyReq: (proxyReq, req) => {
    const user = (req as any).user;
    if (user) {
      proxyReq.setHeader("x-user-id", user.userId);
      proxyReq.setHeader("x-user-role", user.role);
    }
  },
  onError: (err: any, req: express.Request, res: express.Response) => {
    logger.error({ error: err?.message }, `Proxy error: ${err?.message}`);
    if (!res.headersSent) {
      res.status(502).json({
        error: err.message || "User service unavailable"
      });
    }
  }
});

const leaveProxy = createProxyMiddleware({
  changeOrigin: true,
  router: async () => {
    const url = await serviceRegistry.discover('leave-service');

    if (!url) {
      throw new Error(
        'No healthy leave-service instance found'
      );
    }

    return url;
  },
  pathRewrite: { '^/api/leaves': '' },
  cookieDomainRewrite: "localhost",
  proxyTimeout: 5000,
  timeout: 5000,
  onProxyReq: (proxyReq, req) => {
    const user = (req as any).user;

    if (user) {
      proxyReq.setHeader("x-user-id", user.userId);
      proxyReq.setHeader("x-user-role", user.role);
    }
  },
  onError(err: any, req: express.Request, res: express.Response) {
    logger.error({ error: err?.message }, `Leave proxy error: ${err?.message}`);
    if (!res.headersSent) {
      res.status(502).json({
        error: err.message || "Leave service unavailable"
      });
    }
  }
});

// Single proxy for user service; middleware checks whitelist
app.use('/api/users', maybeVerifyJwt, userProxy);

// Proxy to leave service (requires auth)
app.use('/api/leaves', verifyJwtGateway, leaveProxy);

// Only parse JSON and cookies for non-proxied routes (add after proxies)
app.use(express.json());

// Service discovery status endpoint
app.get('/health/services', (_req, res) => {
  res.json({
    gateway: 'healthy',
    instance: process.env.HOSTNAME,
    services: serviceRegistry.getAll().map(s => ({
      name: s.name,
      url: s.url,
      healthy: s.healthy,
      lastHealthCheck: s.lastHealthCheck
    }))
  });
});

const PORT = parseInt(process.env.PORT || '5000', 10);
app.listen(PORT, '0.0.0.0', () => console.log(`API Gateway listening on ${PORT}`));
