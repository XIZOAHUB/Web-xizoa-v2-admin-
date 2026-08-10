/**
 * Cloudflare-specific types
 */

import type { Env } from '../config/env';

export type { Env };

export interface AppContext {
  env: Env;
  req: Request;
  executionCtx: ExecutionContext;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: number;
  window: number;
}

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
