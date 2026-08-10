/**
 * GET /api/posts
 * List all posts/drafts with pagination
 */

import type { Context } from "hono";
import type { Env } from "../../../config/env";
import { createPostService } from "../../../services/post-service";
import { z } from "zod";

const QuerySchema = z.object({
  status: z.enum(["draft", "published", "scheduled"]).optional(),
  type: z.enum(["post", "page"]).optional().default("post"),
  page: z.string().transform(Number).optional().default("1"),
  limit: z.string().transform(Number).optional().default("20"),
});

export default async function listPostsHandler(c: Context<{ Bindings: Env }>) {
  const query = QuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams));

  const postService = createPostService(c.env.DB);
  const drafts = await postService.getDrafts(
    query.status,
    query.type,
    query.limit,
    (query.page - 1) * query.limit
  );

  return c.json({
    success: true,
    data: drafts.map((d) => ({
      id: d.id,
      title: d.title,
      slug: d.slug,
      excerpt: d.excerpt,
      status: d.status,
      category: d.category,
      tags: JSON.parse(d.tags || "[]"),
      featuredImage: d.featuredImage,
      publishedAt: d.publishedAt ? new Date(d.publishedAt * 1000).toISOString() : null,
      updatedAt: new Date(d.updatedAt * 1000).toISOString(),
      type: d.type,
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total: drafts.length, // TODO: get actual count
    },
  });
}
