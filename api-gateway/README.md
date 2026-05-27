API Gateway

Runs on port 5000 by default. Proxies requests to user service (http://localhost:3000) and leave service (http://localhost:4000).

Example:
- GET /api/users -> proxied to user service
- GET /api/leaves -> proxied to leave service

Set `JWT_SECRET` in .env for token verification.
