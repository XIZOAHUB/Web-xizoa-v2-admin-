/**
 * POST /api/auth/login
 * Initiates GitHub OAuth flow
 */

import type { Context } from "hono";
import type { Env } from "../../../config/env";
import { getAuthorizationUrl } from "../../../lib/auth/github-oauth";
import { generateToken } from "../../../lib/auth/crypto";
import { setCookie } from "../../../utils/http";
import { COOKIE_NAMES } from "../../../config/constants";

export default async function loginHandler(c: Context<{ Bindings: Env }>) {
  const redirectUri = `${new URL(c.req.url).origin}/api/auth/callback`;

  // Generate state parameter
  const state = await generateToken(32);

  // Store state in KV (5 min expiry)
  await c.env.KV_SESSIONS.put(`oauth_state:${state}`, redirectUri, { expirationTtl: 300 });

  // Generate CSRF token
  const csrfToken = await generateToken(32);
  await c.env.KV_SESSIONS.put(`csrf:${csrfToken}`, "1", { expirationTtl: 3600 });

  // Set CSRF cookie
  const headers = new Headers();
  setCookie(headers, COOKIE_NAMES.csrf, csrfToken, {
    httpOnly: false, // Must be readable by JS for header
    secure: true,
    sameSite: "Strict",
    path: "/",
    maxAge: 3600,
  });

  // Build GitHub OAuth URL
  const authUrl = getAuthorizationUrl({
    clientId: c.env.GITHUB_CLIENT_ID,
    clientSecret: c.env.GITHUB_CLIENT_SECRET,
    redirectUri,
    allowedUser: c.env.GITHUB_ALLOWED_USER,
  }, state);

  // Return redirect with CSRF cookie
  return new Response(null, {
    status: 302,
    headers: {
      ...Object.fromEntries(headers.entries()),
      Location: authUrl,
    },
  });
}
