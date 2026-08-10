/**
 * Session management using KV
 */

import type { KVNamespace } from "@cloudflare/workers-types";
import type { Session } from "../../types/auth";
import { generateToken, sha256 } from "./crypto";
import { SESSION_TTL, SESSION_ROTATE_INTERVAL } from "../../config/constants";

const SESSION_PREFIX = "session:";

export interface SessionManager {
  create(userId: string, username: string, avatar: string, ip: string, ua: string): Promise<string>;
  validate(sessionId: string): Promise<Session | null>;
  rotate(sessionId: string, session: Session): Promise<string | null>;
  destroy(sessionId: string): Promise<void>;
  revoke(sessionId: string): Promise<void>;
}

export function createSessionManager(kv: KVNamespace): SessionManager {
  return {
    async create(
      userId: string,
      username: string,
      avatar: string,
      ip: string,
      ua: string
    ): Promise<string> {
      const sessionId = await generateToken(32);
      const now = Date.now();
      const session: Session = {
        sessionId,
        userId,
        username,
        avatar,
        createdAt: now,
        expiresAt: now + SESSION_TTL * 1000,
        lastRotatedAt: now,
        ipHash: await sha256(ip),
        uaHash: await sha256(ua),
      };

      await kv.put(
        `${SESSION_PREFIX}${sessionId}`,
        JSON.stringify(session),
        { expirationTtl: SESSION_TTL }
      );

      return sessionId;
    },

    async validate(sessionId: string): Promise<Session | null> {
      if (!sessionId) return null;
      const data = await kv.get(`${SESSION_PREFIX}${sessionId}`);
      if (!data) return null;

      try {
        const session: Session = JSON.parse(data);
        if (Date.now() > session.expiresAt) {
          await kv.delete(`${SESSION_PREFIX}${sessionId}`);
          return null;
        }
        return session;
      } catch {
        return null;
      }
    },

    async rotate(sessionId: string, session: Session): Promise<string | null> {
      const now = Date.now();
      if (now - session.lastRotatedAt < SESSION_ROTATE_INTERVAL * 1000) {
        return null; // Too soon to rotate
      }

      // Create new session
      const newSessionId = await generateToken(32);
      const newSession: Session = {
        ...session,
        sessionId: newSessionId,
        lastRotatedAt: now,
        expiresAt: now + SESSION_TTL * 1000,
      };

      // Store new session
      await kv.put(
        `${SESSION_PREFIX}${newSessionId}`,
        JSON.stringify(newSession),
        { expirationTtl: SESSION_TTL }
      );

      // Delete old session
      await kv.delete(`${SESSION_PREFIX}${sessionId}`);

      return newSessionId;
    },

    async destroy(sessionId: string): Promise<void> {
      await kv.delete(`${SESSION_PREFIX}${sessionId}`);
    },

    async revoke(sessionId: string): Promise<void> {
      // Add to revocation list for 5 minutes
      await kv.put(`revoked:${sessionId}`, "1", { expirationTtl: 300 });
      await kv.delete(`${SESSION_PREFIX}${sessionId}`);
    },
  };
}

export async function isRevoked(kv: KVNamespace, sessionId: string): Promise<boolean> {
  const revoked = await kv.get(`revoked:${sessionId}`);
  return revoked !== null;
}
