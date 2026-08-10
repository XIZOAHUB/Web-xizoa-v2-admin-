/**
 * Rate limiting using KV
 */

import type { KVNamespace } from "@cloudflare/workers-types";
import { RATE_LIMITS } from "../../config/constants";
import { RateLimitError } from "../../utils/errors";

export interface RateLimiter {
  check(endpoint: string, identifier: string): Promise<void>;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export function createRateLimiter(kv: KVNamespace): RateLimiter {
  return {
    async check(endpoint: string, identifier: string): Promise<void> {
      const config = RATE_LIMITS[endpoint as keyof typeof RATE_LIMITS] || RATE_LIMITS.api;
      const key = `rate_limit:${endpoint}:${identifier}`;
      const now = Math.floor(Date.now() / 1000);

      const data = await kv.get(key);
      let entry: RateLimitEntry;

      if (data) {
        entry = JSON.parse(data) as RateLimitEntry;
        if (now - entry.windowStart > config.window) {
          // Window expired, reset
          entry = { count: 1, windowStart: now };
        } else {
          entry.count++;
        }
      } else {
        entry = { count: 1, windowStart: now };
      }

      // Store updated entry
      const ttl = config.window - (now - entry.windowStart);
      await kv.put(key, JSON.stringify(entry), { expirationTtl: Math.max(ttl, 1) });

      if (entry.count > config.max) {
        throw new RateLimitError(ttl);
      }
    },
  };
}
