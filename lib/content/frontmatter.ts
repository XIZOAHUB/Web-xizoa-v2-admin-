/**
 * Frontmatter generation and parsing
 */

import type { Post, PostFrontmatter } from "../../types/post";
import { calculateReadingTime, countWords } from "../../utils/string";

export function generateFrontmatter(post: Post): string {
  const fm: PostFrontmatter = {
    title: post.title,
    slug: post.slug,
    date: post.publishedAt || post.createdAt,
    updated: post.updatedAt,
    category: post.category || "Uncategorized",
    tags: post.tags || [],
    featured_image: post.featuredImage,
    excerpt: post.excerpt,
    meta_title: post.metaTitle || post.title,
    meta_description: post.metaDescription || post.excerpt || "",
    canonical_url: post.canonicalUrl,
    author: "Priyanshu Maurya",
    reading_time: calculateReadingTime(post.content),
    word_count: countWords(post.content),
  };

  const yamlLines = Object.entries(fm)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => {
      if (Array.isArray(v)) {
        return `${k}:
${v.map((item) => `  - "${item}"`).join("\n")}`;
      }
      if (typeof v === "string" && v.includes("\n")) {
        return `${k}: |\n${v.split("\n").map((l) => `  ${l}`).join("\n")}`;
      }
      return `${k}: "${v}"`;
    });

  return `---\n${yamlLines.join("\n")}\n---\n\n${post.content}`;
}

export function parseFrontmatter(content: string): { frontmatter: Partial<PostFrontmatter>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const yamlBlock = match[1];
  const body = match[2].trim();
  const frontmatter: Partial<PostFrontmatter> = {};

  // Simple YAML parser (for production use a proper YAML parser)
  const lines = yamlBlock.split("\n");
  let currentKey = "";
  let currentArray: string[] = [];

  for (const line of lines) {
    const arrayMatch = line.match(/^\s+-\s+"?(.+?)"?$/);
    if (arrayMatch && currentKey) {
      currentArray.push(arrayMatch[1]);
      (frontmatter as Record<string, unknown>)[currentKey] = currentArray;
      continue;
    }

    const keyValueMatch = line.match(/^([a-z_]+):\s*"?(.+?)"?$/);
    if (keyValueMatch) {
      currentKey = keyValueMatch[1];
      currentArray = [];
      const value = keyValueMatch[2];
      (frontmatter as Record<string, unknown>)[currentKey] = value;
    }
  }

  return { frontmatter, body };
}
