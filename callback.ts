/**
 * GET /api/auth/callback
 * GitHub OAuth callback - exchanges code for token, creates session
 */

import type { Context } from "hono";
import type { Env } from "../../../config/env";
import { exchangeCode, fetchGitHubUser, verifyAllowedUser } from "../../../lib/auth/github-oauth";
import { createSessionManager } from "../../../lib/auth/session";
import { sign } from "../../../lib/auth/crypto";
import { setCookie } from "../../../utils/http";
import { getClientIP, getUserAgent } from "../../../utils/http";
import { AuthenticationError } from "../../../utils/errors";
import { COOKIE_NAMES } from "../../../config/constants";

export default async function callbackHandler(c: Context<{ Bindings: Env }>) {
  const url = new URL(c.req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    throw new AuthenticationError("Missing code or state parameter");
  }

  // Verify state exists in KV
  const storedRedirect = await c.env.KV_SESSIONS.get(`oauth_state:${state}`);
  if (!storedRedirect) {
    throw new AuthenticationError("Invalid or expired state parameter");
  }

  // Delete used state
  await c.env.KV_SESSIONS.delete(`oauth_state:${state}`);

  // Exchange code for access token
  const redirectUri = `${url.origin}/api/auth/callback`;
  const accessToken = await exchangeCode(code, {
    clientId: c.env.GITHUB_CLIENT_ID,
    clientSecret: c.env.GITHUB_CLIENT_SECRET,
    redirectUri,
    allowedUser: c.env.GITHUB_ALLOWED_USER,
  });

  // Fetch GitHub user
  const githubUser = await fetchGitHubUser(accessToken);

  // Verify allowed user
  const isAllowed = verifyAllowedUser(githubUser, c.env.GITHUB_ALLOWED_USER);
  if (!isAllowed) {
    throw new AuthenticationError("GitHub account not authorized");
  }

  // Create session
  const ip = getClientIP(c.req.raw);
  const ua = getUserAgent(c.req.raw);
  const sessionManager = createSessionManager(c.env.KV_SESSIONS);
  const sessionId = await sessionManager.create(
    String(githubUser.id),
    githubUser.login,
    githubUser.avatar_url,
    ip,
    ua
  );

  // Sign session cookie
  const signature = await sign(sessionId, c.env.SESSION_SECRET);
  const signedCookie = `${sessionId}.${signature}`;

  // Set session cookie
  const headers = new Headers();
  setCookie(headers, COOKIE_NAMES.session, signedCookie, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/",
    maxAge: 86400,
  });

  // Redirect to dashboard
  return new Response(null, {
    status: 302,
    headers: {
      ...Object.fromEntries(headers.entries()),
      Location: "/dashboard",
    },
  });
}
