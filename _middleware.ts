/**
 * Global middleware chain for all API routes
 * Order matters: error handler first, then auth, then others
 */

import { Hono } from "hono";
import type { Env } from "../config/env";

import { errorHandlerMiddleware } from "../middleware/error-handler";
import { securityHeadersMiddleware } from "../middleware/security-headers";
import { requestLoggingMiddleware } from "../middleware/request-logging";
import { rateLimitMiddleware } from "../middleware/rate-limit";
import { authMiddleware } from "../middleware/auth";
import { csrfProtection } from "../middleware/csrf";

const app = new Hono<{ Bindings: Env }>();

// 1. Error handling (catches everything)
app.use("*", errorHandlerMiddleware);

// 2. Security headers on all responses
app.use("*", securityHeadersMiddleware);

// 3. Request logging
app.use("*", requestLoggingMiddleware);

// 4. Rate limiting
app.use("*", rateLimitMiddleware);

// 5. Auth required for protected routes
app.use("/api/posts/*", authMiddleware);
app.use("/api/pages/*", authMiddleware);
app.use("/api/media/*", authMiddleware);
app.use("/api/deploy/*", authMiddleware);
app.use("/api/github/*", authMiddleware);
app.use("/api/settings/*", authMiddleware);

// 6. CSRF for mutating operations
app.use("/api/posts/*", csrfProtection);
app.use("/api/pages/*", csrfProtection);
app.use("/api/media/*", csrfProtection);
app.use("/api/deploy/*", csrfProtection);
app.use("/api/settings/*", csrfProtection);

// Auth routes don't need prior auth (but login/callback are public)
// CSRF still applies to logout
app.use("/api/auth/logout", csrfProtection);

export default app;
