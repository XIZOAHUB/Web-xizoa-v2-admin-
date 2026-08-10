/**
 * API response / error types
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
  requestId?: string;
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DeployStatus {
  status: 'success' | 'failure' | 'building' | 'pending';
  url: string;
  buildTime: string;
  commit: {
    sha: string;
    message: string;
    author: string;
    date: string;
  };
  deployedAt: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  content: string;
  encoding: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
}

export interface GitHubTree {
  sha: string;
  tree: Array<{
    path: string;
    mode: string;
    type: string;
    sha: string;
    size?: number;
  }>;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  resource: string;
  resourceId: string | null;
  userId: string | null;
  ipHash: string;
  userAgent: string;
  details: Record<string, unknown>;
  success: boolean;
}

export interface Settings {
  siteTitle: string;
  siteDescription: string;
  siteUrl: string;
  postsPerPage: number;
  defaultCategory: string;
  autoExcerptLength: number;
  enableComments: boolean;
  theme: string;
  timezone: string;
  dateFormat: string;
}
