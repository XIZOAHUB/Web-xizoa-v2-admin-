/**
 * Media / R2 types
 */

export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  r2Key: string;
  r2Url: string;
  cdnUrl: string;
  folder: string;
  uploadedAt: string;
  metadata: Record<string, unknown>;
}

export interface MediaUploadInput {
  file: File;
  folder?: string;
}

export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
}

export interface MediaListResult {
  media: MediaItem[];
  folders: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}
