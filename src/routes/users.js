import { corsHeaders } from '../middleware/cors.js';

export async function handleUsers(request, env, router) {
  const url = new URL(request.url);

  // GET /api/users - List all users
  if (request.method === 'GET' && url.pathname === '/api/users') {
    const usersList = await env.ADMIN_KV.list({ prefix: 'user:' });
    const users = [];
    
    for (const key of usersList.keys) {
      const userData = await env.ADMIN_KV.get(key.name);
      if (userData) {
        const user = JSON.parse(userData);
        users.push({
          email: user.email,
          name: user.name,
          role: user.role,
          sections: user.sections,
          permissions: user.permissions,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        });
      }
    }
    
    return new Response(JSON.stringify(users), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // POST /api/users - Create new user
  if (request.method === 'POST' && url.pathname === '/api/users') {
    const body = await request.json();
    const { email, name, role, sections, permissions, canPublish, canDelete } = body;
    
    const newUser = {
      email,
      name: name || email.split('@')[0],
      role: role || 'editor',
      sections: sections || [],
      permissions: permissions || getDefaultPermissions(role),
      canPublish: canPublish !== undefined ? canPublish : (role === 'admin'),
      canDelete: canDelete !== undefined ? canDelete : (role === 'admin'),
      createdAt: new Date().toISOString(),
      createdBy: router.user.email,
      repos: []
    };
    
    await env.ADMIN_KV.put(`user:${email}`, JSON.stringify(newUser));
    
    return new Response(JSON.stringify({ success: true, user: newUser }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // PUT /api/users/:email - Update user
  if (request.method === 'PUT' && url.pathname.match(/^\/api\/users\/[^/]+$/)) {
    const email = router.params.email;
    const body = await request.json();
    
    const userData = await env.ADMIN_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const user = JSON.parse(userData);
    Object.assign(user, body, { updatedAt: new Date().toISOString() });
    
    await env.ADMIN_KV.put(`user:${email}`, JSON.stringify(user));
    
    return new Response(JSON.stringify({ success: true, user }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // DELETE /api/users/:email - Delete user
  if (request.method === 'DELETE' && url.pathname.match(/^\/api\/users\/[^/]+$/)) {
    const email = router.params.email;
    
    // Prevent self-deletion
    if (email === router.user.email) {
      return new Response(JSON.stringify({ error: 'Cannot delete yourself' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    await env.ADMIN_KV.delete(`user:${email}`);
    
    return new Response(JSON.stringify({ success: true }), {
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
