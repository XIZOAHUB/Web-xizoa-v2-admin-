-- ============================================
-- Migration 002: Add error logs table
-- ============================================

CREATE TABLE IF NOT EXISTS error_logs (
    id TEXT PRIMARY KEY,
    timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
    level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'fatal')),
    request_id TEXT,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    user_id TEXT,
    ip_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_error_timestamp ON error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_endpoint ON error_logs(endpoint);
