/**
 * Media service
 * Handles R2 uploads, metadata tracking in D1
 */

import type { R2Bucket, D1Database } from "@cloudflare/workers-types";
import type { MediaItem, ImageOptions } from "../types/media";
import { generateId, sanitizeFilename, bytesToHuman } from "../utils/string";
import { NotFoundError, ValidationError } from "../utils/errors";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE, MAX_IMAGE_DIMENSIONS } from "../config/constants";

export interface MediaService {
  upload(file: File, folder?: string): Promise<MediaItem>;
  delete(id: string): Promise<void>;
  get(id: string): Promise<MediaItem | null>;
  list(folder?: string, limit?: number, offset?: number): Promise<MediaItem[]>;
  getFolders(): Promise<string[]>;
  getOptimizedUrl(key: string, options?: ImageOptions): string;
}

export function createMediaService(
  r2: R2Bucket,
  db: D1Database,
  cdnBase: string
): MediaService {
  return {
    async upload(file: File, folder = "/"): Promise<MediaItem> {
      // Validation
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new ValidationError(`Invalid file type: ${file.type}. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}`);
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new ValidationError(`File too large: ${bytesToHuman(file.size)}. Max: ${bytesToHuman(MAX_FILE_SIZE)}`);
      }

      const id = generateId("media");
      const safeName = sanitizeFilename(file.name);
      const timestamp = Date.now();
      const r2Key = `${folder.replace(/^\//, "").replace(/\/$/, "")}/${timestamp}-${safeName}`;

      // Upload to R2
      const arrayBuffer = await file.arrayBuffer();
      await r2.put(r2Key, arrayBuffer, {
        customMetadata: {
          "original-name": file.name,
          "content-type": file.type,
          "uploaded-at": new Date().toISOString(),
        },
        httpMetadata: {
          contentType: file.type,
        },
      });

      // Get image dimensions (basic, for production use a proper image parser)
      let width: number | null = null;
      let height: number | null = null;

      // Store metadata in D1
      const mediaItem: MediaItem = {
        id,
        filename: safeName,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        width,
        height,
        r2Key,
        r2Url: `https://${cdnBase}/${r2Key}`,
        cdnUrl: `${cdnBase}/${r2Key}`,
        folder: folder || "/",
        uploadedAt: new Date().toISOString(),
        metadata: {},
      };

      await db.prepare(`
        INSERT INTO media_metadata (id, filename, original_name, mime_type, size, width, height,
          r2_key, r2_url, cdn_url, folder, uploaded_at, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, mediaItem.filename, mediaItem.originalName, mediaItem.mimeType,
        mediaItem.size, mediaItem.width, mediaItem.height, mediaItem.r2Key,
        mediaItem.r2Url, mediaItem.cdnUrl, mediaItem.folder,
        Math.floor(Date.now() / 1000), JSON.stringify(mediaItem.metadata)
      ).run();

      return mediaItem;
    },

    async delete(id: string): Promise<void> {
      const media = await this.get(id);
      if (!media) throw new NotFoundError("Media");

      // Delete from R2
      await r2.delete(media.r2Key);

      // Delete from D1
      await db.prepare("DELETE FROM media_metadata WHERE id = ?").bind(id).run();
    },

    async get(id: string): Promise<MediaItem | null> {
      const row = await db.prepare("SELECT * FROM media_metadata WHERE id = ?")
        .bind(id).first();

      if (!row) return null;

      return {
        id: String(row.id),
        filename: String(row.filename),
        originalName: String(row.original_name),
        mimeType: String(row.mime_type),
        size: Number(row.size),
        width: row.width ? Number(row.width) : null,
        height: row.height ? Number(row.height) : null,
        r2Key: String(row.r2_key),
        r2Url: String(row.r2_url),
        cdnUrl: String(row.cdn_url),
        folder: String(row.folder),
        uploadedAt: new Date(Number(row.uploaded_at) * 1000).toISOString(),
        metadata: JSON.parse(String(row.metadata || "{}")),
      };
    },

    async list(folder?: string, limit = 50, offset = 0): Promise<MediaItem[]> {
      let sql = "SELECT * FROM media_metadata";
      const params: unknown[] = [];

      if (folder) {
        sql += " WHERE folder = ?";
        params.push(folder);
      }

      sql += " ORDER BY uploaded_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const result = await db.prepare(sql).bind(...params).all();

      return (result.results || []).map((row) => ({
        id: String(row.id),
        filename: String(row.filename),
        originalName: String(row.original_name),
        mimeType: String(row.mime_type),
        size: Number(row.size),
        width: row.width ? Number(row.width) : null,
        height: row.height ? Number(row.height) : null,
        r2Key: String(row.r2_key),
        r2Url: String(row.r2_url),
        cdnUrl: String(row.cdn_url),
        folder: String(row.folder),
        uploadedAt: new Date(Number(row.uploaded_at) * 1000).toISOString(),
        metadata: JSON.parse(String(row.metadata || "{}")),
      }));
    },

    async getFolders(): Promise<string[]> {
      const result = await db.prepare(`
        SELECT DISTINCT folder FROM media_metadata ORDER BY folder
      `).all();

      return (result.results || []).map((row) => String(row.folder));
    },

    getOptimizedUrl(key: string, options?: ImageOptions): string {
      if (!options) return `${cdnBase}/${key}`;

      const params: string[] = [];
      if (options.width) params.push(`width=${options.width}`);
      if (options.height) params.push(`height=${options.height}`);
      if (options.quality) params.push(`quality=${options.quality}`);
      if (options.format) params.push(`format=${options.format}`);
      if (options.fit) params.push(`fit=${options.fit}`);

      if (params.length === 0) return `${cdnBase}/${key}`;
      return `${cdnBase}/cdn-cgi/image/${params.join(",")}/${key}`;
    },
  };
}
