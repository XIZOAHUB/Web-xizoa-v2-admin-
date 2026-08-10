/**
 * GET /api/settings
 * Get site settings
 */

import type { Context } from "hono";
import type { Env } from "../../../config/env";

export default async function getSettingsHandler(c: Context<{ Bindings: Env }>) {
  const result = await c.env.DB.prepare("SELECT * FROM settings").all();

  const settings: Record<string, string> = {};
  for (const row of result.results || []) {
    settings[String(row.key)] = String(row.value);
  }

  return c.json({
    success: true,
    data: settings,
  });
}
