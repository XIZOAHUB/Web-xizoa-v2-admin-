/**
 * HTTP utilities
 */

export function getClientIP(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

export function getOrigin(request: Request): string {
  return request.headers.get('origin') || '';
}

export function isHttps(request: Request): boolean {
  const proto = request.headers.get('x-forwarded-proto');
  return proto === 'https' || request.url.startsWith('https://');
}

export function setCookie(
  headers: Headers,
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
    path?: string;
    maxAge?: number;
    expires?: Date;
  } = {}
): void {
  const parts = [`${name}=${value}`];

  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);

  headers.append('Set-Cookie', parts.join('; '));
}

export function deleteCookie(headers: Headers, name: string, path = '/'): void {
  headers.append('Set-Cookie', `${name}=; Path=${path}; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
}

export function parseCookies(header: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;

  header.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name && rest.length > 0) {
      cookies[name] = decodeURIComponent(rest.join('='));
    }
  });

  return cookies;
}

export function createJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function createErrorResponse(
  code: string,
  message: string,
  status = 500,
  details?: Array<{ field: string; message: string }>
): Response {
  const body: Record<string, unknown> = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
