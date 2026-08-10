/**
 * PUT /api/settings
 * Update site settings
 */

import type { Context } from "hono";
import type { Env } from "../../../config/env";

export default async function updateSettingsHandler(c: Context<{ Bindings: Env }>) {
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  for (const [key, value] of Object.entries(body)) {
    await c.env.DB.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).bind(key, String(value), now).run();
  }

  return c.json({
    success: true,
    data: { message: "Settings updated" },
  });
}
