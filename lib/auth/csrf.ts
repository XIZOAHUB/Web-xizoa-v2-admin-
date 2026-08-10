/**
 * CSRF protection - Double-submit cookie pattern
 */

import type { KVNamespace } from "@cloudflare/workers-types";
import { generateToken, verifySignature, sign } from "./crypto";
import { CSRF_TOKEN_TTL } from "../../config/constants";

const CSRF_PREFIX = "csrf:";

export interface CSRFManager {
  generate(): Promise<string>;
  validate(token: string): Promise<boolean>;
  destroy(token: string): Promise<void>;
}

export function createCSRFManager(kv: KVNamespace, secret: string): CSRFManager {
  return {
    async generate(): Promise<string> {
      const token = await generateToken(32);
      const signed = await sign(token, secret);
      const fullToken = `${token}.${signed}`;

      await kv.put(`${CSRF_PREFIX}${token}`, "1", { expirationTtl: CSRF_TOKEN_TTL });
      return fullToken;
    },

    async validate(fullToken: string): Promise<boolean> {
      const parts = fullToken.split(".");
      if (parts.length !== 2) return false;

      const [token, signature] = parts;

      // Check if token exists in KV
      const exists = await kv.get(`${CSRF_PREFIX}${token}`);
      if (!exists) return false;

      // Verify signature
      const valid = await verifySignature(token, signature, secret);
      if (!valid) return false;

      // One-time use - delete after validation
      await kv.delete(`${CSRF_PREFIX}${token}`);
      return true;
    },

    async destroy(token: string): Promise<void> {
      const raw = token.split(".")[0];
      await kv.delete(`${CSRF_PREFIX}${raw}`);
    },
  };
}
