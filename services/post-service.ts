/**
 * Post / Page / Draft service
 * Business logic for content management
 */

import type { D1Database } from "@cloudflare/workers-types";
import type { Post, PostListItem, CreatePostInput, UpdatePostInput, Draft, ContentType, ContentStatus } from "../types/post";
import { generateId } from "../utils/string";
import { slugify } from "../utils/string";
import { NotFoundError, ConflictError, ValidationError } from "../utils/errors";

export interface PostService {
  // Draft operations (D1)
  createDraft(input: CreatePostInput, type?: ContentType): Promise<Draft>;
  updateDraft(slug: string, input: UpdatePostInput): Promise<Draft>;
  getDraft(slug: string): Promise<Draft | null>;
  getDrafts(status?: ContentStatus, type?: ContentType, limit?: number, offset?: number): Promise<Draft[]>;
  deleteDraft(slug: string): Promise<void>;

  // Publish to GitHub
  markPublished(slug: string, githubSha: string): Promise<void>;
  markScheduled(slug: string, scheduledAt: Date): Promise<void>;

  // Utility
  slugExists(slug: string): Promise<boolean>;
  generateUniqueSlug(title: string): Promise<string>;
}

export function createPostService(db: D1Database): PostService {
  return {
    async createDraft(input: CreatePostInput, type: ContentType = "post"): Promise<Draft> {
      const id = generateId("draft");
      const now = Math.floor(Date.now() / 1000);
      const slug = input.slug || slugify(input.title);

      // Check slug uniqueness
      const existing = await db.prepare("SELECT id FROM drafts WHERE slug = ?")
        .bind(slug).first();
      if (existing) {
        throw new ConflictError(`Slug "${slug}" already exists`);
      }

      const draft: Draft = {
        id,
        title: input.title,
        slug,
        content: input.content || "",
        excerpt: input.excerpt || null,
        category: input.category || null,
        tags: JSON.stringify(input.tags || []),
        featuredImage: input.featuredImage || null,
        status: input.status,
        metaTitle: input.metaTitle || null,
        metaDescription: input.metaDescription || null,
        publishedAt: input.publishedAt ? Math.floor(new Date(input.publishedAt).getTime() / 1000) : null,
        createdAt: now,
        updatedAt: now,
        githubSha: null,
        type,
      };

      await db.prepare(`
        INSERT INTO drafts (id, title, slug, content, excerpt, category, tags, featured_image,
          status, meta_title, meta_description, published_at, created_at, updated_at, github_sha, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        draft.id, draft.title, draft.slug, draft.content, draft.excerpt,
        draft.category, draft.tags, draft.featuredImage, draft.status,
        draft.metaTitle, draft.metaDescription, draft.publishedAt,
        draft.createdAt, draft.updatedAt, draft.githubSha, draft.type
      ).run();

      return draft;
    },

    async updateDraft(slug: string, input: UpdatePostInput): Promise<Draft> {
      const existing = await this.getDraft(slug);
      if (!existing) {
        throw new NotFoundError("Draft");
      }

      const now = Math.floor(Date.now() / 1000);
      const updates: string[] = [];
      const values: unknown[] = [];

      if (input.title !== undefined) { updates.push("title = ?"); values.push(input.title); }
      if (input.slug !== undefined && input.slug !== slug) {
        const slugExists = await this.slugExists(input.slug);
        if (slugExists) throw new ConflictError(`Slug "${input.slug}" already exists`);
        updates.push("slug = ?"); values.push(input.slug);
      }
      if (input.content !== undefined) { updates.push("content = ?"); values.push(input.content); }
      if (input.excerpt !== undefined) { updates.push("excerpt = ?"); values.push(input.excerpt); }
      if (input.category !== undefined) { updates.push("category = ?"); values.push(input.category); }
      if (input.tags !== undefined) { updates.push("tags = ?"); values.push(JSON.stringify(input.tags)); }
      if (input.featuredImage !== undefined) { updates.push("featured_image = ?"); values.push(input.featuredImage); }
      if (input.status !== undefined) { updates.push("status = ?"); values.push(input.status); }
      if (input.metaTitle !== undefined) { updates.push("meta_title = ?"); values.push(input.metaTitle); }
      if (input.metaDescription !== undefined) { updates.push("meta_description = ?"); values.push(input.metaDescription); }
      if (input.publishedAt !== undefined) {
        updates.push("published_at = ?");
        values.push(input.publishedAt ? Math.floor(new Date(input.publishedAt).getTime() / 1000) : null);
      }

      updates.push("updated_at = ?");
      values.push(now);
      values.push(slug); // for WHERE clause

      await db.prepare(`
        UPDATE drafts SET ${updates.join(", ")} WHERE slug = ?
      `).bind(...values).run();

      // Return updated draft
      const updated = await this.getDraft(input.slug || slug);
      if (!updated) throw new NotFoundError("Draft");
      return updated;
    },

    async getDraft(slug: string): Promise<Draft | null> {
      const row = await db.prepare("SELECT * FROM drafts WHERE slug = ?")
        .bind(slug).first();

      if (!row) return null;

      return {
        id: String(row.id),
        title: String(row.title),
        slug: String(row.slug),
        content: String(row.content),
        excerpt: row.excerpt ? String(row.excerpt) : null,
        category: row.category ? String(row.category) : null,
        tags: String(row.tags),
        featuredImage: row.featured_image ? String(row.featured_image) : null,
        status: String(row.status) as ContentStatus,
        metaTitle: row.meta_title ? String(row.meta_title) : null,
        metaDescription: row.meta_description ? String(row.meta_description) : null,
        publishedAt: row.published_at ? Number(row.published_at) : null,
        createdAt: Number(row.created_at),
        updatedAt: Number(row.updated_at),
        githubSha: row.github_sha ? String(row.github_sha) : null,
        type: String(row.type) as ContentType,
      };
    },

    async getDrafts(status?: ContentStatus, type?: ContentType, limit = 50, offset = 0): Promise<Draft[]> {
      let sql = "SELECT * FROM drafts WHERE 1=1";
      const params: unknown[] = [];

      if (status) { sql += " AND status = ?"; params.push(status); }
      if (type) { sql += " AND type = ?"; params.push(type); }

      sql += " ORDER BY updated_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const result = await db.prepare(sql).bind(...params).all();

      return (result.results || []).map((row) => ({
        id: String(row.id),
        title: String(row.title),
        slug: String(row.slug),
        content: String(row.content),
        excerpt: row.excerpt ? String(row.excerpt) : null,
        category: row.category ? String(row.category) : null,
        tags: String(row.tags),
        featuredImage: row.featured_image ? String(row.featured_image) : null,
        status: String(row.status) as ContentStatus,
        metaTitle: row.meta_title ? String(row.meta_title) : null,
        metaDescription: row.meta_description ? String(row.meta_description) : null,
        publishedAt: row.published_at ? Number(row.published_at) : null,
        createdAt: Number(row.created_at),
        updatedAt: Number(row.updated_at),
        githubSha: row.github_sha ? String(row.github_sha) : null,
        type: String(row.type) as ContentType,
      }));
    },

    async deleteDraft(slug: string): Promise<void> {
      const result = await db.prepare("DELETE FROM drafts WHERE slug = ?")
        .bind(slug).run();

      if (!result.meta?.changes) {
        throw new NotFoundError("Draft");
      }
    },

    async markPublished(slug: string, githubSha: string): Promise<void> {
      const now = Math.floor(Date.now() / 1000);
      await db.prepare(`
        UPDATE drafts SET status = 'published', github_sha = ?, updated_at = ? WHERE slug = ?
      `).bind(githubSha, now, slug).run();
    },

    async markScheduled(slug: string, scheduledAt: Date): Promise<void> {
      const timestamp = Math.floor(scheduledAt.getTime() / 1000);
      const now = Math.floor(Date.now() / 1000);
      await db.prepare(`
        UPDATE drafts SET status = 'scheduled', published_at = ?, updated_at = ? WHERE slug = ?
      `).bind(timestamp, now, slug).run();
    },

    async slugExists(slug: string): Promise<boolean> {
      const row = await db.prepare("SELECT 1 FROM drafts WHERE slug = ?")
        .bind(slug).first();
      return !!row;
    },

    async generateUniqueSlug(title: string): Promise<string> {
      const baseSlug = slugify(title) || "untitled";
      let slug = baseSlug;
      let counter = 1;

      while (await this.slugExists(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      return slug;
    },
  };
}
