/**
 * Rate limiting middleware
 * Applies per-endpoint rate limits
 */

import type { Context, Next } from "hono";
import type { Env } from "../config/env";
import { createRateLimiter } from "../lib/security/rate-limiter";
import { getClientIP } from "../utils/http";

// Map routes to rate limit categories
const ENDPOINT_MAP: Record<string, string> = {
  "/api/auth": "auth",
  "/api/media/upload": "upload",
  "/api/deploy/trigger": "deploy",
  "/api/github": "github",
};

function getEndpointCategory(path: string): string {
  for (const [prefix, category] of Object.entries(ENDPOINT_MAP)) {
    if (path.startsWith(prefix)) return category;
  }
  return "api";
}

export async function rateLimitMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const ip = getClientIP(c.req.raw);
  const ipHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip))
    .then((buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16));

  const category = getEndpointCategory(c.req.path);
  const rateLimiter = createRateLimiter(c.env.KV_RATE_LIMIT);

  try {
    await rateLimiter.check(category, ipHash);
  } catch (error) {
    // Re-throw rate limit errors
    throw error;
  }

  await next();
}
