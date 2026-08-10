/**
 * Application constants
 */

export const APP_NAME = 'Xizoa CMS';
export const APP_VERSION = '1.0.0';

// Session
export const SESSION_TTL = 86400; // 24 hours in seconds
export const SESSION_ROTATE_INTERVAL = 900; // 15 minutes
export const SESSION_MAX_AGE = 86400; // 24 hours

// CSRF
export const CSRF_TOKEN_TTL = 3600; // 1 hour

// Rate Limits
export const RATE_LIMITS = {
  auth: { window: 300, max: 5 },      // 5 attempts per 5 min
  api: { window: 60, max: 100 },      // 100 requests per min
  upload: { window: 60, max: 10 },    // 10 uploads per min
  deploy: { window: 300, max: 3 },    // 3 deploys per 5 min
  github: { window: 60, max: 60 },    // 60 GitHub calls per min
} as const;

// Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const;

export const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

export const MAX_IMAGE_DIMENSIONS = { width: 4096, height: 4096 };

// Content
export const MAX_POST_CONTENT_LENGTH = 100000;
export const MAX_TITLE_LENGTH = 200;
export const MAX_SLUG_LENGTH = 100;
export const MAX_EXCERPT_LENGTH = 500;
export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 30;
export const MAX_CATEGORY_LENGTH = 50;
export const DEFAULT_POSTS_PER_PAGE = 10;
export const DEFAULT_AUTO_EXCERPT_LENGTH = 160;

// SEO
export const MAX_META_TITLE_LENGTH = 70;
export const MAX_META_DESCRIPTION_LENGTH = 160;

// GitHub
export const GITHUB_API_BASE = 'https://api.github.com';
export const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';

// Paths
export const CONTENT_PATHS = {
  posts: 'content/posts',
  pages: 'content/pages',
  static: 'static',
} as const;

// Cookie names
export const COOKIE_NAMES = {
  session: 'xizoa_session',
  csrf: 'xizoa_csrf',
} as const;
