/**
 * R2 object storage wrapper
 */

import type { R2Bucket, R2Object, R2ListResult } from "@cloudflare/workers-types";
import type { ImageOptions } from "../../types/media";

export interface R2Storage {
  upload(key: string, body: ReadableStream | ArrayBuffer | string, metadata: Record<string, string>): Promise<R2Object>;
  get(key: string): Promise<R2Object | null>;
  delete(key: string): Promise<void>;
  list(prefix: string, limit?: number, cursor?: string): Promise<R2ListResult>;
  getPublicUrl(key: string, cdnBase: string, options?: ImageOptions): string;
}

export function createR2Storage(bucket: R2Bucket): R2Storage {
  return {
    async upload(
      key: string,
      body: ReadableStream | ArrayBuffer | string,
      metadata: Record<string, string>
    ): Promise<R2Object> {
      const obj = await bucket.put(key, body, {
        customMetadata: metadata,
        httpMetadata: {
          contentType: metadata["content-type"] || "application/octet-stream",
        },
      });
      return obj;
    },

    async get(key: string): Promise<R2Object | null> {
      return await bucket.get(key);
    },

    async delete(key: string): Promise<void> {
      await bucket.delete(key);
    },

    async list(prefix: string, limit = 100, cursor?: string): Promise<R2ListResult> {
      return await bucket.list({ prefix, limit, cursor });
    },

    getPublicUrl(key: string, cdnBase: string, options?: ImageOptions): string {
      const base = `${cdnBase}/${key}`;
      if (!options) return base;

      const params: string[] = [];
      if (options.width) params.push(`width=${options.width}`);
      if (options.height) params.push(`height=${options.height}`);
      if (options.quality) params.push(`quality=${options.quality}`);
      if (options.format) params.push(`format=${options.format}`);
      if (options.fit) params.push(`fit=${options.fit}`);

      if (params.length === 0) return base;

      return `${cdnBase}/cdn-cgi/image/${params.join(",")}/${key}`;
    },
  };
}
