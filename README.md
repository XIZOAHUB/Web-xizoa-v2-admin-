# Xizoa CMS — Complete Technical Architecture

> **Version:** 1.0  
> **Author:** Senior Software Architect  
> **Stack:** React + Vite + TypeScript + Tailwind | Cloudflare Pages + Functions | GitHub + R2 + D1 + KV  
> **Target:** Single-owner, Git-native, static-site CMS

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Folder Structure](#3-folder-structure)
4. [Technology Stack](#4-technology-stack)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Security Architecture & Threat Model](#6-security-architecture--threat-model)
7. [Database Schema (Cloudflare D1)](#7-database-schema-cloudflare-d1)
8. [API Specification](#8-api-specification)
9. [GitHub Integration](#9-github-integration)
10. [Cloudflare Integration](#10-cloudflare-integration)
11. [Content System](#11-content-system)
12. [Editor Design](#12-editor-design)
13. [Media Library](#13-media-library)
14. [Dashboard](#14-dashboard)
15. [Deployment Pipeline](#15-deployment-pipeline)
16. [Environment Variables & Secret Management](#16-environment-variables--secret-management)
17. [Monitoring & Audit](#17-monitoring--audit)
18. [Backup & Disaster Recovery](#18-backup--disaster-recovery)
19. [Implementation Roadmap](#19-implementation-roadmap)

---

## 1. Executive Summary

Xizoa CMS is a **Git-native, private content management system** designed for a single owner who writes, manages, and publishes content to a static site hosted on Cloudflare Pages. Unlike traditional CMS platforms (WordPress, Ghost), Xizoa treats GitHub as the source of truth for content and Cloudflare's edge infrastructure as the runtime.

### Core Principles

| Principle | Implementation |
|-----------|---------------|
| **Git-Native** | All published content lives as Markdown files in a GitHub repository with full version history |
| **Edge-First** | All compute runs on Cloudflare Functions at the edge; no origin server |
| **Zero-Trust** | Every request is authenticated, authorized, and audited |
| **Solo-Optimized** | Single-user system with minimal operational overhead |
| **Static-First** | Content is pre-rendered; dynamic features use edge functions sparingly |

### Data Flow Overview

```
+-------------+     +--------------+     +-----------------+     +-------------+
|   Editor    |---->|   Draft      |---->|  GitHub Commit  |---->| Cloudflare  |
|  (React)    |     |   (D1/KV)    |     |  (Markdown)     |     |   Pages     |
+-------------+     +--------------+     +-----------------+     +-------------+
       |                   |                       |                      |
       v                   v                       v                      v
+-------------+     +--------------+     +-----------------+     +-------------+
|  Media Lib  |     |  Preview     |     |   Build Hook    |     |   Live      |
|    (R2)     |     |  Branch      |     |   (Pages)       |     |   Site      |
+-------------+     +--------------+     +-----------------+     +-------------+
```

---

## 2. High-Level Architecture

### 2.1 System Context Diagram

```
                              +-------------------------------------+
                              |           Internet                  |
                              +-----------------+-------------------+
                                                |
                    +---------------------------+---------------------------+
                    |                           |                           |
                    v                           v                           v
           +-------------+            +-------------+              +-------------+
           |   Browser   |            |   Browser   |              |   GitHub    |
           |  (Owner)    |            |  (Public)   |              |   REST API  |
           +------+------+            +------+------+              +------+------+
                  |                          |                            |
                  v                          v                            |
    +-------------------------+    +-------------------------+            |
    |    Cloudflare Pages     |    |    Cloudflare Pages     |            |
    |  (Static Site - Public) |    |  (CMS Dashboard - Auth) |<-----------+
    |                         |    |                         |
    |  - Pre-built HTML/CSS   |    |  - React SPA            |
    |  - Markdown content     |    |  - Vite + TypeScript    |
    |  - Optimized images     |    |  - Tailwind CSS         |
    +-------------------------+    +------------+------------+
                                                |
                                                v
                                   +-------------------------+
                                   |   Cloudflare Functions  |
                                   |    (API - Protected)    |
                                   |                         |
                                   |  - Auth endpoints       |
                                   |  - Content CRUD         |
                                   |  - Media operations     |
                                   |  - GitHub proxy         |
                                   |  - Deploy triggers      |
                                   +------------+------------+
                                                |
                    +---------------------------+---------------------------+
                    |                           |                           |
                    v                           v                           v
           +-------------+            +-------------+              +-------------+
           |  Cloudflare |            |  Cloudflare |              |  Cloudflare |
           |     R2      |            |     D1      |              |     KV      |
           |  (Media)    |            | (Metadata)  |              | (Sessions)  |
           +-------------+            +-------------+              +-------------+
```

### 2.2 Component Responsibilities

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| **Frontend** | CMS dashboard UI, editor, media library, preview | React 18 + Vite + TypeScript + Tailwind |
| **Static Site** | Public-facing website generated from Markdown | Cloudflare Pages (Hugo/11ty/Astro) |
| **Functions** | API layer, auth, GitHub proxy, media ops | Cloudflare Functions (Worker Runtime) |
| **R2** | Image/media storage with CDN | Cloudflare R2 + Images API |
| **D1** | Structured metadata, drafts, audit logs | Cloudflare D1 (SQLite) |
| **KV** | Sessions, rate limits, temp tokens | Cloudflare KV (key-value) |
| **GitHub** | Content repository, version control, build trigger | GitHub REST API + GitHub Actions |

---

## 3. Folder Structure

```
xizoa-cms/
├── .github/
│   └── workflows/
│       └── deploy.yml                    # GitHub Actions for static site build
├── frontend/                             # React CMS Dashboard
│   ├── public/
│   │   ├── _headers                      # Cloudflare Pages custom headers
│   │   ├── _redirects                    # Cloudflare Pages redirects
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   └── Skeleton.tsx
│   │   │   ├── editor/
│   │   │   │   ├── MarkdownEditor.tsx
│   │   │   │   ├── RichEditor.tsx
│   │   │   │   ├── EditorToolbar.tsx
│   │   │   │   ├── LivePreview.tsx
│   │   │   │   ├── ImageUploader.tsx
│   │   │   │   ├── FrontmatterForm.tsx
│   │   │   │   └── CommandPalette.tsx
│   │   │   ├── media/
│   │   │   │   ├── MediaGrid.tsx
│   │   │   │   ├── MediaUploader.tsx
│   │   │   │   ├── MediaDetail.tsx
│   │   │   │   └── FolderTree.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── StatCard.tsx
│   │   │   │   ├── RecentPosts.tsx
│   │   │   │   ├── DeployStatus.tsx
│   │   │   │   ├── GitCommits.tsx
│   │   │   │   └── AnalyticsWidget.tsx
│   │   │   └── layout/
│   │   │       ├── Sidebar.tsx
│   │   │       ├── TopBar.tsx
│   │   │       ├── AppShell.tsx
│   │   │       └── MobileNav.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── usePosts.ts
│   │   │   ├── useMedia.ts
│   │   │   ├── useDebounce.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   ├── useKeyboardShortcuts.ts
│   │   │   └── useTheme.ts
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Editor.tsx
│   │   │   ├── Posts.tsx
│   │   │   ├── Pages.tsx
│   │   │   ├── Media.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── Preview.tsx
│   │   ├── stores/
│   │   │   ├── authStore.ts              # Zustand
│   │   │   ├── editorStore.ts
│   │   │   └── uiStore.ts
│   │   ├── lib/
│   │   │   ├── api.ts                    # Axios/fetch wrapper
│   │   │   ├── github.ts                 # GitHub API client
│   │   │   ├── markdown.ts               # Markdown parser/renderer
│   │   │   └── seo.ts                    # SEO metadata generator
│   │   ├── types/
│   │   │   ├── auth.ts
│   │   │   ├── post.ts
│   │   │   ├── media.ts
│   │   │   ├── api.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── slugify.ts
│   │   │   ├── readingTime.ts
│   │   │   ├── dateFormat.ts
│   │   │   ├── sanitize.ts
│   │   │   └── validators.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── package.json
├── functions/                            # Cloudflare Functions (API)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.ts                  # POST /api/auth/login
│   │   │   ├── callback.ts               # GET /api/auth/callback
│   │   │   ├── session.ts                # GET /api/auth/session
│   │   │   ├── logout.ts                 # POST /api/auth/logout
│   │   │   └── refresh.ts                # POST /api/auth/refresh
│   │   ├── posts/
│   │   │   ├── list.ts                   # GET /api/posts
│   │   │   ├── create.ts                 # POST /api/posts
│   │   │   ├── get.ts                    # GET /api/posts/:slug
│   │   │   ├── update.ts                 # PUT /api/posts/:slug
│   │   │   └── delete.ts                 # DELETE /api/posts/:slug
│   │   ├── pages/
│   │   │   ├── list.ts
│   │   │   ├── create.ts
│   │   │   ├── get.ts
│   │   │   ├── update.ts
│   │   │   └── delete.ts
│   │   ├── drafts/
│   │   │   ├── list.ts
│   │   │   ├── create.ts
│   │   │   ├── get.ts
│   │   │   ├── update.ts
│   │   │   └── delete.ts
│   │   ├── media/
│   │   │   ├── upload.ts                 # POST /api/media/upload
│   │   │   ├── list.ts                   # GET /api/media
│   │   │   ├── delete.ts                 # DELETE /api/media/:id
│   │   │   ├── rename.ts                 # PUT /api/media/:id/rename
│   │   │   └── optimize.ts               # POST /api/media/optimize
│   │   ├── deploy/
│   │   │   ├── status.ts                 # GET /api/deploy/status
│   │   │   ├── trigger.ts                # POST /api/deploy/trigger
│   │   │   └── logs.ts                   # GET /api/deploy/logs
│   │   ├── github/
│   │   │   ├── tree.ts                   # GET /api/github/tree
│   │   │   ├── content.ts                # GET /api/github/content
│   │   │   ├── commits.ts                # GET /api/github/commits
│   │   │   └── rollback.ts               # POST /api/github/rollback
│   │   ├── analytics/
│   │   │   └── overview.ts               # GET /api/analytics/overview
│   │   └── settings/
│   │       ├── get.ts
│   │       └── update.ts
│   ├── _middleware.ts                    # Global middleware chain
│   └── _routes.json                      # Function routing rules
├── lib/                                  # Shared server-side utilities
│   ├── auth/
│   │   ├── github-oauth.ts
│   │   ├── session.ts
│   │   ├── csrf.ts
│   │   └── crypto.ts
│   ├── github/
│   │   ├── client.ts
│   │   ├── content.ts
│   │   ├── commits.ts
│   │   └── tree.ts
│   ├── storage/
│   │   ├── r2.ts
│   │   ├── d1.ts
│   │   └── kv.ts
│   ├── security/
│   │   ├── headers.ts
│   │   ├── rate-limiter.ts
│   │   ├── sanitizer.ts
│   │   └── validators.ts
│   ├── content/
│   │   ├── frontmatter.ts
│   │   ├── markdown.ts
│   │   ├── slug.ts
│   │   └── seo.ts
│   └── cloudflare/
│       ├── pages.ts
│       ├── cache.ts
│       └── analytics.ts
├── services/                             # Business logic layer
│   ├── post-service.ts
│   ├── page-service.ts
│   ├── draft-service.ts
│   ├── media-service.ts
│   ├── deploy-service.ts
│   ├── github-service.ts
│   └── audit-service.ts
├── middleware/                           # Reusable middleware
│   ├── auth.ts
│   ├── csrf.ts
│   ├── rate-limit.ts
│   ├── security-headers.ts
│   ├── request-logging.ts
│   ├── error-handler.ts
│   └── validation.ts
├── types/                                # Shared TypeScript types
│   ├── auth.ts
│   ├── post.ts
│   ├── media.ts
│   ├── api.ts
│   ├── cloudflare.ts
│   └── index.ts
├── utils/                                # Shared utilities
│   ├── date.ts
│   ├── string.ts
│   ├── http.ts
│   └── errors.ts
├── database/
│   ├── migrations/
│   │   ├── 001_initial.sql
│   │   ├── 002_add_audit_logs.sql
│   │   └── 003_add_publish_queue.sql
│   └── seeds/
│       └── default_settings.sql
├── config/
│   ├── env.ts                            # Environment variable loader
│   ├── constants.ts                      # App constants
│   └── security.ts                       # Security config
├── static-site/                          # Public website (separate repo or subfolder)
│   ├── content/
│   │   ├── posts/
│   │   └── pages/
│   ├── themes/
│   ├── layouts/
│   └── config.yml
├── wrangler.toml                         # Cloudflare Workers config
├── tsconfig.json
├── package.json
└── README.md
```

---

## 4. Technology Stack

### 4.1 Frontend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | React | 18.x | UI library |
| Build Tool | Vite | 5.x | Fast dev & production builds |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| State | Zustand | 4.x | Lightweight state management |
| Routing | React Router | 6.x | SPA navigation |
| Editor | CodeMirror 6 | - | Markdown editing |
| Markdown | remark + rehype | - | Parse & render Markdown |
| Icons | Lucide React | - | Icon library |
| HTTP | native fetch | - | API requests |

### 4.2 Backend (Cloudflare Functions)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Cloudflare Workers | Edge compute |
| Framework | Hono | Lightweight router for Workers |
| Auth | GitHub OAuth 2.0 | Identity provider |
| Sessions | KV + signed cookies | Session storage |
| Database | D1 (SQLite) | Structured data |
| Object Storage | R2 | Media files |
| Cache | KV + Cache API | Rate limits, temp data |

### 4.3 Infrastructure

| Service | Purpose |
|---------|---------|
| Cloudflare Pages | Host CMS dashboard + static site |
| Cloudflare Functions | API endpoints |
| Cloudflare R2 | Media storage |
| Cloudflare D1 | Metadata database |
| Cloudflare KV | Sessions & rate limiting |
| GitHub | Content repository |
| GitHub Actions | Static site build pipeline |

---

## 5. Authentication & Authorization

### 5.1 Authentication Flow

```
+---------+                                    +-------------+
| Browser |                                    |   Xizoa     |
|  (User) |                                    |   CMS API   |
+----+----+                                    +------+------+
     |                                                |
     |  1. Click "Login with GitHub"                  |
     |----------------------------------------------->|
     |                                                |
     |  2. Generate state + nonce, store in KV        |
     |     Set CSRF token cookie                      |
     |                                                |
     |  3. Redirect to GitHub OAuth authorize URL     |
     |<-----------------------------------------------|
     |                                                |
     |  4. User authenticates on GitHub               |
     |----------------------------------------------->|
     |                     (github.com)               |
     |                                                |
     |  5. GitHub redirects with code + state         |
     |<-----------------------------------------------|
     |                                                |
     |  6. GET /api/auth/callback?code=...&state=...  |
     |----------------------------------------------->|
     |                                                |
     |  7. Verify state matches KV                    |
     |  8. Exchange code for access token (server)    |
     |  9. Fetch GitHub user profile                  |
     | 10. Verify user === GITHUB_ALLOWED_USER        |
     | 11. Create session in KV                       |
     | 12. Set HttpOnly Secure SameSite session cookie|
     |                                                |
     | 13. Redirect to /dashboard                     |
     |<-----------------------------------------------|
     |                                                |
     |  14. All subsequent requests include cookie    |
     |----------------------------------------------->|
     |  15. Validate session via KV lookup            |
     |  16. Rotate session ID periodically            |
```

### 5.2 Session Management

```typescript
// Session structure stored in KV
interface Session {
  sessionId: string;           // CSPRNG-generated, 32 bytes hex
  userId: string;              // GitHub user ID (numeric string)
  username: string;            // GitHub username
  avatar: string;              // GitHub avatar URL
  createdAt: number;           // Unix timestamp (ms)
  expiresAt: number;           // Unix timestamp (ms) - 24 hours
  lastRotatedAt: number;       // Unix timestamp (ms)
  ipHash: string;              // SHA-256 of client IP (first 3 octets)
  userAgentHash: string;       // SHA-256 of user agent substring
}

// Cookie attributes
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'Strict',
  path: '/',
  maxAge: 86400,              // 24 hours
};
```

### 5.3 Session Lifecycle

| Event | Action |
|-------|--------|
| **Login** | Generate session -> Store in KV (TTL=24h) -> Set cookie |
| **Request** | Read cookie -> Lookup KV -> Validate expiry -> Attach user |
| **Rotation** | Every 15 min or 10 requests -> New session ID -> Update KV -> Update cookie |
| **Logout** | Delete from KV -> Clear cookie -> Add to revocation list (5 min) |
| **Expiry** | KV auto-expires after TTL |

### 5.4 CSRF Protection

```typescript
// Double-submit cookie pattern
const CSRF_TOKEN = generateToken(32);  // CSPRNG

// Response header
Set-Cookie: xizoa_csrf=<token>; Secure; SameSite=Strict; Path=/

// Every mutating request must include:
Header: X-CSRF-Token: <token>
// Server verifies cookie token === header token
```

### 5.5 Authorization Rules

```
+-----------------+----------+----------+----------+----------+
|     Resource    |  Owner   |  Guest   |  Public  |  Bot     |
+-----------------+----------+----------+----------+----------+
| /api/auth/*     |    Y     |    Y     |    Y     |    N     |
| /api/posts/*    |    Y     |    N     |    N     |    N     |
| /api/pages/*    |    Y     |    N     |    N     |    N     |
| /api/media/*    |    Y     |    N     |    N     |    N     |
| /api/deploy/*   |    Y     |    N     |    N     |    N     |
| /api/github/*   |    Y     |    N     |    N     |    N     |
| /api/analytics  |    Y     |    N     |    N     |    N     |
| /api/settings   |    Y     |    N     |    N     |    N     |
| / (static site) |    Y     |    Y     |    Y     |    Y     |
+-----------------+----------+----------+----------+----------+
```

---

## 6. Security Architecture & Threat Model

### 6.1 Threat Model (STRIDE)

| Threat | Vector | Mitigation |
|--------|--------|------------|
| **Spoofing** | Fake GitHub OAuth callback | State parameter validation, nonce |
| **Tampering** | Modify session cookie | Signed cookies (HMAC-SHA256) |
| **Repudiation** | Deny content changes | Audit logs in D1, Git commit history |
| **Info Disclosure** | Token leakage | Server-side only, env vars, no logs |
| **DoS** | API abuse | Rate limiting per IP + per user |
| **Elevation** | Session hijacking | Binding to IP/UA hash, rotation, short TTL |

### 6.2 Security Headers

```typescript
// Applied to all responses via middleware
const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",  // Required for Vite/React in dev; tighten for prod
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://*.githubusercontent.com https://*.r2.dev",
    "connect-src 'self' https://api.github.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'X-XSS-Protection': '0',  // Deprecated, rely on CSP
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
};
```

### 6.3 XSS Prevention

| Layer | Control |
|-------|---------|
| Input | Validate all user input with Zod schemas |
| Storage | Sanitize Markdown before rendering (DOMPurify) |
| Output | Escape HTML in React (default behavior) |
| CSP | `script-src 'self'`, no `unsafe-eval` in production |
| Editor | Disable raw HTML in Markdown unless explicitly allowed |

### 6.4 CSRF Prevention

- Double-submit cookie pattern
- `SameSite=Strict` on all cookies
- `X-CSRF-Token` header required for all state-changing requests
- State parameter in OAuth flow

### 6.5 SSRF Prevention

```typescript
// Strict URL validation for any outbound requests
const ALLOWED_HOSTS = [
  'api.github.com',
  'raw.githubusercontent.com',
  'api.cloudflare.com',
];

function validateUrl(url: string): boolean {
  const parsed = new URL(url);
  return ALLOWED_HOSTS.includes(parsed.hostname);
}
```

### 6.6 Rate Limiting

```typescript
// KV-based rate limiting
const RATE_LIMITS = {
  auth:     { window: 300, max: 5 },     // 5 attempts per 5 min
  api:      { window: 60, max: 100 },    // 100 requests per min
  upload:   { window: 60, max: 10 },     // 10 uploads per min
  deploy:   { window: 300, max: 3 },     // 3 deploy triggers per 5 min
  github:   { window: 60, max: 60 },     // 60 GitHub API calls per min
};

// Key format: rate_limit:{endpoint}:{ip_hash}
```

### 6.7 Input Validation

```typescript
// Zod schemas for all API inputs
import { z } from 'zod';

const PostSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(100),
  content: z.string().max(100000),
  excerpt: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  featuredImage: z.string().url().optional(),
  status: z.enum(['draft', 'published', 'scheduled']),
  publishedAt: z.string().datetime().optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
});

const MediaUploadSchema = z.object({
  filename: z.string().regex(/^[a-zA-Z0-9._-]+$/),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']),
  size: z.number().max(10 * 1024 * 1024),  // 10MB
});
```

### 6.8 File Upload Security

```typescript
// Multi-layer validation
function validateUpload(file: File): boolean {
  // 1. Extension whitelist
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
  const ext = path.extname(file.name).toLowerCase();
  if (!allowedExts.includes(ext)) return false;

  // 2. MIME type verification (magic bytes)
  const magic = file.slice(0, 4);
  const validMagic = verifyMagicBytes(magic, ext);
  if (!validMagic) return false;

  // 3. Size limit
  if (file.size > 10 * 1024 * 1024) return false;

  // 4. Image dimension limits
  const dimensions = getImageDimensions(file);
  if (dimensions.width > 4096 || dimensions.height > 4096) return false;

  // 5. Sanitize filename
  const safeName = sanitizeFilename(file.name);

  return true;
}
```

### 6.9 Markdown Sanitization

```typescript
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4',
  'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr'
];

const ALLOWED_ATTRS = {
  'a': ['href', 'title'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  '*': ['class'],
};

function sanitizeMarkdownHtml(html: string): string {
  const window = new JSDOM('').window;
  const purify = DOMPurify(window);
  return purify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTRS,
    ALLOW_DATA_ATTR: false,
  });
}
```

---

## 7. Database Schema (Cloudflare D1)

### 7.1 Schema Diagram

```
+-----------------+     +-----------------+     +-----------------+
|     drafts      |     |  media_metadata |     |   sessions      |
+-----------------+     +-----------------+     +-----------------+
| id (PK)         |     | id (PK)         |     | id (PK)         |
| title           |     | filename        |     | user_id         |
| slug (UNIQUE)   |     | original_name   |     | token_hash      |
| content         |     | mime_type       |     | expires_at      |
| excerpt         |     | size            |     | created_at      |
| category_id     |<----| width           |     | ip_hash         |
| tags (JSON)     |     | height          |     | ua_hash         |
| featured_image  |---->| r2_key          |     | rotated_at      |
| status          |     | r2_url          |     +-----------------+
| meta_title      |     | cdn_url         |
| meta_desc       |     | folder          |
| published_at    |     | uploaded_at     |
| created_at      |     | metadata (JSON) |
| updated_at      |     +-----------------+
| github_sha      |
| type            |
+-----------------+
         |
         |
         v
+-----------------+     +-----------------+     +-----------------+
|  publish_queue  |     |   audit_logs    |     |    settings     |
+-----------------+     +-----------------+     +-----------------+
| id (PK)         |     | id (PK)         |     | key (PK)        |
| draft_id (FK)   |     | timestamp       |     | value           |
| scheduled_at    |     | action          |     | updated_at      |
| status          |     | resource        |     +-----------------+
| processed_at    |     | resource_id     |
| error_msg       |     | user_id         |
+-----------------+     | ip_hash         |
                        | user_agent      |
                        | details (JSON)  |
                        +-----------------+
```

### 7.2 SQL Schema

```sql
-- ============================================
-- Xizoa CMS D1 Schema
-- ============================================

-- Sessions: Managed primarily in KV, but backup log in D1
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    ip_hash TEXT,
    ua_hash TEXT,
    rotated_at INTEGER,
    revoked_at INTEGER
);

CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- Drafts: Content in progress, not yet committed to GitHub
CREATE TABLE drafts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL DEFAULT '',
    excerpt TEXT,
    category TEXT,
    tags TEXT DEFAULT '[]', -- JSON array
    featured_image TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
    meta_title TEXT,
    meta_description TEXT,
    published_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    github_sha TEXT, -- SHA of committed file (if published)
    type TEXT NOT NULL DEFAULT 'post' CHECK (type IN ('post', 'page'))
);

CREATE INDEX idx_drafts_status ON drafts(status);
CREATE INDEX idx_drafts_slug ON drafts(slug);
CREATE INDEX idx_drafts_type ON drafts(type);
CREATE INDEX idx_drafts_updated ON drafts(updated_at);

-- Media Metadata: R2 object metadata
CREATE TABLE media_metadata (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    r2_key TEXT NOT NULL UNIQUE,
    r2_url TEXT NOT NULL,
    cdn_url TEXT NOT NULL,
    folder TEXT NOT NULL DEFAULT '/',
    uploaded_at INTEGER NOT NULL DEFAULT (unixepoch()),
    metadata TEXT DEFAULT '{}' -- JSON: exif, alt text, etc.
);

CREATE INDEX idx_media_folder ON media_metadata(folder);
CREATE INDEX idx_media_uploaded ON media_metadata(uploaded_at);

-- Publish Queue: Scheduled publishing
CREATE TABLE publish_queue (
    id TEXT PRIMARY KEY,
    draft_id TEXT NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
    scheduled_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processed_at INTEGER,
    error_message TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_queue_scheduled ON publish_queue(scheduled_at, status);
CREATE INDEX idx_queue_draft ON publish_queue(draft_id);

-- Audit Logs: Immutable event log
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
    action TEXT NOT NULL, -- login, logout, create_post, update_post, delete_post, upload_media, deploy, etc.
    resource TEXT NOT NULL, -- auth, post, page, media, deploy, settings
    resource_id TEXT,
    user_id TEXT,
    ip_hash TEXT NOT NULL,
    user_agent TEXT,
    details TEXT DEFAULT '{}', -- JSON payload
    success INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource, resource_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);

-- Settings: Key-value configuration
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Default settings
INSERT INTO settings (key, value) VALUES
    ('site_title', 'Xizoa Blog'),
    ('site_description', 'A blog built with Xizoa CMS'),
    ('site_url', 'https://xizoa.pages.dev'),
    ('posts_per_page', '10'),
    ('default_category', 'Uncategorized'),
    ('auto_excerpt_length', '160'),
    ('enable_comments', 'false'),
    ('theme', 'default'),
    ('timezone', 'UTC'),
    ('date_format', 'YYYY-MM-DD');
```

### 7.3 KV Data Structures

```
# Session storage
Key:    session:{sessionId}
Value:  { userId, username, avatar, createdAt, expiresAt, ipHash, uaHash }
TTL:    86400 seconds (24 hours)

# Rate limiting
Key:    rate_limit:{endpoint}:{ipHash}
Value:  { count, windowStart }
TTL:    Window duration

# CSRF tokens
Key:    csrf:{token}
Value:   "1"
TTL:    3600 seconds (1 hour)

# Temporary upload tokens
Key:    upload_token:{token}
Value:  { filename, mimeType, maxSize, createdAt }
TTL:    300 seconds (5 minutes)

# Cache: GitHub tree
Key:    github_tree:{branch}:{sha}
Value:  { tree: [...], fetchedAt }
TTL:    300 seconds (5 minutes)

# Cache: Deploy status
Key:    deploy_status:{project}
Value:  { status, url, builtAt }
TTL:    60 seconds (1 minute)
```

---

## 8. API Specification

### 8.1 Authentication Endpoints

#### POST /api/auth/login
Initiate GitHub OAuth flow.

**Request:**
```http
POST /api/auth/login
```

**Response (302 Redirect):**
```http
HTTP/1.1 302 Found
Location: https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...&scope=read:user&state=...
Set-Cookie: xizoa_csrf=<csrf_token>; Secure; SameSite=Strict; Path=/; Max-Age=3600
```

---

#### GET /api/auth/callback
GitHub OAuth callback.

**Request:**
```http
GET /api/auth/callback?code=<github_code>&state=<state>
```

**Response (302 Redirect on success):**
```http
HTTP/1.1 302 Found
Location: /dashboard
Set-Cookie: xizoa_session=<session_id>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400
```

**Response (401 Unauthorized on failure):**
```json
{
  "error": "unauthorized",
  "message": "GitHub account not authorized"
}
```

---

#### GET /api/auth/session
Get current session info.

**Request:**
```http
GET /api/auth/session
Cookie: xizoa_session=<session_id>
```

**Response (200):**
```json
{
  "authenticated": true,
  "user": {
    "id": "12345678",
    "username": "AuroraPriyanshu",
    "avatar": "https://avatars.githubusercontent.com/u/..."
  },
  "expiresAt": "2026-08-11T14:57:00Z"
}
```

---

#### POST /api/auth/logout
Destroy session.

**Request:**
```http
POST /api/auth/logout
Cookie: xizoa_session=<session_id>
X-CSRF-Token: <csrf_token>
```

**Response (200):**
```json
{
  "success": true
}
```

---

### 8.2 Posts Endpoints

#### GET /api/posts
List all posts with pagination.

**Request:**
```http
GET /api/posts?status=draft&page=1&limit=20&search=&category=&tag=
```

**Response (200):**
```json
{
  "posts": [
    {
      "id": "post_001",
      "title": "Building Xizoa CMS",
      "slug": "building-xizoa-cms",
      "excerpt": "A deep dive into building a Git-native CMS...",
      "status": "published",
      "category": "engineering",
      "tags": ["cms", "cloudflare", "github"],
      "featuredImage": "https://cdn.xizoa.com/images/hero.webp",
      "publishedAt": "2026-08-10T10:00:00Z",
      "updatedAt": "2026-08-10T12:00:00Z",
      "githubSha": "abc123..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

#### POST /api/posts
Create a new post (saves to GitHub).

**Request:**
```http
POST /api/posts
Content-Type: application/json
Cookie: xizoa_session=<session_id>
X-CSRF-Token: <csrf_token>

{
  "title": "My New Post",
  "slug": "my-new-post",
  "content": "# Hello World\n\nThis is my post.",
  "excerpt": "A brief summary",
  "category": "tech",
  "tags": ["hello", "world"],
  "featuredImage": "https://cdn.xizoa.com/images/photo.webp",
  "status": "draft",
  "metaTitle": "My New Post | Xizoa",
  "metaDescription": "A great post about..."
}
```

**Response (201):**
```json
{
  "id": "post_002",
  "title": "My New Post",
  "slug": "my-new-post",
  "status": "draft",
  "githubSha": "def456...",
  "createdAt": "2026-08-10T14:57:00Z",
  "url": "https://github.com/AuroraPriyanshu/xizoa-site/blob/main/content/posts/my-new-post.md"
}
```

---

#### GET /api/posts/:slug
Get a single post.

**Response (200):**
```json
{
  "id": "post_001",
  "title": "Building Xizoa CMS",
  "slug": "building-xizoa-cms",
  "content": "# Building Xizoa CMS\n\n...",
  "excerpt": "...",
  "category": "engineering",
  "tags": ["cms", "cloudflare"],
  "featuredImage": "...",
  "status": "published",
  "publishedAt": "2026-08-10T10:00:00Z",
  "metaTitle": "...",
  "metaDescription": "...",
  "readingTime": 5,
  "wordCount": 1200,
  "githubSha": "abc123...",
  "history": [
    { "sha": "abc123...", "message": "Update post", "date": "2026-08-10T12:00:00Z" }
  ]
}
```

---

#### PUT /api/posts/:slug
Update a post.

**Request:**
```http
PUT /api/posts/my-new-post
Content-Type: application/json
Cookie: xizoa_session=<session_id>
X-CSRF-Token: <csrf_token>

{
  "title": "My Updated Post",
  "content": "# Updated Content",
  "status": "published"
}
```

**Response (200):**
```json
{
  "id": "post_002",
  "slug": "my-new-post",
  "githubSha": "ghi789...",
  "updatedAt": "2026-08-10T15:00:00Z"
}
```

---

#### DELETE /api/posts/:slug
Delete a post.

**Response (200):**
```json
{
  "success": true,
  "message": "Post 'my-new-post' deleted"
}
```

---

### 8.3 Media Endpoints

#### POST /api/media/upload
Upload media to R2.

**Request:**
```http
POST /api/media/upload
Content-Type: multipart/form-data
Cookie: xizoa_session=<session_id>
X-CSRF-Token: <csrf_token>

--boundary
Content-Disposition: form-data; name="file"; filename="photo.webp"
Content-Type: image/webp

<binary data>
--boundary
Content-Disposition: form-data; name="folder"

/blog-images/2026-08
--boundary--
```

**Response (201):**
```json
{
  "id": "media_001",
  "filename": "photo.webp",
  "originalName": "photo.webp",
  "mimeType": "image/webp",
  "size": 245760,
  "width": 1920,
  "height": 1080,
  "r2Key": "blog-images/2026-08/photo.webp",
  "r2Url": "https://<account>.r2.cloudflarestorage.com/blog-images/2026-08/photo.webp",
  "cdnUrl": "https://cdn.xizoa.com/blog-images/2026-08/photo.webp",
  "folder": "/blog-images/2026-08",
  "uploadedAt": "2026-08-10T14:57:00Z"
}
```

---

#### GET /api/media
List media with pagination.

**Request:**
```http
GET /api/media?folder=/blog-images&page=1&limit=50&search=hero
```

**Response (200):**
```json
{
  "media": [
    {
      "id": "media_001",
      "filename": "photo.webp",
      "mimeType": "image/webp",
      "size": 245760,
      "width": 1920,
      "height": 1080,
      "cdnUrl": "https://cdn.xizoa.com/blog-images/2026-08/photo.webp",
      "folder": "/blog-images/2026-08",
      "uploadedAt": "2026-08-10T14:57:00Z"
    }
  ],
  "folders": ["/blog-images/2026-08", "/blog-images/2026-07"],
  "pagination": { "page": 1, "limit": 50, "total": 128 }
}
```

---

#### DELETE /api/media/:id
Delete media from R2 and metadata from D1.

**Response (200):**
```json
{
  "success": true,
  "deleted": {
    "id": "media_001",
    "r2Key": "blog-images/2026-08/photo.webp"
  }
}
```

---

### 8.4 Deploy Endpoints

#### GET /api/deploy/status
Get latest deploy status.

**Response (200):**
```json
{
  "status": "success",
  "url": "https://xizoa.pages.dev",
  "buildTime": "45s",
  "commit": {
    "sha": "abc123...",
    "message": "Publish: Building Xizoa CMS",
    "author": "AuroraPriyanshu",
    "date": "2026-08-10T14:57:00Z"
  },
  "deployedAt": "2026-08-10T14:58:00Z"
}
```

---

#### POST /api/deploy/trigger
Manually trigger a deploy.

**Response (202):**
```json
{
  "success": true,
  "message": "Deployment triggered",
  "deploymentId": "dep_001"
}
```

---

### 8.5 Standard Error Responses

```json
// 400 Bad Request
{
  "error": "bad_request",
  "message": "Invalid input",
  "details": [
    { "field": "slug", "message": "Slug must contain only lowercase letters, numbers, and hyphens" }
  ]
}

// 401 Unauthorized
{
  "error": "unauthorized",
  "message": "Session expired or invalid"
}

// 403 Forbidden
{
  "error": "forbidden",
  "message": "CSRF token mismatch"
}

// 429 Too Many Requests
{
  "error": "rate_limited",
  "message": "Too many requests",
  "retryAfter": 60
}

// 500 Internal Server Error
{
  "error": "internal_error",
  "message": "An unexpected error occurred",
  "requestId": "req_abc123"
}
```

---

## 9. GitHub Integration

### 9.1 GitHub Content Model

```
<repo>/
├── content/
│   ├── posts/
│   │   ├── 2026-08-10-building-xizoa-cms.md
│   │   └── 2026-08-05-hello-world.md
│   └── pages/
│       ├── about.md
│       └── now.md
├── static/
│   └── images/          # Referenced in posts, stored in R2
├── data/
│   └── categories.json
└── config.yml
```

### 9.2 Markdown File Format

```markdown
---
title: "Building Xizoa CMS"
slug: "building-xizoa-cms"
date: "2026-08-10T10:00:00Z"
updated: "2026-08-10T12:00:00Z"
category: "engineering"
tags: ["cms", "cloudflare", "github", "architecture"]
featured_image: "https://cdn.xizoa.com/images/xizoa-architecture.webp"
excerpt: "A deep dive into building a Git-native CMS on Cloudflare."
meta_title: "Building Xizoa CMS - Architecture Deep Dive"
meta_description: "How I built a production-grade CMS using Cloudflare Pages, Functions, R2, D1, and KV with GitHub as the content source of truth."
canonical_url: "https://xizoa.com/building-xizoa-cms"
author: "AuroraPriyanshu"
reading_time: 12
word_count: 2450
---

# Building Xizoa CMS

Content starts here...
```

### 9.3 GitHub API Operations

```typescript
// GitHub Service Interface
interface GitHubService {
  // Content operations
  createFile(path: string, content: string, message: string): Promise<GitCommit>;
  updateFile(path: string, content: string, sha: string, message: string): Promise<GitCommit>;
  deleteFile(path: string, sha: string, message: string): Promise<GitCommit>;
  getFile(path: string, ref?: string): Promise<GitFile>;
  getTree(ref?: string, recursive?: boolean): Promise<GitTree>;

  // Commit history
  getCommits(path?: string, perPage?: number): Promise<GitCommit[]>;
  getCommit(sha: string): Promise<GitCommit>;

  // Branch operations
  createBranch(name: string, fromRef: string): Promise<GitRef>;
  getBranch(name: string): Promise<GitBranch>;

  // Preview
  createPreviewBranch(slug: string): Promise<string>;
  deletePreviewBranch(name: string): Promise<void>;
}
```

### 9.4 Commit Strategy

```typescript
// Every content change creates a commit with structured message
function generateCommitMessage(action: 'create' | 'update' | 'delete', type: 'post' | 'page', slug: string): string {
  const timestamp = new Date().toISOString();
  switch (action) {
    case 'create':
      return `[CMS] Create ${type}: ${slug} at ${timestamp}`;
    case 'update':
      return `[CMS] Update ${type}: ${slug} at ${timestamp}`;
    case 'delete':
      return `[CMS] Delete ${type}: ${slug} at ${timestamp}`;
  }
}

// Author metadata
const COMMIT_AUTHOR = {
  name: 'Xizoa CMS',
  email: 'cms@xizoa.com',
};
```

### 9.5 Rollback Support

```typescript
// Rollback to a specific commit
async function rollbackToCommit(path: string, targetSha: string): Promise<GitCommit> {
  // 1. Fetch the file content at target commit
  const fileAtCommit = await github.getFile(path, targetSha);

  // 2. Get current file SHA for update
  const currentFile = await github.getFile(path);

  // 3. Update file with old content
  return await github.updateFile(
    path,
    fileAtCommit.content,
    currentFile.sha,
    `[CMS] Rollback ${path} to ${targetSha.substring(0, 7)}`
  );
}
```

---

## 10. Cloudflare Integration

### 10.1 Pages Deployment

```typescript
interface PagesService {
  // Get deployment status
  getDeploymentStatus(project: string): Promise<DeployStatus>;

  // Trigger new deployment (via GitHub webhook or direct API)
  triggerDeployment(project: string): Promise<{ id: string }>;

  // Get build logs
  getBuildLogs(project: string, deploymentId: string): Promise<string[]>;

  // Purge cache
  purgeCache(zoneId: string, urls?: string[]): Promise<void>;
}
```

### 10.2 R2 Media Storage

```typescript
interface R2Service {
  // Upload with metadata
  upload(key: string, body: ReadableStream, metadata: R2Metadata): Promise<R2Object>;

  // Get object
  get(key: string): Promise<R2Object | null>;

  // Delete object
  delete(key: string): Promise<void>;

  // List objects in folder
  list(prefix: string, limit?: number, cursor?: string): Promise<R2ListResult>;

  // Generate public URL (via custom domain + Cloudflare Images)
  getPublicUrl(key: string, options?: ImageOptions): string;
}

// Image optimization via Cloudflare Images
function getOptimizedUrl(cdnUrl: string, options: ImageOptions): string {
  const params = new URLSearchParams();
  if (options.width) params.set('width', String(options.width));
  if (options.height) params.set('height', String(options.height));
  if (options.quality) params.set('quality', String(options.quality));
  if (options.format) params.set('format', options.format);
  return `${cdnUrl}/cdn-cgi/image/${params.toString().replace(/&/g, ',')}/${key}`;
}
```

### 10.3 D1 Database Access

```typescript
// D1 binding in Cloudflare Functions
interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  KV_SESSIONS: KVNamespace;
  KV_RATE_LIMIT: KVNamespace;
}

// Example query
async function getDraftBySlug(db: D1Database, slug: string): Promise<Draft | null> {
  const result = await db
    .prepare('SELECT * FROM drafts WHERE slug = ?')
    .bind(slug)
    .first<Draft>();
  return result;
}
```

---

## 11. Content System

### 11.1 Content Types

| Type | Storage | Description |
|------|---------|-------------|
| **Post** | GitHub Markdown | Blog articles with frontmatter |
| **Page** | GitHub Markdown | Static pages (About, Now, etc.) |
| **Draft** | D1 + GitHub | In-progress content |
| **Scheduled** | D1 publish_queue | Future-published content |

### 11.2 Content Lifecycle

```
+---------+    Save    +---------+   Publish   +---------+   Build   +---------+
|  Editor |----------->|  Draft  |----------->|  GitHub |--------->|   Live  |
|         |            |   (D1)  |            | (Markdown)|        |  Site   |
+---------+            +----+----+            +---------+          +---------+
                            |
                            | Schedule
                            v
                       +---------+
                       | Publish |
                       |  Queue  |
                       |  (D1)   |
                       +---------+
```

### 11.3 Frontmatter Generation

```typescript
function generateFrontmatter(post: Post): string {
  const fm = {
    title: post.title,
    slug: post.slug,
    date: post.publishedAt,
    updated: post.updatedAt,
    category: post.category,
    tags: post.tags,
    featured_image: post.featuredImage,
    excerpt: post.excerpt,
    meta_title: post.metaTitle || post.title,
    meta_description: post.metaDescription,
    canonical_url: post.canonicalUrl,
    author: post.author,
    reading_time: calculateReadingTime(post.content),
    word_count: countWords(post.content),
  };

  return `---\n${yaml.stringify(fm)}---\n\n${post.content}`;
}
```

### 11.4 SEO Metadata

```typescript
interface SEOMetadata {
  // Basic
  title: string;
  description: string;
  canonical: string;

  // Open Graph
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: 'article' | 'website';
  ogUrl: string;

  // Twitter Cards
  twitterCard: 'summary_large_image';
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;

  // JSON-LD
  jsonLd: {
    '@context': 'https://schema.org';
    '@type': 'BlogPosting';
    headline: string;
    description: string;
    author: { '@type': 'Person'; name: string };
    datePublished: string;
    dateModified: string;
    image: string;
    url: string;
  };
}
```

---

## 12. Editor Design

### 12.1 Editor Architecture

```
+-----------------------------------------------------------------+
|                         Editor Layout                            |
+--------------------------+--------------------------------------+
|      Toolbar             |         Preview Panel                |
|  +------------------+    |    +----------------------------+   |
|  | B I U H1 H2 Link |    |    |      Rendered Markdown     |   |
|  | Image Code Table |    |    |                            |   |
|  +------------------+    |    |      Live preview with       |   |
|                          |    |      syntax highlighting     |   |
|  +------------------+    |    |                            |   |
|  |                  |    |    +----------------------------+   |
|  |   CodeMirror 6   |    |                                     |
|  |   (Markdown)     |    |    +----------------------------+   |
|  |                  |    |    |      Frontmatter Panel     |   |
|  |  # Hello World   |    |    |  Title, Slug, Category,    |   |
|  |                  |    |    |  Tags, SEO, Featured Image |   |
|  +------------------+    |    +----------------------------+   |
|                          |                                     |
|  Status: 1,200 words     |    Auto-save: 2 min ago             |
|  Reading time: 5 min     |    Last saved: 14:57                |
+--------------------------+--------------------------------------+
```

### 12.2 Editor Features

| Feature | Implementation |
|---------|---------------|
| **Markdown Mode** | CodeMirror 6 with Markdown language support |
| **Rich Mode** | ProseMirror or Milkdown (WYSIWYM) |
| **Live Preview** | Split pane: remark -> rehype -> React render |
| **Syntax Highlighting** | rehype-highlight (Prism.js) |
| **Auto-save** | Debounced (5s) -> Save to D1 draft table |
| **Draft Recovery** | On load, check D1 for unsaved draft with same slug |
| **Word Count** | Real-time counter via regex `/\S+/g` |
| **Reading Time** | `wordCount / 200` (adjustable in settings) |
| **Image Drag-Drop** | Drop zone -> Upload to R2 -> Insert Markdown image tag |
| **Keyboard Shortcuts** | `Ctrl+S` = Save, `Ctrl+P` = Preview, `Ctrl+K` = Command Palette |
| **Command Palette** | `Cmd+K` fuzzy search for actions |
| **Dark Mode** | Tailwind `dark:` classes + localStorage preference |

### 12.3 Auto-save Strategy

```typescript
// Auto-save flow
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds
const DEBOUNCE_DELAY = 1000;     // 1 second after typing stops

// 1. User types -> debounce
// 2. After debounce -> save to D1 (drafts table)
// 3. Show "Saving..." -> "Saved at 14:57"
// 4. On explicit Save -> commit to GitHub

interface AutoSaveState {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;
  dirty: boolean;
  contentHash: string; // For conflict detection
}
```

---

## 13. Media Library

### 13.1 Media Architecture

```
+-------------------------------------------------------------+
|                      Media Library                           |
+-------------------------------------------------------------+
|  Upload Zone | Search: [__________] | Filter: [All v]       |
+-------------------------------------------------------------+
|  Folders:                                                   |
|  [ ] /blog-images/2026-08  (24)                            |
|  [ ] /blog-images/2026-07  (18)                            |
|  [ ] /assets               (42)                            |
+-------------------------------------------------------------+
|  +---------+ +---------+ +---------+ +---------+           |
|  | [img]   | | [img]   | | [img]   | | [img]   |           |
|  | hero    | | setup   | | arch    | | deploy  |           |
|  | 245 KB  | | 189 KB  | | 512 KB  | | 120 KB  |           |
|  | 1920x1080| | 1200x800| | 2400x1600| | 800x600|          |
|  +---------+ +---------+ +---------+ +---------+           |
+-------------------------------------------------------------+
|  Selected: 0 | Bulk: [Delete] [Move] [Download]             |
+-------------------------------------------------------------+
```

### 13.2 Media API

```typescript
interface MediaService {
  upload(file: File, folder: string): Promise<MediaItem>;
  delete(id: string): Promise<void>;
  rename(id: string, newName: string): Promise<MediaItem>;
  move(id: string, newFolder: string): Promise<MediaItem>;
  list(options: ListOptions): Promise<Paginated<MediaItem>>;
  search(query: string): Promise<MediaItem[]>;
  getFolders(): Promise<string[]>;
  bulkDelete(ids: string[]): Promise<BulkResult>;
  bulkMove(ids: string[], folder: string): Promise<BulkResult>;
}
```

### 13.3 Image Optimization

```typescript
// Cloudflare Images integration
function getOptimizedImageUrl(baseUrl: string, options: ImageOptions): string {
  // Format: /cdn-cgi/image/width=800,height=600,quality=85,format=auto/path
  const opts = [
    options.width && `width=${options.width}`,
    options.height && `height=${options.height}`,
    options.quality && `quality=${options.quality}`,
    options.format && `format=${options.format}`,
    'fit=scale-down',
  ].filter(Boolean).join(',');

  return `${baseUrl}/cdn-cgi/image/${opts}/${options.path}`;
}

// Preset sizes
const IMAGE_PRESETS = {
  thumbnail: { width: 300, height: 200, quality: 80 },
  medium: { width: 800, quality: 85 },
  large: { width: 1200, quality: 90 },
  hero: { width: 1920, quality: 85 },
};
```

---

## 14. Dashboard

### 14.1 Dashboard Layout

```
+-----------------------------------------------------------------+
|  Xizoa CMS                              [Search] [User v]        |
+----------+------------------------------------------------------+
|          |  Welcome back, AuroraPriyanshu                       |
|  Dash    |                                                       |
|  Posts   |  +----------+ +----------+ +----------+ +----------+ |
|  Pages   |  |  42      | |  3       | |  128     | |  15s     | |
|  Media   |  |  Posts   | |  Drafts  | |  Media   | |  Build   | |
|  Deploy  |  |  Total   | |  Pending | |  Files   | |  Time    | |
|  Settings|  +----------+ +----------+ +----------+ +----------+ |
|          |                                                       |
|          |  +------------------+  +-------------------------+    |
|          |  | Recent Posts     |  | Deploy Status           |    |
|          |  | - Building...    |  | [green] Live            |    |
|          |  | - Hello World    |  | Commit: abc1234         |    |
|          |  | - Architecture   |  | Deployed: 2 min ago     |    |
|          |  +------------------+  +-------------------------+    |
|          |                                                       |
|          |  +------------------+  +-------------------------+    |
|          |  | Recent Commits   |  | Storage Usage           |    |
|          |  | - Update post    |  | R2: 45 MB / 1 GB        |    |
|          |  | - Add image      |  | D1: 2,400 rows          |    |
|          |  | - Fix typo       |  | KV: 18 keys             |    |
|          |  +------------------+  +-------------------------+    |
|          |                                                       |
|          |  [+ Quick Publish]  [Trigger Deploy]                 |
+----------+------------------------------------------------------+
```

### 14.2 Dashboard Widgets

| Widget | Data Source | Refresh |
|--------|------------|---------|
| **Stat Cards** | D1 counts | On load |
| **Recent Posts** | GitHub API (last 5 commits) | On load |
| **Drafts** | D1 `drafts` table | On load |
| **Deploy Status** | Cloudflare Pages API | 30s polling |
| **Git Commits** | GitHub API | 60s polling |
| **Storage Usage** | R2 list + D1 info | On load |
| **Analytics** | Cloudflare Analytics API | 5 min polling |
| **Quick Publish** | D1 drafts -> GitHub commit | Manual |

---

## 15. Deployment Pipeline

### 15.1 Publishing Flow

```
+--------+     +--------+     +--------+     +--------+     +--------+
| Editor | --> | Draft  | --> | GitHub | --> | Build  | --> |  Live  |
|        |     | (D1)   |     | Commit |     | (Pages)|     |  Site  |
+--------+     +--------+     +--------+     +--------+     +--------+
    |              |              |              |              |
    v              v              v              v              v
+--------+     +--------+     +--------+     +--------+     +--------+
| Auto   |     | Preview|     | Commit |     | Build  |     | Cache  |
| Save   |     | Branch |     | Msg    |     | Hook   |     | Purge  |
| (5s)   |     | (opt)  |     | [CMS]  |     | Pages  |     | Cloud  |
+--------+     +--------+     +--------+     +--------+     +--------+
```

### 15.2 Pipeline Stages

| Stage | Trigger | Action | Duration |
|-------|---------|--------|----------|
| **1. Editor Save** | Auto-save (5s debounce) | Persist to D1 drafts table | < 100ms |
| **2. Explicit Publish** | User clicks "Publish" | Validate -> Generate frontmatter -> Commit to GitHub | 1-3s |
| **3. GitHub Webhook** | Push to main branch | Trigger Cloudflare Pages build | Instant |
| **4. Build** | Pages build environment | Run static site generator (Hugo/11ty/Astro) | 30-60s |
| **5. Deploy** | Build success | Deploy to Cloudflare edge | 5-10s |
| **6. Cache Purge** | Deploy complete | Purge CDN cache for updated content | 1-5s |

### 15.3 Scheduled Publishing

```typescript
// Cron trigger (Cloudflare Workers Cron)
export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    // Run every minute
    const pending = await db
      .prepare('SELECT * FROM publish_queue WHERE status = ? AND scheduled_at <= ?')
      .bind('pending', Date.now())
      .all<PublishQueueItem>();

    for (const item of pending.results) {
      try {
        // 1. Get draft
        const draft = await getDraftBySlug(db, item.draft_id);
        // 2. Commit to GitHub
        await publishDraft(draft);
        // 3. Update queue status
        await db.prepare('UPDATE publish_queue SET status = ?, processed_at = ? WHERE id = ?')
          .bind('completed', Date.now(), item.id)
          .run();
      } catch (error) {
        await db.prepare('UPDATE publish_queue SET status = ?, error_message = ? WHERE id = ?')
          .bind('failed', error.message, item.id)
          .run();
      }
    }
  },
};
```

---

## 16. Environment Variables & Secret Management

### 16.1 Environment Variables Table

| Variable | Type | Secret | Description |
|----------|------|--------|-------------|
| `GITHUB_CLIENT_ID` | Secret | **YES** | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | Secret | **YES** | GitHub OAuth app client secret |
| `GITHUB_ALLOWED_USER` | Config | NO | GitHub username allowed to login (e.g., `AuroraPriyanshu`) |
| `GITHUB_REPO_OWNER` | Config | NO | GitHub repository owner |
| `GITHUB_REPO_NAME` | Config | NO | GitHub repository name |
| `GITHUB_BRANCH` | Config | NO | Default branch (e.g., `main`) |
| `GITHUB_TOKEN` | Secret | **YES** | GitHub personal access token for API calls |
| `CLOUDFLARE_ACCOUNT_ID` | Config | NO | Cloudflare account ID |
| `CLOUDFLARE_API_TOKEN` | Secret | **YES** | Cloudflare API token for Pages/R2/D1 management |
| `CLOUDFLARE_PAGES_PROJECT` | Config | NO | Cloudflare Pages project name |
| `R2_BUCKET` | Config | NO | R2 bucket name for media storage |
| `SESSION_SECRET` | Secret | **YES** | Key for signing session cookies (32+ bytes) |
| `CSRF_SECRET` | Secret | **YES** | Key for signing CSRF tokens (32+ bytes) |
| `ENCRYPTION_KEY` | Secret | **YES** | Key for encrypting sensitive data at rest (32 bytes) |

### 16.2 Secret Classification

**Why each is a secret:**

- **GITHUB_CLIENT_SECRET**: If leaked, attackers can impersonate your OAuth app
- **GITHUB_TOKEN**: Grants write access to your repository; full content control
- **CLOUDFLARE_API_TOKEN**: Grants access to modify Pages, R2, D1, KV resources
- **SESSION_SECRET**: If leaked, attackers can forge valid session cookies
- **CSRF_SECRET**: If leaked, attackers can forge CSRF tokens
- **ENCRYPTION_KEY**: If leaked, encrypted data in D1 is compromised

### 16.3 Management Strategy

```
+-------------------------------------------------------------+
|              Secret Management Strategy                      |
+-------------------------------------------------------------+
|                                                             |
|  1. Store ONLY in Cloudflare environment variables           |
|     - Never commit to GitHub                                |
|     - Never log to console                                  |
|     - Never return in API responses                         |
|                                                             |
|  2. Use wrangler.toml for non-secrets only:                 |
|     [vars]                                                  |
|     GITHUB_ALLOWED_USER = "AuroraPriyanshu"                 |
|                                                             |
|  3. Use wrangler secret for secrets:                        |
|     wrangler secret put GITHUB_CLIENT_SECRET                |
|                                                             |
|  4. Rotate secrets quarterly:                               |
|     - Generate new SESSION_SECRET                           |
|     - Invalidate all sessions (force re-login)              |
|     - Update GITHUB_TOKEN with new PAT                      |
|                                                             |
|  5. Backup recovery:                                        |
|     - Keep encrypted backup of all secrets in 1Password     |
|     - Document rotation procedure in runbook                |
|                                                             |
+-------------------------------------------------------------+
```

---

## 17. Monitoring & Audit

### 17.1 Audit Log Events

| Action | Resource | Details | Severity |
|--------|----------|---------|----------|
| `login_success` | auth | { ip, userAgent } | Info |
| `login_failed` | auth | { ip, reason } | Warning |
| `logout` | auth | { ip } | Info |
| `session_expired` | auth | { ip } | Info |
| `post_created` | post | { slug, title } | Info |
| `post_updated` | post | { slug, changes } | Info |
| `post_deleted` | post | { slug } | Warning |
| `post_published` | post | { slug, commitSha } | Info |
| `media_uploaded` | media | { id, filename, size } | Info |
| `media_deleted` | media | { id, filename } | Warning |
| `deploy_triggered` | deploy | { triggeredBy } | Info |
| `deploy_failed` | deploy | { error, commit } | Error |
| `settings_updated` | settings | { key, oldValue, newValue } | Warning |
| `rate_limit_exceeded` | api | { endpoint, ip } | Warning |
| `csrf_failed` | auth | { ip, endpoint } | Error |

### 17.2 Error Logging

```typescript
// Structured error logging
interface ErrorLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'fatal';
  requestId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  error: {
    type: string;
    message: string;
    stack?: string;
  };
  context: {
    userId?: string;
    ipHash: string;
    userAgent: string;
  };
}

// Log to D1 for persistence, with 90-day retention
async function logError(env: Env, error: ErrorLog): Promise<void> {
  await env.DB.prepare(`
    INSERT INTO error_logs (id, timestamp, level, request_id, endpoint, 
      method, status_code, error_type, error_message, user_id, ip_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    error.timestamp,
    error.level,
    error.requestId,
    error.endpoint,
    error.method,
    error.statusCode,
    error.error.type,
    error.error.message,
    error.context.userId,
    error.context.ipHash
  ).run();
}
```

### 17.3 Alerting Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Failed logins | > 5 in 5 min | Temporarily block IP (30 min) |
| Rate limit hits | > 10 in 1 min | Block IP (1 hour) |
| Deploy failures | > 2 consecutive | Alert via email/webhook |
| 500 errors | > 5 in 1 min | Investigate immediately |
| GitHub API errors | > 10 in 1 min | Check token validity |

---

## 18. Backup & Disaster Recovery

### 18.1 Git-Based Backup

```
+-------------------------------------------------------------+
|              Git-Based Content Backup                        |
+-------------------------------------------------------------+
|                                                             |
|  Source: GitHub repository (content/posts, content/pages)   |
|  Frequency: Real-time (every commit)                        |
|  Method: Git history is immutable backup                    |
|  Recovery: `git checkout <commit>` or GitHub UI restore     |
|                                                             |
|  Additional: Mirror to secondary GitHub repo weekly          |
|  `git push --mirror backup:xizoa-site-backup`               |
|                                                             |
+-------------------------------------------------------------+
```

### 18.2 R2 Backup

```
+-------------------------------------------------------------+
|              R2 Media Backup                                 |
+-------------------------------------------------------------+
|                                                             |
|  Source: Cloudflare R2 bucket                               |
|  Frequency: Weekly incremental                              |
|  Method: rclone sync to secondary R2 bucket or S3           |
|  Retention: 30 days of versions                             |
|                                                             |
|  Command:                                                   |
|  rclone sync r2:xizoa-media r2:xizoa-media-backup           |
|                                                             |
+-------------------------------------------------------------+
```

### 18.3 D1 Export Strategy

```bash
# Daily D1 export via wrangler
wrangler d1 export xizoa-db --output=backup-$(date +%Y%m%d).sql

# Store exports in R2 backup bucket
wrangler r2 object put xizoa-backups/d1/backup-$(date +%Y%m%d).sql --file=backup-$(date +%Y%m%d).sql

# Retention: Keep 30 daily backups, 12 monthly backups
```

### 18.4 Disaster Recovery Plan

| Scenario | Impact | Recovery Time | Procedure |
|----------|--------|--------------|-----------|
| **GitHub repo deleted** | Content lost | 1 hour | Restore from local clone or secondary mirror |
| **R2 bucket corrupted** | Media lost | 2 hours | Restore from backup bucket |
| **D1 database lost** | Metadata lost | 30 min | Restore from latest SQL export |
| **KV data lost** | Sessions lost | Immediate | Users re-login; no data loss |
| **Cloudflare account compromised** | Full system | 4 hours | Rotate all secrets, audit logs, restore from backups |
| **GitHub token leaked** | Repo access | 15 min | Revoke token, generate new PAT, update env var |

### 18.5 Secret Rotation Strategy

```
+-------------------------------------------------------------+
|              Secret Rotation Schedule                        |
+-------------------------------------------------------------+
|                                                             |
|  Quarterly Rotation:                                        |
|  1. Generate new SESSION_SECRET                             |
|  2. Generate new CSRF_SECRET                                |
|  3. Generate new ENCRYPTION_KEY (re-encrypt data)           |
|  4. Update Cloudflare env vars                              |
|  5. Force all users to re-login (clear KV sessions)         |
|                                                             |
|  On Demand:                                                 |
|  - Immediately after any suspicion of leakage               |
|  - After employee/contractor offboarding                    |
|  - After security incident                                  |
|                                                             |
|  GitHub Token:                                              |
|  - Rotate every 90 days                                     |
|  - Use fine-grained PAT with minimal scopes                 |
|  - Monitor GitHub Security tab for anomalies                |
|                                                             |
+-------------------------------------------------------------+
```

---

## 19. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal:** Basic auth + GitHub integration + simple post CRUD

| Task | Effort | Deliverable |
|------|--------|-------------|
| Set up Cloudflare project (Pages, Functions, R2, D1, KV) | 2h | Working project shell |
| Implement GitHub OAuth flow | 4h | Login/logout working |
| Create D1 schema | 2h | Database ready |
| Build middleware (auth, CSRF, rate limit, headers) | 6h | Secure API foundation |
| Implement GitHub file CRUD | 6h | Create/update/delete posts in repo |
| Build basic React dashboard | 8h | Working UI shell |
| Create Markdown editor | 6h | Basic editing working |
| **Total** | **~34h** | **MVP: Write, edit, publish posts** |

### Phase 2: Content System (Week 3)

**Goal:** Full content management with drafts, pages, SEO

| Task | Effort | Deliverable |
|------|--------|-------------|
| Draft auto-save to D1 | 4h | Auto-save working |
| Draft recovery | 2h | Unsaved drafts recovered |
| Pages support | 3h | Static pages managed |
| Frontmatter generation | 3h | Proper Markdown files |
| SEO metadata (OG, Twitter, JSON-LD) | 4h | Rich meta tags |
| Categories & tags | 3h | Taxonomy system |
| Scheduled publishing | 4h | Cron-based publishing |
| **Total** | **~23h** | **Full content system** |

### Phase 3: Media & Polish (Week 4)

**Goal:** Media library, image optimization, editor polish

| Task | Effort | Deliverable |
|------|--------|-------------|
| R2 upload/download/delete | 4h | Media API working |
| Media library UI | 6h | Grid, folders, search |
| Image drag-drop in editor | 3h | Drag images into posts |
| Cloudflare Images optimization | 3h | Auto-resized images |
| Rich editor mode | 6h | WYSIWYG option |
| Command palette | 3h | Quick actions |
| Keyboard shortcuts | 2h | Power user features |
| Dark mode | 2h | Theme toggle |
| **Total** | **~29h** | **Polished editor + media** |

### Phase 4: DevOps & Monitoring (Week 5)

**Goal:** Deployment pipeline, analytics, monitoring

| Task | Effort | Deliverable |
|------|--------|-------------|
| Deploy status dashboard | 3h | Build status visible |
| Manual deploy trigger | 2h | Force rebuild button |
| Cache purge integration | 2h | CDN invalidation |
| Cloudflare analytics | 3h | Traffic stats |
| Audit logging | 4h | Full event log |
| Error tracking | 3h | Error dashboard |
| Backup automation | 3h | Daily D1 export |
| **Total** | **~20h** | **Production-ready ops** |

### Phase 5: Hardening (Week 6)

**Goal:** Security audit, performance, documentation

| Task | Effort | Deliverable |
|------|--------|-------------|
| Security audit (all threat model items) | 6h | Hardened system |
| CSP policy refinement | 2h | Strict CSP |
| Performance optimization | 4h | Fast load times |
| Documentation | 4h | README, API docs |
| Secret rotation procedure | 2h | Documented runbook |
| Penetration testing (self) | 4h | No critical issues |
| **Total** | **~22h** | **Production launch** |

### Summary

| Phase | Duration | Cumulative Effort |
|-------|----------|-------------------|
| Foundation | 2 weeks | ~34h |
| Content System | 1 week | ~57h |
| Media & Polish | 1 week | ~86h |
| DevOps & Monitoring | 1 week | ~106h |
| Hardening | 1 week | ~128h |

**Total estimated effort: ~128 hours (6 weeks at ~20h/week)**

---

## Appendix A: Middleware Chain

```typescript
// functions/_middleware.ts
import { Hono } from 'hono';
import { securityHeaders } from '../middleware/security-headers';
import { requestLogging } from '../middleware/request-logging';
import { rateLimit } from '../middleware/rate-limit';
import { csrfProtection } from '../middleware/csrf';
import { authMiddleware } from '../middleware/auth';
import { errorHandler } from '../middleware/error-handler';

const app = new Hono();

// Global middleware (applied to all routes)
app.use('*', errorHandler);
app.use('*', requestLogging);
app.use('*', securityHeaders);
app.use('*', rateLimit({ endpoint: 'api' }));

// Auth-required routes
app.use('/api/posts/*', authMiddleware);
app.use('/api/pages/*', authMiddleware);
app.use('/api/media/*', authMiddleware);
app.use('/api/deploy/*', authMiddleware);
app.use('/api/github/*', authMiddleware);
app.use('/api/settings/*', authMiddleware);

// CSRF for mutating routes
app.use('/api/posts/*', csrfProtection);
app.use('/api/pages/*', csrfProtection);
app.use('/api/media/*', csrfProtection);
app.use('/api/deploy/*', csrfProtection);
app.use('/api/settings/*', csrfProtection);

export default app;
```

## Appendix B: wrangler.toml

```toml
name = "xizoa-cms"
main = "functions/_middleware.ts"
compatibility_date = "2026-08-10"
compatibility_flags = ["nodejs_compat"]

[site]
bucket = "./frontend/dist"

[[d1_databases]]
binding = "DB"
database_name = "xizoa-db"
database_id = "your-d1-database-id"

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "xizoa-media"

[[kv_namespaces]]
binding = "KV_SESSIONS"
id = "your-kv-namespace-id"

[[kv_namespaces]]
binding = "KV_RATE_LIMIT"
id = "your-kv-rate-limit-id"

[vars]
GITHUB_ALLOWED_USER = "AuroraPriyanshu"
GITHUB_REPO_OWNER = "AuroraPriyanshu"
GITHUB_REPO_NAME = "xizoa-site"
GITHUB_BRANCH = "main"
CLOUDFLARE_ACCOUNT_ID = "your-account-id"
CLOUDFLARE_PAGES_PROJECT = "xizoa"
R2_BUCKET = "xizoa-media"

# Secrets (set via `wrangler secret put`):
# GITHUB_CLIENT_ID
# GITHUB_CLIENT_SECRET
# GITHUB_TOKEN
# CLOUDFLARE_API_TOKEN
# SESSION_SECRET
# CSRF_SECRET
# ENCRYPTION_KEY

[triggers]
crons = ["* * * * *"]  # Every minute for publish queue
```

## Appendix C: Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **GitHub as content source of truth** | Immutable history, free backup, familiar format, works with any static generator |
| **D1 for drafts, not content** | Drafts change frequently; Git commits for every keystroke would be noisy |
| **KV for sessions, not D1** | KV has better TTL support and faster reads for session validation |
| **Single-user only** | Simplifies auth model, no roles/permissions complexity, no multi-tenancy |
| **Hono over raw Workers** | Cleaner routing, middleware support, TypeScript-friendly |
| **R2 over Git LFS for media** | Better CDN integration, cheaper for large files, direct image optimization |
| **Cloudflare Images over raw R2** | Automatic format conversion, resizing, WebP/AVIF support |
| **Separate static site** | CMS dashboard and public site can have different build processes |
| **No database for published content** | Git history IS the database; no sync issues, no data drift |

---

*End of Architecture Document*
