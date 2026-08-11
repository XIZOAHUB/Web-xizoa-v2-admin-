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

// --- 2. SETTINGS ROUTES (Naya Code) ---
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

// --- 3. Mock Posts API (temporary, no DB) ---
// Note: This is a temporary demo implementation. It returns static/sample data so the frontend works
// without the D1-backed implementation. Replace with real D1 queries when ready.

const SAMPLE_POSTS = [
  {
    id: 'post_001',
    title: 'Building Xizoa CMS',
    slug: 'building-xizoa-cms',
    excerpt: 'A deep dive into building a Git-native CMS...',
    status: 'published',
    category: 'engineering',
    tags: ['cms', 'cloudflare', 'github'],
    featuredImage: 'https://cdn.xizoa.com/images/hero.webp',
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    githubSha: 'abc123'
  },
  {
    id: 'post_002',
    title: 'Draft Post Example',
    slug: 'draft-post-example',
    excerpt: 'Working on a new feature...',
    status: 'draft',
    category: 'engineering',
    tags: ['draft'],
    featuredImage: '',
    publishedAt: null,
    updatedAt: new Date().toISOString(),
    githubSha: null
  }
]

app.get('/posts', async (c) => {
  try {
    const url = new URL(c.req.url)
    const status = url.searchParams.get('status')
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '20'))
    let items = SAMPLE_POSTS.slice()
    if (status) items = items.filter(p => p.status === status)
    const total = items.length
    const start = (page - 1) * limit
    const paged = items.slice(start, start + limit)
    return c.json({ success: true, data: paged, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

app.get('/posts/:slug', async (c) => {
  try {
    const { slug } = c.req.param()
    const found = SAMPLE_POSTS.find(p => p.slug === slug)
    if (!found) return c.json({ success: false, error: 'Not found' }, 404)
    // Return a more detailed shape including content
    return c.json({ success: true, data: { ...found, content: `# ${found.title}\n\nThis is demo content for ${found.title}.` } })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

app.post('/posts', async (c) => {
  try {
    const body = await c.req.json()
    const slug = body.slug || (body.title || 'untitled').toLowerCase().replace(/\s+/g, '-')
    const id = `post_demo_${Date.now()}`
    const created = { id, slug, title: body.title || 'Untitled', content: body.content || '', excerpt: body.excerpt || '', status: body.status || 'draft', tags: body.tags || [], category: body.category || '', featuredImage: body.featuredImage || '', publishedAt: null, updatedAt: new Date().toISOString(), githubSha: null }
    // NOTE: Not persisted; demo only
    return c.json({ success: true, data: created }, 201)
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

app.put('/posts/:slug', async (c) => {
  try {
    const { slug } = c.req.param()
    const body = await c.req.json()
    // NOTE: In demo mode we don't persist; just return success
    return c.json({ success: true, data: { message: 'Updated', slug } })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

app.delete('/posts/:slug', async (c) => {
  try {
    const { slug } = c.req.param()
    // Demo: pretend deletion
    return c.json({ success: true, data: { message: 'Deleted', slug } })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

export const onRequest = handle(app);
