/**
 * Authentication types
 */

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

export interface Session {
  sessionId: string;
  userId: string;
  username: string;
  avatar: string;
  createdAt: number;
  expiresAt: number;
  lastRotatedAt: number;
  ipHash: string;
  uaHash: string;
}

export interface SessionData {
  authenticated: boolean;
  user?: {
    id: string;
    username: string;
    avatar: string;
  };
  expiresAt?: string;
}

export interface OAuthState {
  state: string;
  redirectUri: string;
  createdAt: number;
}

export interface CSRFToken {
  token: string;
  expiresAt: number;
}
