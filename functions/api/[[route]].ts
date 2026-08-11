import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import type { Env } from "../../config/env";
import { getAuthorizationUrl, exchangeCode, fetchGitHubUser } from "../../lib/auth/github-oauth";
import { generateToken, sign } from "../../lib/auth/crypto";
import { createSessionManager } from "../../lib/auth/session";
import { setCookie, deleteCookie, getClientIP, getUserAgent } from "../../utils/http";
import { COOKIE_NAMES } from "../../config/constants";

const app = new Hono<{ Bindings: Env }>().basePath("/api");

// 1. Login Route
app.get("/auth/login", async (c) => {
  try {
    const redirectUri = `${new URL(c.req.url).origin}/api/auth/callback`;
    const state = await generateToken(32);
    
    await c.env.KV_SESSIONS.put(`oauth_state:${state}`, redirectUri, { expirationTtl: 300 });

    const authUrl = getAuthorizationUrl({
      clientId: c.env.GITHUB_CLIENT_ID,
      clientSecret: c.env.GITHUB_CLIENT_SECRET,
      redirectUri,
      allowedUser: c.env.GITHUB_ALLOWED_USER,
    }, state);

    return c.redirect(authUrl);
  } catch (err: any) {
    return c.html(`<h2>Login Button Error: ${err.message}</h2>`, 500);
  }
});

// 2. Callback Route (Jahan Error aa raha tha)
app.get("/auth/callback", async (c) => {
  try {
    const url = new URL(c.req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state) return c.html("<h2>Error: GitHub ne Verification Code nahi diya.</h2>", 400);

    const storedRedirect = await c.env.KV_SESSIONS.get(`oauth_state:${state}`);
    if (!storedRedirect) {
      return c.html("<h2>Error: Session Timeout ya State match nahi hua. Pls wapas login try karein.</h2>", 400);
    }
    await c.env.KV_SESSIONS.delete(`oauth_state:${state}`);

    const redirectUri = `${url.origin}/api/auth/callback`;
    
    // Check Client Secret
    let accessToken;
    try {
      accessToken = await exchangeCode(code, {
        clientId: c.env.GITHUB_CLIENT_ID,
        clientSecret: c.env.GITHUB_CLIENT_SECRET,
        redirectUri,
        allowedUser: c.env.GITHUB_ALLOWED_USER,
      });
    } catch (e: any) {
      return c.html(`<h2>GitHub Secret Error: ${e.message}</h2><p>Check karein ki Cloudflare me aapka GITHUB_CLIENT_SECRET bilkul sahi hai ya nahi.</p>`, 500);
    }

    const githubUser = await fetchGitHubUser(accessToken);

    // Check Username
    if (githubUser.login.toLowerCase() !== c.env.GITHUB_ALLOWED_USER.toLowerCase()) {
       return c.html(`<h2>Unauthorized: Aapka GitHub Username '${githubUser.login}' hai, par Cloudflare me allow sirf '${c.env.GITHUB_ALLOWED_USER}' ko hai.</h2>`, 401);
    }

    // Save Session
    const ip = getClientIP(c.req.raw);
    const ua = getUserAgent(c.req.raw);
    const sessionManager = createSessionManager(c.env.KV_SESSIONS);
    const sessionId = await sessionManager.create(String(githubUser.id), githubUser.login, githubUser.avatar_url, ip, ua);

    const signature = await sign(sessionId, c.env.SESSION_SECRET);
    const signedCookie = `${sessionId}.${signature}`;

    const headers = new Headers();
    setCookie(headers, COOKIE_NAMES.session, signedCookie, { httpOnly: true, secure: true, sameSite: "Strict", path: "/", maxAge: 86400 });

    return new Response(null, { status: 302, headers: { ...Object.fromEntries(headers.entries()), Location: "/dashboard" } });
  } catch (err: any) {
    return c.html(`<h2>System Error: ${err.message}</h2>`, 500);
  }
});

// 3. Session Check Route
app.get("/auth/session", async (c) => {
   const cookie = c.req.header('Cookie') || "";
   if (cookie.includes(COOKIE_NAMES.session)) {
      return c.json({ success: true, data: { authenticated: true, user: { username: c.env.GITHUB_ALLOWED_USER } } });
   }
   return c.json({ success: true, data: { authenticated: false } });
});

// 4. Logout Route
app.post("/auth/logout", async (c) => {
   const headers = new Headers();
   deleteCookie(headers, COOKIE_NAMES.session);
   return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", ...Object.fromEntries(headers.entries()) } });
});

export const onRequest = handle(app);
