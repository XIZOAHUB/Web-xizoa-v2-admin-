/**
 * SEO metadata generation
 */

import type { Post, SEOMetadata } from "../../types/post";

export function generateSEOMetadata(post: Post, siteUrl: string): SEOMetadata {
  const url = `${siteUrl}/${post.type === "post" ? "posts" : "pages"}/${post.slug}`;
  const image = post.featuredImage || `${siteUrl}/og-default.png`;

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || "",
    canonical: post.canonicalUrl || url,
    ogTitle: post.metaTitle || post.title,
    ogDescription: post.metaDescription || post.excerpt || "",
    ogImage: image,
    ogType: post.type === "post" ? "article" : "website",
    ogUrl: url,
    twitterCard: "summary_large_image",
    twitterTitle: post.metaTitle || post.title,
    twitterDescription: post.metaDescription || post.excerpt || "",
    twitterImage: image,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.metaDescription || post.excerpt || "",
      author: {
        "@type": "Person",
        name: "Priyanshu Maurya",
      },
      datePublished: post.publishedAt || post.createdAt,
      dateModified: post.updatedAt,
      image,
      url,
    },
  };
}
