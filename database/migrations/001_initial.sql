-- ============================================
-- Xizoa CMS D1 Schema - Initial Migration
-- Run: wrangler d1 execute xizoa-db --file=./database/migrations/001_initial.sql
-- ============================================

-- Sessions: Backup log (primary storage is KV)
CREATE TABLE IF NOT EXISTS sessions (
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

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Drafts: In-progress content (published content goes to GitHub)
CREATE TABLE IF NOT EXISTS drafts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL DEFAULT '',
    excerpt TEXT,
    category TEXT,
    tags TEXT DEFAULT '[]',
    featured_image TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
    meta_title TEXT,
    meta_description TEXT,
    published_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    github_sha TEXT,
    type TEXT NOT NULL DEFAULT 'post' CHECK (type IN ('post', 'page'))
);

CREATE INDEX IF NOT EXISTS idx_drafts_status ON drafts(status);
CREATE INDEX IF NOT EXISTS idx_drafts_slug ON drafts(slug);
CREATE INDEX IF NOT EXISTS idx_drafts_type ON drafts(type);
CREATE INDEX IF NOT EXISTS idx_drafts_updated ON drafts(updated_at);

-- Media Metadata: R2 object metadata
CREATE TABLE IF NOT EXISTS media_metadata (
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
    metadata TEXT DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_media_folder ON media_metadata(folder);
CREATE INDEX IF NOT EXISTS idx_media_uploaded ON media_metadata(uploaded_at);

-- Publish Queue: Scheduled publishing
CREATE TABLE IF NOT EXISTS publish_queue (
    id TEXT PRIMARY KEY,
    draft_id TEXT NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
    scheduled_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processed_at INTEGER,
    error_message TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_queue_scheduled ON publish_queue(scheduled_at, status);
CREATE INDEX IF NOT EXISTS idx_queue_draft ON publish_queue(draft_id);

-- Audit Logs: Immutable event log
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    user_id TEXT,
    ip_hash TEXT NOT NULL,
    user_agent TEXT,
    details TEXT DEFAULT '{}',
    success INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);

-- Settings: Key-value configuration
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
