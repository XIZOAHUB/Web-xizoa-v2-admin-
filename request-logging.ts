/**
 * Request logging middleware
 * Logs all API requests for audit trail
 */

import type { Context, Next } from "hono";
import type { Env } from "../config/env";
import { createAuditService } from "../services/audit-service";
import { getClientIP, getUserAgent } from "../utils/http";
import { sha256 } from "../lib/auth/crypto";

export async function requestLoggingMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const start = Date.now();
  const ip = getClientIP(c.req.raw);
  const ipHash = await sha256(ip);
  const userAgent = getUserAgent(c.req.raw);

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  // Skip logging for static assets and health checks
  if (c.req.path.startsWith("/static/") || c.req.path === "/health") {
    return;
  }

  // Only log errors or significant operations
  if (status >= 400 || c.req.method !== "GET") {
    const audit = createAuditService(c.env.DB);
    const user = c.get("user");

    await audit.log("api_request", "api", {
      resourceId: `${c.req.method} ${c.req.path}`,
      userId: user?.id,
      ipHash,
      userAgent,
      metadata: {
        method: c.req.method,
        path: c.req.path,
        status,
        duration: `${duration}ms`,
      },
      success: status < 400,
    });
  }
}
