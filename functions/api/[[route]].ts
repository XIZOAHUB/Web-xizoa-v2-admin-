import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import type { Env } from "../../config/env";
import { getAuthorizationUrl, exchangeCode, fetchGitHubUser } from "../../lib/auth/github-oauth";
import { generateToken, sign } from "../../lib/auth/crypto";
import { createSessionManager } from "../../lib/auth/session";
import { setCookie, deleteCookie, getClientIP, getUserAgent } from "../../utils/http";
import { COOKIE_NAMES } from "../../config/constants";

const app = new Hono<{ Bindings: Env }>().basePath("/api");

// --- 1. AUTH ROUTES (Login/Logout) ---
app.get("/auth/login", async (c) => {
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
});

app.get("/auth/callback", async (c) => {
  const url = new URL(c.req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return c.html("Error: Code missing", 400);

  const redirectUri = `${url.origin}/api/auth/callback`;
  const accessToken = await exchangeCode(code, {
    clientId: c.env.GITHUB_CLIENT_ID,
    clientSecret: c.env.GITHUB_CLIENT_SECRET,
    redirectUri,
    allowedUser: c.env.GITHUB_ALLOWED_USER,
  });

  const githubUser = await fetchGitHubUser(accessToken);
  const ip = getClientIP(c.req.raw);
  const ua = getUserAgent(c.req.raw);
  const sessionManager = createSessionManager(c.env.KV_SESSIONS);
  const sessionId = await sessionManager.create(String(githubUser.id), githubUser.login, githubUser.avatar_url, ip, ua);

  const signature = await sign(sessionId, c.env.SESSION_SECRET);
  setCookie(c.res.headers, COOKIE_NAMES.session, `${sessionId}.${signature}`, { httpOnly: true, secure: true, sameSite: "Strict", path: "/", maxAge: 86400 });
  
  return new Response(null, { status: 302, headers: { ...Object.fromEntries(c.res.headers.entries()), Location: "/dashboard" } });
});

app.get("/auth/session", async (c) => {
   const cookie = c.req.header('Cookie') || "";
   if (cookie.includes(COOKIE_NAMES.session)) {
      return c.json({ success: true, data: { authenticated: true, user: { username: c.env.GITHUB_ALLOWED_USER } } });
   }
   return c.json({ success: true, data: { authenticated: false } });
});

app.post("/auth/logout", async (c) => {
   deleteCookie(c.res.headers, COOKIE_NAMES.session);
   return c.json({ success: true });
});

// --- 2. SETTINGS ROUTES (Existing) ---
app.get("/settings", async (c) => {
  try {
    if (!c.env.DB) return c.json({ success: false, error: "Database not connected" }, 500);
    
    const result = await c.env.DB.prepare("SELECT * FROM settings").all();
    const settings: Record<string, string> = {};
    
    for (const row of result.results || []) {
      settings[String(row.key)] = String(row.value);
    }
    return c.json({ success: true, data: settings });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.put("/settings", async (c) => {
  try {
    const body = await c.req.json();
    const now = Math.floor(Date.now() / 1000);
    
    for (const [key, value] of Object.entries(body)) {
      await c.env.DB.prepare(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).bind(key, String(value), now).run();
    }
    return c.json({ success: true, data: { message: "Settings updated" } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// --- 3. POSTS ROUTES (DB-backed) ---
app.get('/posts', async (c) => {
  try {
    // If DB not available, return empty list with pagination
    if (!c.env.DB) {
      return c.json({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    }

    const url = new URL(c.req.url)
    const status = url.searchParams.get('status') || undefined
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '20'))
    const offset = (page - 1) * limit

    let baseQuery = `SELECT id, title, slug, excerpt, status, category, tags, featured_image, published_at, updated_at, github_sha FROM drafts`
    const params: any[] = []
    if (status) {
      baseQuery += ` WHERE status = ?`
      params.push(status)
    }
    baseQuery += ` ORDER BY updated_at DESC LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const result = await c.env.DB.prepare(baseQuery).bind(...params).all()
    const rows = result.results || []

    const items = rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      excerpt: r.excerpt,
      status: r.status,
      category: r.category,
      tags: (() => { try { return r.tags ? JSON.parse(r.tags) : [] } catch { return [] } })(),
      featuredImage: r.featured_image || '',
      publishedAt: r.published_at ? new Date(r.published_at * 1000).toISOString() : null,
      updatedAt: r.updated_at ? new Date(r.updated_at * 1000).toISOString() : null,
      githubSha: r.github_sha || null,
    }))

    // total count
    const countQuery = status ? `SELECT COUNT(*) as count FROM drafts WHERE status = ?` : `SELECT COUNT(*) as count FROM drafts`
    const countRow = status ? await c.env.DB.prepare(countQuery).bind(status).first() : await c.env.DB.prepare(countQuery).first()
    const total = countRow && (countRow.count !== undefined) ? Number(countRow.count) : items.length

    return c.json({ success: true, data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

app.get('/posts/:slug', async (c) => {
  try {
    if (!c.env.DB) return c.json({ success: false, error: 'Database not connected' }, 500)
    const { slug } = c.req.param()
    const row = await c.env.DB.prepare(`SELECT * FROM drafts WHERE slug = ?`).bind(slug).first()
    if (!row) return c.json({ success: false, error: 'Not found' }, 404)

    const item = {
      id: row.id,
      title: row.title,
      slug: row.slug,
      content: row.content,
      excerpt: row.excerpt,
      status: row.status,
      category: row.category,
      tags: (() => { try { return row.tags ? JSON.parse(row.tags) : [] } catch { return [] } })(),
      featuredImage: row.featured_image || '',
      publishedAt: row.published_at ? new Date(row.published_at * 1000).toISOString() : null,
      updatedAt: row.updated_at ? new Date(row.updated_at * 1000).toISOString() : null,
      githubSha: row.github_sha || null,
    }
    return c.json({ success: true, data: item })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

app.post('/posts', async (c) => {
  try {
    // auth + csrf middleware in _middleware.ts will protect this route in production
    if (!c.env.DB) {
      // If DB not available, return accepted but note it was not persisted
      const body = await c.req.json()
      const slug = body.slug || (body.title || 'untitled').toLowerCase().replace(/\s+/g, '-')
      const id = `post_demo_${Date.now()}`
      return c.json({ success: true, data: { id, slug, note: 'DB not connected; returned as demo' } }, 201)
    }

    const body = await c.req.json()
    const id = crypto?.randomUUID ? crypto.randomUUID() : `post_${Date.now()}`
    const now = Math.floor(Date.now() / 1000)
    const slug = body.slug || (body.title || 'untitled').toLowerCase().replace(/\s+/g, '-')
    const tagsText = body.tags ? JSON.stringify(body.tags) : JSON.stringify([])

    await c.env.DB.prepare(`
      INSERT INTO drafts (id, title, slug, content, excerpt, category, tags, featured_image, status, published_at, created_at, updated_at, github_sha)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.title || '',
      slug,
      body.content || '',
      body.excerpt || '',
      body.category || '',
      tagsText,
      body.featuredImage || '',
      body.status || 'draft',
      body.publishedAt ? Math.floor(new Date(body.publishedAt).getTime() / 1000) : null,
      now,
      now,
      body.githubSha || null
    ).run()

    return c.json({ success: true, data: { id, slug } }, 201)
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

app.put('/posts/:slug', async (c) => {
  try {
    if (!c.env.DB) return c.json({ success: false, error: 'Database not connected' }, 500)
    const { slug } = c.req.param()
    const body = await c.req.json()
    const now = Math.floor(Date.now() / 1000)
    const tagsText = body.tags ? JSON.stringify(body.tags) : JSON.stringify([])

    await c.env.DB.prepare(`
      UPDATE drafts SET
        title = ?, content = ?, excerpt = ?, category = ?, tags = ?, featured_image = ?, status = ?, published_at = ?, updated_at = ?, github_sha = ?
      WHERE slug = ?
    `).bind(
      body.title || '',
      body.content || '',
      body.excerpt || '',
      body.category || '',
      tagsText,
      body.featuredImage || '',
      body.status || 'draft',
      body.publishedAt ? Math.floor(new Date(body.publishedAt).getTime() / 1000) : null,
      now,
      body.githubSha || null,
      slug
    ).run()

    return c.json({ success: true, data: { message: 'Post updated' } })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

app.delete('/posts/:slug', async (c) => {
  try {
    if (!c.env.DB) return c.json({ success: false, error: 'Database not connected' }, 500)
    const { slug } = c.req.param()
    await c.env.DB.prepare(`DELETE FROM drafts WHERE slug = ?`).bind(slug).run()
    return c.json({ success: true, data: { message: 'Deleted' } })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

export const onRequest = handle(app);
