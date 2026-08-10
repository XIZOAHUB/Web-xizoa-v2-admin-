/**
 * DELETE /api/posts/:slug
 * Delete a post/draft
 */

import type { Context } from "hono";
import type { Env } from "../../../config/env";
import { createPostService } from "../../../services/post-service";
import { createGitHubClient } from "../../../lib/github/client";
import { createGitHubContentService } from "../../../services/github-service";
import { SlugParamSchema } from "../../../lib/security/validators";

export default async function deletePostHandler(c: Context<{ Bindings: Env }>) {
  const { slug } = SlugParamSchema.parse({ slug: c.req.param("slug") });

  const postService = createPostService(c.env.DB);
  const draft = await postService.getDraft(slug);

  // If published, delete from GitHub too
  if (draft && draft.status === "published" && draft.githubSha) {
    const github = createGitHubClient({
      token: c.env.GITHUB_TOKEN,
      owner: c.env.GITHUB_REPO_OWNER,
      repo: c.env.GITHUB_REPO_NAME,
      branch: c.env.GITHUB_BRANCH,
    });
    const contentService = createGitHubContentService(github);
    await contentService.deletePost(slug, draft.type);
  }

  // Delete from D1
  await postService.deleteDraft(slug);

  return c.json({
    success: true,
    data: { message: `Post "${slug}" deleted` },
  });
}
