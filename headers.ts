/**
 * Security headers middleware helper
 */

import { SECURITY_HEADERS } from "../../config/security";

export function applySecurityHeaders(headers: Headers): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
}

export function applyCorsHeaders(
  headers: Headers,
  origin: string,
  methods: string[] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
): void {
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", methods.join(", "));
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token");
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Max-Age", "86400");
}
