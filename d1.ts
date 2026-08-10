/**
 * D1 database wrapper
 */

import type { D1Database } from "@cloudflare/workers-types";

export interface D1Storage {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T>(sql: string, params?: unknown[]): Promise<T | null>;
  exec(sql: string, params?: unknown[]): Promise<void>;
  batch<T>(statements: Array<{ sql: string; params?: unknown[] }>): Promise<T[]>;
}

export function createD1Storage(db: D1Database): D1Storage {
  return {
    async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
      const stmt = db.prepare(sql);
      const result = params ? await stmt.bind(...params).all() : await stmt.all();
      return (result.results || []) as T[];
    },

    async queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
      const stmt = db.prepare(sql);
      const result = params ? await stmt.bind(...params).first() : await stmt.first();
      return (result as T) || null;
    },

    async exec(sql: string, params?: unknown[]): Promise<void> {
      const stmt = db.prepare(sql);
      if (params) {
        await stmt.bind(...params).run();
      } else {
        await stmt.run();
      }
    },

    async batch<T>(statements: Array<{ sql: string; params?: unknown[] }>): Promise<T[]> {
      const prepped = statements.map(({ sql, params }) => {
        const stmt = db.prepare(sql);
        return params ? stmt.bind(...params) : stmt;
      });
      const results = await db.batch(prepped);
      return results.map((r) => r.results as T).flat();
    },
  };
}
