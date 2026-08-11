import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import type { Env } from "../config/env";

import { securityHeadersMiddleware } from "../middleware/security-headers";
import { requestLoggingMiddleware } from "../middleware/request-logging";
import { rateLimitMiddleware } from "../middleware/rate-limit";
import { authMiddleware } from "../middleware/auth";
import { csrfProtection } from "../middleware/csrf";

const app = new Hono<{ Bindings: Env }>();

// 1. Agar request normal page ki hai, toh seedha Frontend (UI) dikhao
app.use("*", async (c, next) => {
  if (!c.req.path.startsWith("/api")) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  await next();
});

// 2. Safety Check: Agar Dashboard me abhi Database (KV/D1) set nahi hai toh app crash na ho
app.use("/api/*", async (c, next) => {
  try {
    if (!c.env.KV_SESSIONS || !c.env.KV_RATE_LIMIT || !c.env.DB) {
       return c.json({ success: false, error: "Setup bacha hai: Cloudflare dashboard me KV aur D1 set karein" }, 500);
    }
    await next();
  } catch (err) {
    return c.json({ success: false, error: "API Error" }, 500);
  }
});

// 3. Baaki API ka code
app.use("/api/*", securityHeadersMiddleware);
app.use("/api/*", requestLoggingMiddleware);
app.use("/api/*", rateLimitMiddleware);

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

export const onRequest = handle(app);
