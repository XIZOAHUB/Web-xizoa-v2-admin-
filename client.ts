/**
 * GitHub API client
 */

import { GITHUB_API_BASE } from "../../config/constants";
import { GitHubError } from "../../utils/errors";
import type { GitHubFile, GitHubCommit, GitHubTree } from "../../types/api";

export interface GitHubClientConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export function createGitHubClient(config: GitHubClientConfig) {
  const headers = {
    Authorization: `Bearer ${config.token}`,
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Xizoa-CMS",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${GITHUB_API_BASE}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new GitHubError(`GitHub API error ${response.status}: ${error}`, response.status);
    }

    return (await response.json()) as T;
  }

  return {
    // File operations
    async getFile(path: string, ref?: string): Promise<GitHubFile> {
      const query = ref ? `?ref=${ref}` : "";
      return request<GitHubFile>(`/repos/${config.owner}/${config.repo}/contents/${path}${query}`);
    },

    async createFile(path: string, content: string, message: string): Promise<GitHubCommit> {
      const encoded = btoa(unescape(encodeURIComponent(content)));
      return request<GitHubCommit>(`/repos/${config.owner}/${config.repo}/contents/${path}`, {
        method: "PUT",
        body: JSON.stringify({
          message,
          content: encoded,
          branch: config.branch,
          committer: {
            name: "Xizoa CMS",
            email: "cms@xizoa.com",
          },
        }),
      });
    },

    async updateFile(
      path: string,
      content: string,
      sha: string,
      message: string
    ): Promise<GitHubCommit> {
      const encoded = btoa(unescape(encodeURIComponent(content)));
      return request<GitHubCommit>(`/repos/${config.owner}/${config.repo}/contents/${path}`, {
        method: "PUT",
        body: JSON.stringify({
          message,
          content: encoded,
          sha,
          branch: config.branch,
          committer: {
            name: "Xizoa CMS",
            email: "cms@xizoa.com",
          },
        }),
      });
    },

    async deleteFile(path: string, sha: string, message: string): Promise<GitHubCommit> {
      return request<GitHubCommit>(`/repos/${config.owner}/${config.repo}/contents/${path}`, {
        method: "DELETE",
        body: JSON.stringify({
          message,
          sha,
          branch: config.branch,
        }),
      });
    },

    // Tree and commits
    async getTree(ref?: string, recursive = false): Promise<GitHubTree> {
      const query = new URLSearchParams();
      if (ref) query.set("ref", ref);
      if (recursive) query.set("recursive", "1");
      return request<GitHubTree>(
        `/repos/${config.owner}/${config.repo}/git/trees/${ref || config.branch}?${query}`
      );
    },

    async getCommits(path?: string, perPage = 30): Promise<GitHubCommit[]> {
      const query = new URLSearchParams();
      if (path) query.set("path", path);
      query.set("per_page", String(perPage));
      query.set("sha", config.branch);
      return request<GitHubCommit[]>(
        `/repos/${config.owner}/${config.repo}/commits?${query}`
      );
    },

    async getCommit(sha: string): Promise<GitHubCommit> {
      return request<GitHubCommit>(`/repos/${config.owner}/${config.repo}/commits/${sha}`);
    },

    // Branch operations
    async getBranch(name: string): Promise<{ ref: string; object: { sha: string } }> {
      return request<{ ref: string; object: { sha: string } }>(
        `/repos/${config.owner}/${config.repo}/git/ref/heads/${name}`
      );
    },

    async createBranch(name: string, fromRef: string): Promise<void> {
      const baseRef = await request<{ object: { sha: string } }>(
        `/repos/${config.owner}/${config.repo}/git/ref/heads/${fromRef}`
      );
      await request(`/repos/${config.owner}/${config.repo}/git/refs`, {
        method: "POST",
        body: JSON.stringify({
          ref: `refs/heads/${name}`,
          sha: baseRef.object.sha,
        }),
      });
    },
  };
}

export type GitHubClient = ReturnType<typeof createGitHubClient>;
