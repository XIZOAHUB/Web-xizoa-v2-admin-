/**
 * GitHub OAuth 2.0 flow
 */

import { GITHUB_API_BASE } from "../../config/constants";
import type { GitHubUser } from "../../types/auth";

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  allowedUser: string;
}

/**
 * Build GitHub OAuth authorization URL
 */
export function getAuthorizationUrl(config: OAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: "read:user",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange code for access token
 */
export async function exchangeCode(
  code: string,
  config: OAuthConfig
): Promise<string> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  const data = (await response.json()) as { access_token?: string; error?: string };

  if (data.error) {
    throw new Error(`OAuth error: ${data.error}`);
  }

  if (!data.access_token) {
    throw new Error("No access token received");
  }

  return data.access_token;
}

/**
 * Fetch GitHub user profile
 */
export async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Xizoa-CMS",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`);
  }

  return (await response.json()) as GitHubUser;
}

/**
 * Verify user is allowed
 */
export function verifyAllowedUser(user: GitHubUser, allowedUsername: string): boolean {
  return user.login.toLowerCase() === allowedUsername.toLowerCase();
}
