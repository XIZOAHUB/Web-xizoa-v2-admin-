/**
 * KV storage wrapper
 */

import type { KVNamespace } from "@cloudflare/workers-types";

export interface KVStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

export function createKVStorage(namespace: KVNamespace): KVStorage {
  return {
    async get<T>(key: string): Promise<T | null> {
      const data = await namespace.get(key);
      if (!data) return null;
      try {
        return JSON.parse(data) as T;
      } catch {
        return data as unknown as T;
      }
    },

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      if (ttl) {
        await namespace.put(key, serialized, { expirationTtl: ttl });
      } else {
        await namespace.put(key, serialized);
      }
    },

    async delete(key: string): Promise<void> {
      await namespace.delete(key);
    },

    async list(prefix: string): Promise<string[]> {
      const keys: string[] = [];
      let cursor: string | undefined;
      do {
        const result = await namespace.list({ prefix, cursor });
        keys.push(...result.keys.map((k) => k.name));
        cursor = result.list_complete ? undefined : result.cursor;
      } while (cursor);
      return keys;
    },
  };
}
