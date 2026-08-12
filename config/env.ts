/**
 * Environment variable loader
 * Validates that all required env vars are present
 */
import type { D1Database, R2Bucket, KVNamespace } from "@cloudflare/workers-types";

export interface Env {
  // Cloudflare Bindings
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  KV_SESSIONS: KVNamespace;
  KV_RATE_LIMIT: KVNamespace;

  // Public Variables (from [vars] in wrangler.toml)
  GITHUB_ALLOWED_USER: string;
  GITHUB_REPO_OWNER: string;
  GITHUB_REPO_NAME: string;
  GITHUB_BRANCH: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_PAGES_PROJECT: string;
  R2_BUCKET_NAME: string;

  // Secrets (from Cloudflare Dashboard)
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GITHUB_TOKEN: string;
  CLOUDFLARE_API_TOKEN: string;
  SESSION_SECRET: string;
  CSRF_SECRET: string;
  ENCRYPTION_KEY: string;
}

// Required public variables
const REQUIRED_VARS = [
  'GITHUB_ALLOWED_USER',
  'GITHUB_REPO_OWNER',
  'GITHUB_REPO_NAME',
  'GITHUB_BRANCH',
  'CLOUDFLARE_ACCOUNT_ID',
];

// Required secrets
const REQUIRED_SECRETS = [
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GITHUB_TOKEN',
  'SESSION_SECRET',
  'CSRF_SECRET',
];

export function validateEnv(env: Record<string, unknown>): void {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!env[key]) missing.push(key);
  }

  for (const key of REQUIRED_SECRETS) {
    if (!env[key]) missing.push(key);
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
