export interface PostListItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  status: 'draft' | 'published' | 'scheduled'
  category: string | null
  tags: string[]
  featuredImage: string | null
  publishedAt: string | null
  updatedAt: string
  type: 'post' | 'page'
}

export interface Post extends PostListItem {
  content: string
  metaTitle: string | null
  metaDescription: string | null
  canonicalUrl: string | null
  createdAt: string
  githubSha: string | null
}
