/**
 * GET /api/github/commits
 * Get recent GitHub commits
 */

import type { Context } from "hono";
import type { Env } from "../../../config/env";
import { createGitHubClient } from "../../../lib/github/client";

export default async function githubCommitsHandler(c: Context<{ Bindings: Env }>) {
  const github = createGitHubClient({
    token: c.env.GITHUB_TOKEN,
    owner: c.env.GITHUB_REPO_OWNER,
    repo: c.env.GITHUB_REPO_NAME,
    branch: c.env.GITHUB_BRANCH,
  });

  const path = new URL(c.req.url).searchParams.get("path") || undefined;
  const commits = await github.getCommits(path, 20);

  return c.json({
    success: true,
    data: commits.map((c) => ({
      sha: c.sha.substring(0, 7),
      message: c.message.split("\n")[0],
      author: c.author.name,
      date: c.author.date,
    })),
  });
}
