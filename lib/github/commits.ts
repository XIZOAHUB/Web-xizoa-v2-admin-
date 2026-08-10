/**
 * Commit message utilities
 */

import type { ContentType } from "../../types/post";

export function generateCommitMessage(
  action: "create" | "update" | "delete",
  type: ContentType,
  slug: string
): string {
  const timestamp = new Date().toISOString();
  const typeLabel = type === "post" ? "Post" : "Page";

  switch (action) {
    case "create":
      return `[CMS] Create ${typeLabel}: ${slug} (${timestamp})`;
    case "update":
      return `[CMS] Update ${typeLabel}: ${slug} (${timestamp})`;
    case "delete":
      return `[CMS] Delete ${typeLabel}: ${slug} (${timestamp})`;
  }
}

export function parseCommitMessage(message: string): {
  action: string;
  type: string;
  slug: string;
  timestamp: string;
} | null {
  const match = message.match(/\[CMS\] (\w+) (\w+): (.+) \((.+)\)/);
  if (!match) return null;

  return {
    action: match[1].toLowerCase(),
    type: match[2].toLowerCase(),
    slug: match[3],
    timestamp: match[4],
  };
}
