import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import type { Env } from "../../config/env";

// Auth handlers import
import loginHandler from "./auth/login";
import callbackHandler from "./auth/callback";
import sessionHandler from "./auth/session";
import logoutHandler from "./auth/logout";

const app = new Hono<{ Bindings: Env }>().basePath("/api");

// Safety Check: Cloudflare Dashboard bindings check
app.use("*", async (c, next) => {
  if (!c.env.KV_SESSIONS) {
     return c.text("Error: Cloudflare Dashboard me KV_SESSIONS bind nahi kiya gaya hai.", 500);
  }
  await next();
});

// Auth Routes (Raste)
app.get("/auth/login", loginHandler);
app.get("/auth/callback", callbackHandler);
app.get("/auth/session", sessionHandler);
app.post("/auth/logout", logoutHandler);

export const onRequest = handle(app);
