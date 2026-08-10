/**
 * Security headers middleware
 * Applies CSP, HSTS, X-Frame-Options, etc.
 */

import type { Context, Next } from "hono";
import { applySecurityHeaders } from "../lib/security/headers";

export async function securityHeadersMiddleware(c: Context, next: Next) {
  await next();

  // Apply security headers to response
  applySecurityHeaders(c.res.headers);
}
