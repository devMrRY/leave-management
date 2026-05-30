import './tracing';
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { verifyJwtGateway } from './middleware/verifyJwt.ts';
import { serviceRegistry } from './shared-config/serviceRegistry';
import rateLimit from "express-rate-limit";

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
app.set("trust proxy", 1);

app.use(globalLimiter);

const publicPrefixes = [
  "/auth",
  "/public",
  "/health"
];

function maybeVerifyJwt(req, res, next) {
  if (publicPrefixes.some(prefix => req.path.startsWith(prefix))) return authLimiter(req, res, next);
  return verifyJwtGateway(req, res, next);
}

const userProxy = createProxyMiddleware({
  changeOrigin: true,
  proxyTimeout: 5000,
  timeout: 5000,
  router: async () => {
    const url =
      await serviceRegistry.discover(
        'user-service'
      );
    return url || 'http://user-service:3000';
  },

  pathRewrite: {
    '^/api/users': ''
  },

  onProxyReq: (proxyReq, req) => {
    console.log(
      'Proxying:',
      req.method,
      req.originalUrl
    );
  },

  onError: (err, req, res) => {
    console.error(
      'Proxy error:',
      err
    );
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
    const url =
      await serviceRegistry.discover('leave-service')
      || 'http://localhost:4000';

    return url;
  },
  pathRewrite: { '^/api/leaves': '' },
  proxyTimeout: 5000,
  timeout: 5000,
  onError(err, req, res) {
    console.error("Leave proxy error:", err.message);
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
app.use(cookieParser());

// Service discovery status endpoint
app.get('/health/services', (_req, res) => {
  res.json({
    gateway: 'healthy',
    services: serviceRegistry.getAll().map(s => ({
      name: s.name,
      url: s.url,
      healthy: s.healthy,
      lastHealthCheck: s.lastHealthCheck
    }))
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API Gateway listening on ${PORT}`));
