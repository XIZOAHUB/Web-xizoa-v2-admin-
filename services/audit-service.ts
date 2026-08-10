/**
 * Audit logging service
 * Logs all actions to D1 for compliance and debugging
 */

import type { D1Database } from "@cloudflare/workers-types";
import type { AuditLogEntry } from "../types/api";
import { generateId } from "../utils/string";

export interface AuditService {
  log(action: string, resource: string, details: {
    resourceId?: string;
    userId?: string;
    ipHash: string;
    userAgent: string;
    metadata?: Record<string, unknown>;
    success?: boolean;
  }): Promise<void>;

  getRecent(limit?: number): Promise<AuditLogEntry[]>;
  getByResource(resource: string, resourceId?: string): Promise<AuditLogEntry[]>;
}

export function createAuditService(db: D1Database): AuditService {
  return {
    async log(action, resource, details): Promise<void> {
      const id = generateId("audit");
      const timestamp = Math.floor(Date.now() / 1000);

      await db.prepare(`
        INSERT INTO audit_logs (id, timestamp, action, resource, resource_id, user_id, ip_hash, user_agent, details, success)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        timestamp,
        action,
        resource,
        details.resourceId || null,
        details.userId || null,
        details.ipHash,
        details.userAgent.slice(0, 200),
        JSON.stringify(details.metadata || {}),
        details.success !== false ? 1 : 0
      ).run();
    },

    async getRecent(limit = 50): Promise<AuditLogEntry[]> {
      const result = await db.prepare(`
        SELECT * FROM audit_logs
        ORDER BY timestamp DESC
        LIMIT ?
      `).bind(limit).all();

      return (result.results || []).map((row) => ({
        id: String(row.id),
        timestamp: new Date(Number(row.timestamp) * 1000).toISOString(),
        action: String(row.action),
        resource: String(row.resource),
        resourceId: row.resource_id ? String(row.resource_id) : null,
        userId: row.user_id ? String(row.user_id) : null,
        ipHash: String(row.ip_hash),
        userAgent: String(row.user_agent),
        details: JSON.parse(String(row.details || "{}")),
        success: Boolean(row.success),
      }));
    },

    async getByResource(resource: string, resourceId?: string): Promise<AuditLogEntry[]> {
      let result;
      if (resourceId) {
        result = await db.prepare(`
          SELECT * FROM audit_logs
          WHERE resource = ? AND resource_id = ?
          ORDER BY timestamp DESC
        `).bind(resource, resourceId).all();
      } else {
        result = await db.prepare(`
          SELECT * FROM audit_logs
          WHERE resource = ?
          ORDER BY timestamp DESC
        `).bind(resource).all();
      }

      return (result.results || []).map((row) => ({
        id: String(row.id),
        timestamp: new Date(Number(row.timestamp) * 1000).toISOString(),
        action: String(row.action),
        resource: String(row.resource),
        resourceId: row.resource_id ? String(row.resource_id) : null,
        userId: row.user_id ? String(row.user_id) : null,
        ipHash: String(row.ip_hash),
        userAgent: String(row.user_agent),
        details: JSON.parse(String(row.details || "{}")),
        success: Boolean(row.success),
      }));
    },
  };
}
