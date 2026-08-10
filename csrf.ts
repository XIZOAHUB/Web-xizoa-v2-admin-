/**
 * CSRF protection middleware
 * Validates X-CSRF-Token header against cookie
 */

import type { Context, Next } from "hono";
import type { Env } from "../config/env";
import { createCSRFManager } from "../lib/auth/csrf";
import { AuthorizationError } from "../utils/errors";
import { parseCookies } from "../utils/http";
import { COOKIE_NAMES } from "../config/constants";

export async function csrfProtection(c: Context<{ Bindings: Env }>, next: Next) {
  // Skip for GET, HEAD, OPTIONS (safe methods)
  const method = c.req.method;
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    await next();
    return;
  }

  // Get CSRF token from header
  const csrfHeader = c.req.header("X-CSRF-Token");
  if (!csrfHeader) {
    throw new AuthorizationError("CSRF token missing");
  }

  // Get CSRF cookie
  const cookieHeader = c.req.header("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const csrfCookie = cookies[COOKIE_NAMES.csrf];

  if (!csrfCookie) {
    throw new AuthorizationError("CSRF cookie missing");
  }

  // Validate token
  const csrfManager = createCSRFManager(c.env.KV_SESSIONS, c.env.CSRF_SECRET);
  const valid = await csrfManager.validate(csrfHeader);

  if (!valid) {
    throw new AuthorizationError("CSRF token invalid");
  }

  await next();
}

/**
 * Generate and set CSRF token for a response
 * Call this after successful login
 */
export async function generateCSRFToken(c: Context<{ Bindings: Env }>): Promise<string> {
  const csrfManager = createCSRFManager(c.env.KV_SESSIONS, c.env.CSRF_SECRET);
  return await csrfManager.generate();
}
