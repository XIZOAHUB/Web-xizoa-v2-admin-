import { corsHeaders } from '../middleware/cors.js';

export async function handleRepos(request, env, router) {
  const { GITHUB_TOKEN } = env;

  // GET /api/repos - List connected repos
  if (request.method === 'GET' && new URL(request.url).pathname === '/api/repos') {
    const reposData = await env.ADMIN_KV.get('repos:connected');
    const repos = reposData ? JSON.parse(reposData) : [];
    
    // Also fetch user's active repo
    const userData = await env.ADMIN_KV.get(`user:${router.user.email}`);
    const user = JSON.parse(userData);
    
    return new Response(JSON.stringify({
      repos,
      activeRepo: user.activeRepo || repos[0] || null
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // POST /api/repos/switch - Switch active repo
  if (request.method === 'POST' && new URL(request.url).pathname === '/api/repos/switch') {
    const body = await request.json();
    const { owner, repo } = body;
    
    // Verify repo exists in connected list
    const reposData = await env.ADMIN_KV.get('repos:connected');
    const repos = reposData ? JSON.parse(reposData) : [];
    const repoExists = repos.find(r => r.owner === owner && r.name === repo);
    
    if (!repoExists) {
      return new Response(JSON.stringify({ error: 'Repo not connected' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Update user's active repo
    const userData = await env.ADMIN_KV.get(`user:${router.user.email}`);
    const user = JSON.parse(userData);
    user.activeRepo = { owner, repo, name: repo };
    await env.ADMIN_KV.put(`user:${router.user.email}`, JSON.stringify(user));
    
    return new Response(JSON.stringify({ success: true, activeRepo: user.activeRepo }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // POST /api/repos/connect - Connect new repo (Admin only)
  if (request.method === 'POST' && new URL(request.url).pathname === '/api/repos/connect') {
    const body = await request.json();
    const { owner, repo } = body;
    
    // Verify repo exists on GitHub
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Repo not found or no access' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const repoData = await res.json();
    
    // Add to connected repos
    const reposData = await env.ADMIN_KV.get('repos:connected');
    const repos = reposData ? JSON.parse(reposData) : [];
    
    if (!repos.find(r => r.owner === owner && r.name === repo)) {
      repos.push({
        owner,
        name: repo,
        fullName: repoData.full_name,
        url: repoData.html_url,
        defaultBranch: repoData.default_branch,
        connectedAt: new Date().toISOString()
      });
      await env.ADMIN_KV.put('repos:connected', JSON.stringify(repos));
    }

    return new Response(JSON.stringify({ success: true, repos }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
