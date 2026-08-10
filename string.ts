/**
 * String utilities
 */

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function truncate(str: string, length: number, suffix = '...'): string {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length).trim() + suffix;
}

export function generateId(prefix?: string): string {
  const random = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now().toString(36);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function countWords(text: string): number {
  const clean = text.replace(/[#*`\-_\[\]\(\)!]/g, ' ');
  return clean.trim().split(/\s+/).filter(Boolean).length;
}

export function calculateReadingTime(content: string, wpm = 200): number {
  const words = countWords(content);
  return Math.max(1, Math.ceil(words / wpm));
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

export function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop();
  return ext ? `.${ext.toLowerCase()}` : '';
}

export function bytesToHuman(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}
