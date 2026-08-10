/**
 * GET /api/media
 * List media files
 */

import type { Context } from "hono";
import type { Env } from "../../../config/env";
import { createMediaService } from "../../../services/media-service";

export default async function listMediaHandler(c: Context<{ Bindings: Env }>) {
  const url = new URL(c.req.url);
  const folder = url.searchParams.get("folder") || undefined;
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const cdnBase = `https://${c.env.CLOUDFLARE_PAGES_PROJECT}.pages.dev`;
  const mediaService = createMediaService(c.env.R2_BUCKET, c.env.DB, cdnBase);

  const media = await mediaService.list(folder, limit, offset);
  const folders = await mediaService.getFolders();

  return c.json({
    success: true,
    data: {
      media,
      folders,
      pagination: { limit, offset },
    },
  });
}
