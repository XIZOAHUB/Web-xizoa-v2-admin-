import { corsHeaders } from '../middleware/cors.js';

// Simple JWT create (in production use proper library)
function createJWT(payload, secret) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  }));
  // In production, properly sign with crypto
  const signature = btoa(`${header}.${body}.${secret}`);
  return `${header}.${body}.${signature}`;
}

export async function handleAuth(request, env, router) {
  const url = new URL(request.url);
  
  // GET /api/auth/me - Current user info
  if (request.method === 'GET' && url.pathname === '/api/auth/me') {
    if (!router.user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Get full user data from KV
    const userData = await env.ADMIN_KV.get(`user:${router.user.email}`);
    const user = userData ? JSON.parse(userData) : router.user;

    return new Response(JSON.stringify({
      email: user.email,
      role: user.role,
      name: user.name || user.email,
      sections: user.sections || null,
      permissions: user.permissions || getDefaultPermissions(user.role),
      repos: user.repos || []
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // POST /api/auth/login - Login (Cloudflare Access handles actual auth)
  if (request.method === 'POST' && url.pathname === '/api/auth/login') {
    const body = await request.json();
    const { email, cfToken } = body;

    // Verify Cloudflare Access token (in production)
    // For now, check if user exists in KV
    const userData = await env.ADMIN_KV.get(`user:${email}`);
    
    if (!userData) {
      // Auto-create admin for first user (you)
      const isFirstUser = !(await env.ADMIN_KV.list({ prefix: 'user:' })).keys.length;
      
      if (isFirstUser) {
        const newUser = {
          email,
          role: 'admin',
          name: 'Admin',
          createdAt: new Date().toISOString(),
          repos: []
        };
        await env.ADMIN_KV.put(`user:${email}`, JSON.stringify(newUser));
        
        const token = createJWT({ email, role: 'admin' }, env.JWT_SECRET);
        return new Response(JSON.stringify({ token, user: newUser }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const user = JSON.parse(userData);
    const token = createJWT({ email, role: user.role }, env.JWT_SECRET);
    
    return new Response(JSON.stringify({ token, user }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

function getDefaultPermissions(role) {
  const perms = {
    admin: ['blog', 'media', 'analytics', 'users', 'repos', 'settings', 'backup', 'earnings', 'ai', 'domains', 'newsletter'],
    editor: ['blog', 'media', 'analytics'],
    viewer: ['analytics']
  };
  return perms[role] || [];
}
