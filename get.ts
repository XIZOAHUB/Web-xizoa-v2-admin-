/**
 * GET /api/posts/:slug
 * Get a single post/draft
 */

import type { Context } from "hono";
import type { Env } from "../../../config/env";
import { createPostService } from "../../../services/post-service";
import { SlugParamSchema } from "../../../lib/security/validators";
import { NotFoundError } from "../../../utils/errors";

export default async function getPostHandler(c: Context<{ Bindings: Env }>) {
  const { slug } = SlugParamSchema.parse({ slug: c.req.param("slug") });

  const postService = createPostService(c.env.DB);
  const draft = await postService.getDraft(slug);

  if (!draft) {
    throw new NotFoundError(`Post "${slug}"`);
  }

  return c.json({
    success: true,
    data: {
      id: draft.id,
      title: draft.title,
      slug: draft.slug,
      content: draft.content,
      excerpt: draft.excerpt,
      category: draft.category,
      tags: JSON.parse(draft.tags || "[]"),
      featuredImage: draft.featuredImage,
      status: draft.status,
      metaTitle: draft.metaTitle,
      metaDescription: draft.metaDescription,
      publishedAt: draft.publishedAt ? new Date(draft.publishedAt * 1000).toISOString() : null,
      updatedAt: new Date(draft.updatedAt * 1000).toISOString(),
      createdAt: new Date(draft.createdAt * 1000).toISOString(),
      githubSha: draft.githubSha,
      type: draft.type,
    },
  });
}
