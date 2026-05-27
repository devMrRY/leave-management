import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { verifyJwtGateway } from './middleware/verifyJwt.ts';
import { serviceRegistry } from './shared-config/serviceRegistry';

dotenv.config();
const app = express();

const publicPrefixes = [
  "/auth",
  "/public",
  "/health"
];

function maybeVerifyJwt(req, res, next) {
  if (publicPrefixes.some(prefix => req.path.startsWith(prefix))) return next();
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
    console.log(
      'Resolved user-service:',
      url
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

  onError: (err) => {
    console.error(
      'Proxy error:',
      err
    );
  }

});

// Single proxy for user service; middleware checks whitelist
app.use('/api/users', maybeVerifyJwt, userProxy);

// Proxy to leave service (requires auth)
app.use('/api/leaves', verifyJwtGateway, async () => {
  const LEAVE_SERVICE = await serviceRegistry.discover('leave-service') || process.env.LEAVE_SERVICE_URL || 'http://localhost:4000';

  createProxyMiddleware({
    target: LEAVE_SERVICE,
    changeOrigin: true,
    pathRewrite: { '^/api/leaves': '' }
  })
});

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
