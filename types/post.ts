/**
 * Content types — Posts, Pages, Drafts
 */

export type ContentType = 'post' | 'page';
export type ContentStatus = 'draft' | 'published' | 'scheduled';

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string | null;
  tags: string[];
  featuredImage: string | null;
  status: ContentStatus;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
  createdAt: string;
  githubSha: string | null;
  type: ContentType;
  readingTime: number;
  wordCount: number;
}

export interface PostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: ContentStatus;
  category: string | null;
  tags: string[];
  featuredImage: string | null;
  publishedAt: string | null;
  updatedAt: string;
  githubSha: string | null;
  type: ContentType;
}

export interface PostFrontmatter {
  title: string;
  slug: string;
  date: string;
  updated: string;
  category: string;
  tags: string[];
  featured_image: string | null;
  excerpt: string | null;
  meta_title: string;
  meta_description: string;
  canonical_url: string | null;
  author: string;
  reading_time: number;
  word_count: number;
}

export interface Draft {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string | null;
  tags: string;
  featuredImage: string | null;
  status: ContentStatus;
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: number | null;
  createdAt: number;
  updatedAt: number;
  githubSha: string | null;
  type: ContentType;
}

export interface CreatePostInput {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  featuredImage?: string;
  status: ContentStatus;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  publishedAt?: string;
}

export interface UpdatePostInput {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  featuredImage?: string;
  status?: ContentStatus;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  publishedAt?: string;
}

export interface PostCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface SEOMetadata {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: 'article' | 'website';
  ogUrl: string;
  twitterCard: 'summary_large_image';
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  jsonLd: Record<string, unknown>;
}
