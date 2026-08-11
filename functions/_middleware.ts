import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import type { Env } from "../config/env";

// API Files Import
import loginHandler from "./api/auth/login";
import callbackHandler from "./api/auth/callback";
import sessionHandler from "./api/auth/session";
import logoutHandler from "./api/auth/logout";
import listPostsHandler from "./api/posts/list";

const app = new Hono<{ Bindings: Env }>();

// 1. Static Assets Rule (Taki Frontend UI hamesha load ho)
app.use("*", async (c, next) => {
  if (!c.req.path.startsWith("/api")) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  await next();
});

// 2. Safety Checks (Screen par saaf error batane ke liye)
app.use("/api/*", async (c, next) => {
  if (!c.env.KV_SESSIONS) {
    return c.text("Setup Error: Cloudflare Dashboard me 'KV_SESSIONS' binding add karein.", 500);
  }
  if (!c.env.GITHUB_CLIENT_ID || !c.env.GITHUB_CLIENT_SECRET) {
    return c.text("Setup Error: GITHUB_CLIENT_ID aur GITHUB_CLIENT_SECRET environment variables add karein.", 500);
  }
  if (!c.env.SESSION_SECRET) {
    return c.text("Setup Error: SESSION_SECRET environment variable add karein (koi bhi random text daal dein).", 500);
  }
  await next();
});

// 3. Auth aur API Routes (Ye kharab files ko bypass kar dega)
app.get("/api/auth/login", loginHandler);
app.get("/api/auth/callback", callbackHandler);
app.get("/api/auth/session", sessionHandler);
app.post("/api/auth/logout", logoutHandler);
app.get("/api/posts", listPostsHandler);

export const onRequest = handle(app);
