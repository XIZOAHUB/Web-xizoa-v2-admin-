/**
 * Security configuration
 * CSP, headers, CORS settings
 */

export const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://*.githubusercontent.com https://*.r2.dev https://cdn.xizoa.com data:",
    "connect-src 'self' https://api.github.com",
    "font-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),

  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'X-XSS-Protection': '0',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

export const CORS_CONFIG = {
  origin: false, // Same-origin only
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposeHeaders: ['X-Request-Id'],
  maxAge: 86400,
};

// Allowed hosts for outbound requests (SSRF prevention)
export const ALLOWED_OUTBOUND_HOSTS = [
  'api.github.com',
  'raw.githubusercontent.com',
  'api.cloudflare.com',
  'github.com',
];

export function isAllowedHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_OUTBOUND_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}
