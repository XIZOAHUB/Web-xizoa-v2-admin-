/**
 * Authentication middleware
 * Validates session cookie and attaches user to context
 */

import type { Context, Next } from "hono";
import type { Env } from "../config/env";
import { createSessionManager, isRevoked } from "../lib/auth/session";
import { verifySignature } from "../lib/auth/crypto";
import { AuthenticationError } from "../utils/errors";
import { parseCookies } from "../utils/http";
import { COOKIE_NAMES } from "../config/constants";

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const cookieHeader = c.req.header("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const sessionId = cookies[COOKIE_NAMES.session];

  if (!sessionId) {
    throw new AuthenticationError("No session cookie found");
  }

  // Verify session cookie signature (signed cookie format: value.signature)
  const [rawId, signature] = sessionId.split(".");
  if (!rawId || !signature) {
    throw new AuthenticationError("Invalid session cookie format");
  }

  const valid = await verifySignature(rawId, signature, c.env.SESSION_SECRET);
  if (!valid) {
    throw new AuthenticationError("Invalid session signature");
  }

  // Check if revoked
  const revoked = await isRevoked(c.env.KV_SESSIONS, rawId);
  if (revoked) {
    throw new AuthenticationError("Session has been revoked");
  }

  // Validate session in KV
  const sessionManager = createSessionManager(c.env.KV_SESSIONS);
  const session = await sessionManager.validate(rawId);

  if (!session) {
    throw new AuthenticationError("Session expired or invalid");
  }

  // Check expiration
  if (Date.now() > session.expiresAt) {
    await sessionManager.destroy(rawId);
    throw new AuthenticationError("Session expired");
  }

  // Attach user to context
  c.set("user", {
    id: session.userId,
    username: session.username,
    avatar: session.avatar,
  });

  // Optional: Session rotation (every 15 min or 10 requests)
  const requestCount = parseInt(await c.env.KV_SESSIONS.get(`req_count:${rawId}`) || "0");
  const shouldRotate =
    Date.now() - session.lastRotatedAt > 15 * 60 * 1000 || // 15 min
    requestCount > 10;

  if (shouldRotate) {
    const newSessionId = await sessionManager.rotate(rawId, session);
    if (newSessionId) {
      const newSignature = await verifySignature(newSessionId, "", c.env.SESSION_SECRET);
      // Set new cookie
      // (handled by response middleware)
    }
    await c.env.KV_SESSIONS.put(`req_count:${rawId}`, "0");
  } else {
    await c.env.KV_SESSIONS.put(`req_count:${rawId}`, String(requestCount + 1));
  }

  await next();
}

// Helper to get current user from context
export function getUser(c: Context<{ Bindings: Env }>): { id: string; username: string; avatar: string } | null {
  return c.get("user") || null;
}
