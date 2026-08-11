import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import type { Env } from "../config/env";

import { errorHandlerMiddleware } from "../middleware/error-handler";
import { securityHeadersMiddleware } from "../middleware/security-headers";
import { requestLoggingMiddleware } from "../middleware/request-logging";
import { rateLimitMiddleware } from "../middleware/rate-limit";
import { authMiddleware } from "../middleware/auth";
import { csrfProtection } from "../middleware/csrf";

const app = new Hono<{ Bindings: Env }>();

app.use("*", errorHandlerMiddleware);
app.use("*", securityHeadersMiddleware);
app.use("*", requestLoggingMiddleware);
app.use("*", rateLimitMiddleware);

app.use("/api/posts/*", authMiddleware);
app.use("/api/pages/*", authMiddleware);
app.use("/api/media/*", authMiddleware);
app.use("/api/deploy/*", authMiddleware);
app.use("/api/github/*", authMiddleware);
app.use("/api/settings/*", authMiddleware);

app.use("/api/posts/*", csrfProtection);
app.use("/api/pages/*", csrfProtection);
app.use("/api/media/*", csrfProtection);
app.use("/api/deploy/*", csrfProtection);
app.use("/api/settings/*", csrfProtection);
app.use("/api/auth/logout", csrfProtection);

// Cloudflare pages ke liye export aise hona chahiye
export const onRequest = handle(app);
