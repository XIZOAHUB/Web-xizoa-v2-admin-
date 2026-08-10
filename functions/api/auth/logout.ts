/**
 * POST /api/auth/logout
 * Destroys session and clears cookies
 */

import type { Context } from "hono";
import type { Env } from "../../../config/env";
import { createSessionManager } from "../../../lib/auth/session";
import { deleteCookie } from "../../../utils/http";
import { parseCookies } from "../../../utils/http";
import { COOKIE_NAMES } from "../../../config/constants";

export default async function logoutHandler(c: Context<{ Bindings: Env }>) {
  const cookieHeader = c.req.header("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const sessionCookie = cookies[COOKIE_NAMES.session];

  if (sessionCookie) {
    const sessionId = sessionCookie.split(".")[0];
    const sessionManager = createSessionManager(c.env.KV_SESSIONS);
    await sessionManager.revoke(sessionId);
  }

  const headers = new Headers();
  deleteCookie(headers, COOKIE_NAMES.session);
  deleteCookie(headers, COOKIE_NAMES.csrf);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...Object.fromEntries(headers.entries()),
    },
  });
}
