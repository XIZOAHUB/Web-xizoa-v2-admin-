/**
 * POST /api/posts
 * Create a new draft/post
 */

import type { Context } from "hono";
import type { Env } from "../../../config/env";
import { createPostService } from "../../../services/post-service";
import { createGitHubClient } from "../../../lib/github/client";
import { createGitHubContentService } from "../../../services/github-service";
import { PostSchema } from "../../../lib/security/validators";
import { NotFoundError } from "../../../utils/errors";

export default async function createPostHandler(c: Context<{ Bindings: Env }>) {
  const body = await c.req.json();
  const input = PostSchema.parse(body);

  const postService = createPostService(c.env.DB);

  // Generate slug if not provided
  if (!input.slug) {
    input.slug = await postService.generateUniqueSlug(input.title);
  }

  // Create draft in D1
  const draft = await postService.createDraft(input, input.type as "post" | "page" || "post");

  // If publishing immediately, commit to GitHub
  if (input.status === "published") {
    const github = createGitHubClient({
      token: c.env.GITHUB_TOKEN,
      owner: c.env.GITHUB_REPO_OWNER,
      repo: c.env.GITHUB_REPO_NAME,
      branch: c.env.GITHUB_BRANCH,
    });
    const contentService = createGitHubContentService(github);

    // Build full post object for frontmatter
    const post = {
      ...draft,
      tags: JSON.parse(draft.tags || "[]"),
      publishedAt: draft.publishedAt ? new Date(draft.publishedAt * 1000).toISOString() : new Date().toISOString(),
      updatedAt: new Date(draft.updatedAt * 1000).toISOString(),
      createdAt: new Date(draft.createdAt * 1000).toISOString(),
    };

    const sha = await contentService.publishPost(post as any);
    await postService.markPublished(draft.slug, sha);
    draft.githubSha = sha;
  }

  return c.json({
    success: true,
    data: {
      id: draft.id,
      title: draft.title,
      slug: draft.slug,
      status: draft.status,
      githubSha: draft.githubSha,
      createdAt: new Date(draft.createdAt * 1000).toISOString(),
    },
  }, 201);
}
