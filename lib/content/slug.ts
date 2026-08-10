/**
 * Slug generation and validation
 */

import { slugify } from "../../utils/string";

export function generateSlug(title: string, existingSlugs: string[] = []): string {
  let baseSlug = slugify(title);
  if (!baseSlug) baseSlug = "untitled";

  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length > 0 && slug.length <= 100;
}
