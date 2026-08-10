-- ============================================
-- Migration 003: Add composite index for publish queue
-- ============================================

CREATE INDEX IF NOT EXISTS idx_queue_status_scheduled 
ON publish_queue(status, scheduled_at) 
WHERE status = 'pending';
