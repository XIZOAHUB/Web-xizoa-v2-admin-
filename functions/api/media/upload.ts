/**
 * POST /api/media/upload
 * Upload media to R2
 */

import type { Context } from "hono";
import type { Env } from "../../../config/env";
import { createMediaService } from "../../../services/media-service";
import { ValidationError } from "../../../utils/errors";

export default async function uploadMediaHandler(c: Context<{ Bindings: Env }>) {
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "/";

  if (!file) {
    throw new ValidationError("No file provided");
  }

  const cdnBase = `https://${c.env.CLOUDFLARE_PAGES_PROJECT}.pages.dev`;
  const mediaService = createMediaService(c.env.R2_BUCKET, c.env.DB, cdnBase);

  const mediaItem = await mediaService.upload(file, folder);

  return c.json({
    success: true,
    data: mediaItem,
  }, 201);
}
