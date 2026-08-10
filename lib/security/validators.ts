/**
 * Input validation using Zod schemas
 */

import { z } from "zod";
import {
  MAX_TITLE_LENGTH,
  MAX_SLUG_LENGTH,
  MAX_POST_CONTENT_LENGTH,
  MAX_EXCERPT_LENGTH,
  MAX_TAGS,
  MAX_TAG_LENGTH,
  MAX_CATEGORY_LENGTH,
  MAX_META_TITLE_LENGTH,
  MAX_META_DESCRIPTION_LENGTH,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from "../../config/constants";

export const PostSchema = z.object({
  title: z.string().min(1, "Title is required").max(MAX_TITLE_LENGTH, `Title must be under ${MAX_TITLE_LENGTH} chars`),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(MAX_SLUG_LENGTH)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  content: z.string().max(MAX_POST_CONTENT_LENGTH, `Content must be under ${MAX_POST_CONTENT_LENGTH} chars`),
  excerpt: z.string().max(MAX_EXCERPT_LENGTH).optional(),
  category: z.string().max(MAX_CATEGORY_LENGTH).optional(),
  tags: z.array(z.string().max(MAX_TAG_LENGTH)).max(MAX_TAGS).optional(),
  featuredImage: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published", "scheduled"]),
  publishedAt: z.string().datetime().optional(),
  metaTitle: z.string().max(MAX_META_TITLE_LENGTH).optional(),
  metaDescription: z.string().max(MAX_META_DESCRIPTION_LENGTH).optional(),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
});

export const MediaUploadSchema = z.object({
  filename: z.string().regex(/^[a-zA-Z0-9._-]+$/),
  contentType: z.enum(ALLOWED_IMAGE_TYPES as [string, ...string[]]),
  size: z.number().max(MAX_FILE_SIZE, `File must be under ${MAX_FILE_SIZE / 1024 / 1024}MB`),
});

export const LoginCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export const SlugParamSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
});

export type PostInput = z.infer<typeof PostSchema>;
export type MediaUploadInput = z.infer<typeof MediaUploadSchema>;
