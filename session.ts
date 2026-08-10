/**
 * GET /api/auth/session
 * Returns current session info
 */

import type { Context } from "hono";
import type { Env } from "../../../config/env";
import { getUser } from "../../../middleware/auth";

export default async function sessionHandler(c: Context<{ Bindings: Env }>) {
  const user = getUser(c);

  if (!user) {
    return c.json({
      success: true,
      data: { authenticated: false },
    });
  }

  return c.json({
    success: true,
    data: {
      authenticated: true,
      user,
    },
  });
}
