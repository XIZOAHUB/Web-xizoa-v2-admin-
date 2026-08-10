/**
 * Global error handler middleware
 * Catches all errors and returns structured JSON responses
 */

import type { Context, Next } from "hono";
import type { Env } from "../config/env";
import { isAppError, AppError } from "../utils/errors";
import { createAuditService } from "../services/audit-service";
import { getClientIP, getUserAgent } from "../utils/http";
import { sha256 } from "../lib/auth/crypto";
import { generateId } from "../utils/string";

export async function errorHandlerMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    await next();
  } catch (error) {
    const requestId = generateId("req");
    const ip = getClientIP(c.req.raw);
    const ipHash = await sha256(ip);
    const userAgent = getUserAgent(c.req.raw);

    // Log error
    try {
      const audit = createAuditService(c.env.DB);
      const user = c.get("user");

      await audit.log("error", "api", {
        resourceId: requestId,
        userId: user?.id,
        ipHash,
        userAgent,
        metadata: {
          method: c.req.method,
          path: c.req.path,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
        success: false,
      });
    } catch {
      // Ignore audit logging errors
    }

    // Structured error response
    if (isAppError(error)) {
      c.res = c.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
          },
          requestId,
        },
        error.statusCode
      );
      return;
    }

    // Unknown error
    console.error(`Unhandled error [${requestId}]:`, error);

    c.res = c.json(
      {
        success: false,
        error: {
          code: "internal_error",
          message: "An unexpected error occurred",
        },
        requestId,
      },
      500
    );
  }
}
