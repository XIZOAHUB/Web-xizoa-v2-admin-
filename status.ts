/**
 * GET /api/deploy/status
 * Get latest deployment status
 */

import type { Context } from "hono";
import type { Env } from "../../../config/env";
import { createDeployService } from "../../../services/deploy-service";

export default async function deployStatusHandler(c: Context<{ Bindings: Env }>) {
  const deployService = createDeployService(
    c.env.CLOUDFLARE_ACCOUNT_ID,
    c.env.CLOUDFLARE_PAGES_PROJECT,
    c.env.CLOUDFLARE_API_TOKEN
  );

  const status = await deployService.getStatus();

  return c.json({
    success: true,
    data: status,
  });
}
