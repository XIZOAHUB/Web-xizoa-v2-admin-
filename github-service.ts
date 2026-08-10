/**
 * GitHub content service
 * High-level operations for publishing content to GitHub
 */

import type { GitHubClient } from "../lib/github/client";
import type { Post } from "../types/post";
import { generateFrontmatter } from "../lib/content/frontmatter";
import { generateCommitMessage } from "../lib/github/commits";
import { CONTENT_PATHS } from "../config/constants";
import { GitHubError, NotFoundError } from "../utils/errors";

export interface GitHubContentService {
  publishPost(post: Post): Promise<string>; // returns commit SHA
  updatePost(post: Post, sha: string): Promise<string>;
  deletePost(slug: string, type: string): Promise<void>;
  getPostContent(slug: string, type: string): Promise<{ content: string; sha: string }>;
  getPostHistory(slug: string, type: string): Promise<Array<{ sha: string; message: string; date: string }>>;
}

export function createGitHubContentService(client: GitHubClient): GitHubContentService {
  function getPath(slug: string, type: string): string {
    const dir = type === "post" ? CONTENT_PATHS.posts : CONTENT_PATHS.pages;
    return `${dir}/${slug}.md`;
  }

  return {
    async publishPost(post: Post): Promise<string> {
      const path = getPath(post.slug, post.type);
      const content = generateFrontmatter(post);
      const message = generateCommitMessage("create", post.type, post.slug);

      try {
        const result = await client.createFile(path, content, message);
        return result.sha || "unknown";
      } catch (error) {
        throw new GitHubError(`Failed to publish post: ${error instanceof Error ? error.message : "unknown"}`);
      }
    },

    async updatePost(post: Post, sha: string): Promise<string> {
      const path = getPath(post.slug, post.type);
      const content = generateFrontmatter(post);
      const message = generateCommitMessage("update", post.type, post.slug);

      try {
        const result = await client.updateFile(path, content, sha, message);
        return result.sha || "unknown";
      } catch (error) {
        throw new GitHubError(`Failed to update post: ${error instanceof Error ? error.message : "unknown"}`);
      }
    },

    async deletePost(slug: string, type: string): Promise<void> {
      const path = getPath(slug, type);

      // Get current file to get SHA
      let sha: string;
      try {
        const file = await client.getFile(path);
        sha = file.sha;
      } catch {
        throw new NotFoundError(`Post "${slug}"`);
      }

      const message = generateCommitMessage("delete", type as "post" | "page", slug);

      try {
        await client.deleteFile(path, sha, message);
      } catch (error) {
        throw new GitHubError(`Failed to delete post: ${error instanceof Error ? error.message : "unknown"}`);
      }
    },

    async getPostContent(slug: string, type: string): Promise<{ content: string; sha: string }> {
      const path = getPath(slug, type);

      try {
        const file = await client.getFile(path);
        // GitHub returns base64 encoded content
        const content = file.content
          ? decodeURIComponent(escape(atob(file.content)))
          : "";
        return { content, sha: file.sha };
      } catch {
        throw new NotFoundError(`Post "${slug}"`);
      }
    },

    async getPostHistory(slug: string, type: string): Promise<Array<{ sha: string; message: string; date: string }>> {
      const path = getPath(slug, type);

      try {
        const commits = await client.getCommits(path, 10);
        return commits.map((commit) => ({
          sha: commit.sha.substring(0, 7),
          message: commit.message.split("\n")[0],
          date: commit.author.date,
        }));
      } catch {
        return [];
      }
    },
  };
}
