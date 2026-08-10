// ============================================
// MISSION CONTROL - Cloudflare Worker
// admin.xizoa.com - Personal Admin Panel
// ============================================

import { Router } from './utils/router.js';
import { authMiddleware } from './middleware/auth.js';
import { roleMiddleware } from './middleware/roles.js';
import { corsHeaders } from './middleware/cors.js';

// Routes
import { handleAuth } from './routes/auth.js';
import { handleBlog } from './routes/blog.js';
import { handleRepos } from './routes/repos.js';
import { handleUsers } from './routes/users.js';
import { handleAnalytics } from './routes/analytics.js';
import { handleMedia } from './routes/media.js';
import { handleBackup } from './routes/backup.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Static files serve karo (admin UI)
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return serveStatic(env, 'index.html', 'text/html');
    }
    if (url.pathname.startsWith('/css/')) {
      return serveStatic(env, url.pathname.slice(1), 'text/css');
    }
    if (url.pathname.startsWith('/js/')) {
      return serveStatic(env, url.pathname.slice(1), 'application/javascript');
    }

    // API Routes
    const router = new Router(request, env);
    
    // Auth routes (no auth required)
    router.post('/api/auth/login', handleAuth);
    router.get('/api/auth/me', handleAuth);
    
    // Protected routes
    router.use(authMiddleware);
    
    // Blog CMS (Admin + Editor)
    router.get('/api/blog', roleMiddleware(['admin', 'editor', 'viewer']), handleBlog);
    router.post('/api/blog', roleMiddleware(['admin', 'editor']), handleBlog);
    router.put('/api/blog/:slug', roleMiddleware(['admin', 'editor']), handleBlog);
    router.delete('/api/blog/:slug', roleMiddleware(['admin']), handleBlog);
    
    // Repos (Admin + Editor)
    router.get('/api/repos', roleMiddleware(['admin', 'editor']), handleRepos);
    router.post('/api/repos/switch', roleMiddleware(['admin', 'editor']), handleRepos);
    router.post('/api/repos/connect', roleMiddleware(['admin']), handleRepos);
    
    // Users (Admin only)
    router.get('/api/users', roleMiddleware(['admin']), handleUsers);
    router.post('/api/users', roleMiddleware(['admin']), handleUsers);
    router.put('/api/users/:email', roleMiddleware(['admin']), handleUsers);
    router.delete('/api/users/:email', roleMiddleware(['admin']), handleUsers);
    
    // Analytics (All roles)
    router.get('/api/analytics', roleMiddleware(['admin', 'editor', 'viewer']), handleAnalytics);
    
    // Media (Admin + Editor)
    router.get('/api/media', roleMiddleware(['admin', 'editor']), handleMedia);
    router.post('/api/media', roleMiddleware(['admin', 'editor']), handleMedia);
    router.delete('/api/media/:id', roleMiddleware(['admin']), handleMedia);
    
    // Backup (Admin only)
    router.post('/api/backup', roleMiddleware(['admin']), handleBackup);
    
    // Settings (Admin only)
    router.get('/api/settings', roleMiddleware(['admin']), handleSettings);
    router.put('/api/settings', roleMiddleware(['admin']), handleSettings);

    return router.handle();
  }
};

// Static file serving helper
async function serveStatic(env, path, contentType) {
  // In production, use R2 or KV. For now, inline HTML
  if (path === 'index.html') {
    return new Response(ADMIN_HTML, {
      headers: { 'Content-Type': 'text/html', ...corsHeaders }
    });
  }
  return new Response('Not Found', { status: 404 });
}
