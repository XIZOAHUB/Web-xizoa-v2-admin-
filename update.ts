/**
 * PUT /api/posts/:slug
 * Update a post/draft
 */

import type { Context } from "hono";
import type { Env } from "../../../config/env";
import { createPostService } from "../../../services/post-service";
import { createGitHubClient } from "../../../lib/github/client";
import { createGitHubContentService } from "../../../services/github-service";
import { PostSchema, SlugParamSchema } from "../../../lib/security/validators";
import { z } from "zod";

const UpdateSchema = PostSchema.partial();

export default async function updatePostHandler(c: Context<{ Bindings: Env }>) {
  const { slug } = SlugParamSchema.parse({ slug: c.req.param("slug") });
  const body = await c.req.json();
  const input = UpdateSchema.parse(body);

  const postService = createPostService(c.env.DB);

  // Update draft in D1
  const draft = await postService.updateDraft(slug, input);

  // If publishing or updating published post, commit to GitHub
  if (input.status === "published" || (draft.status === "published" && input.content)) {
    const github = createGitHubClient({
      token: c.env.GITHUB_TOKEN,
      owner: c.env.GITHUB_REPO_OWNER,
      repo: c.env.GITHUB_REPO_NAME,
      branch: c.env.GITHUB_BRANCH,
    });
    const contentService = createGitHubContentService(github);

    const post = {
      ...draft,
      tags: JSON.parse(draft.tags || "[]"),
      publishedAt: draft.publishedAt ? new Date(draft.publishedAt * 1000).toISOString() : new Date().toISOString(),
      updatedAt: new Date(draft.updatedAt * 1000).toISOString(),
      createdAt: new Date(draft.createdAt * 1000).toISOString(),
    };

    if (draft.githubSha) {
      const sha = await contentService.updatePost(post as any, draft.githubSha);
      await postService.markPublished(draft.slug, sha);
    } else {
      const sha = await contentService.publishPost(post as any);
      await postService.markPublished(draft.slug, sha);
    }
  }

  return c.json({
    success: true,
    data: {
      id: draft.id,
      slug: draft.slug,
      githubSha: draft.githubSha,
      updatedAt: new Date(draft.updatedAt * 1000).toISOString(),
    },
  });
}
