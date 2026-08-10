import { corsHeaders } from '../middleware/cors.js';

export async function handleBlog(request, env, router) {
  const url = new URL(request.url);
  const { GITHUB_TOKEN } = env;
  
  // Get active repo for user
  const userData = await env.ADMIN_KV.get(`user:${router.user.email}`);
  const user = JSON.parse(userData);
  const activeRepo = user.activeRepo || { owner: 'XIZOAHUB', repo: 'Web-xizoa-v2' };

  // GET /api/blog - List posts
  if (request.method === 'GET' && url.pathname === '/api/blog') {
    const posts = await fetchGitHubContents(
      activeRepo.owner, 
      activeRepo.repo, 
      'posts', 
      GITHUB_TOKEN
    );
    
    return new Response(JSON.stringify(posts), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // GET /api/blog/:slug - Get single post
  if (request.method === 'GET' && url.pathname.match(/^\/api\/blog\/[^/]+$/)) {
    const slug = router.params.slug;
    const content = await fetchGitHubFile(
      activeRepo.owner,
      activeRepo.repo,
      `posts/${slug}.md`,
      GITHUB_TOKEN
    );
    
    return new Response(JSON.stringify(content), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // POST /api/blog - Create new post
  if (request.method === 'POST' && url.pathname === '/api/blog') {
    const body = await request.json();
    
    // Check editor restrictions
    if (router.user.role === 'editor' && router.userSections) {
      if (!router.userSections.includes(body.category)) {
        return new Response(JSON.stringify({ error: 'Not allowed for this category' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    const { title, slug, content, category, tags, excerpt } = body;
    
    // Generate frontmatter
    const frontmatter = `---
title: "${title}"
slug: "${slug}"
date: "${new Date().toISOString()}"
category: "${category}"
tags: [${tags.map(t => `"${t}"`).join(', ')}]
excerpt: "${excerpt}"
author: "${router.user.email}"
---

${content}
`;

    // Save to GitHub
    const result = await createGitHubFile(
      activeRepo.owner,
      activeRepo.repo,
      `posts/${slug}.md`,
      frontmatter,
      `Add post: ${title}`,
      GITHUB_TOKEN
    );

    return new Response(JSON.stringify({ success: true, slug, url: result.content.html_url }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // PUT /api/blog/:slug - Update post
  if (request.method === 'PUT' && url.pathname.match(/^\/api\/blog\/[^/]+$/)) {
    const slug = router.params.slug;
    const body = await request.json();
    
    // Get existing file to get SHA
    const existing = await fetchGitHubFile(
      activeRepo.owner,
      activeRepo.repo,
      `posts/${slug}.md`,
      GITHUB_TOKEN
    );

    const { title, content, category, tags, excerpt } = body;
    
    // Update frontmatter
    const frontmatter = `---
title: "${title}"
slug: "${slug}"
date: "${existing.frontmatter?.date || new Date().toISOString()}"
updated: "${new Date().toISOString()}"
category: "${category}"
tags: [${tags.map(t => `"${t}"`).join(', ')}]
excerpt: "${excerpt}"
author: "${existing.frontmatter?.author || router.user.email}"
---

${content}
`;

    const result = await updateGitHubFile(
      activeRepo.owner,
      activeRepo.repo,
      `posts/${slug}.md`,
      frontmatter,
      existing.sha,
      `Update post: ${title}`,
      GITHUB_TOKEN
    );

    return new Response(JSON.stringify({ success: true, slug }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // DELETE /api/blog/:slug - Delete post (Admin only)
  if (request.method === 'DELETE' && url.pathname.match(/^\/api\/blog\/[^/]+$/)) {
    const slug = router.params.slug;
    
    const existing = await fetchGitHubFile(
      activeRepo.owner,
      activeRepo.repo,
      `posts/${slug}.md`,
      GITHUB_TOKEN
    );

    await deleteGitHubFile(
      activeRepo.owner,
      activeRepo.repo,
      `posts/${slug}.md`,
      existing.sha,
      `Delete post: ${slug}`,
      GITHUB_TOKEN
    );

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// GitHub API helpers
async function fetchGitHubContents(owner, repo, path, token) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  if (!res.ok) return [];
  return await res.json();
}

async function fetchGitHubFile(owner, repo, path, token) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  if (!res.ok) return null;
  const data = await res.json();
  const content = atob(data.content);
  
  // Parse frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  return {
    content: data,
    sha: data.sha,
    frontmatter: fmMatch ? parseYAML(fmMatch[1]) : {},
    body: fmMatch ? fmMatch[2] : content
  };
}

async function createGitHubFile(owner, repo, path, content, message, token) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { 
      'Authorization': `token ${token}`, 
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      content: btoa(content)
    })
  });
  return await res.json();
}

async function updateGitHubFile(owner, repo, path, content, sha, message, token) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { 
      'Authorization': `token ${token}`, 
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      content: btoa(content),
      sha
    })
  });
  return await res.json();
}

async function deleteGitHubFile(owner, repo, path, sha, message, token) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'DELETE',
    headers: { 
      'Authorization': `token ${token}`, 
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message, sha })
  });
  return await res.json();
}

function parseYAML(yaml) {
  const result = {};
  yaml.split('\n').forEach(line => {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      let val = match[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith('[') && val.endsWith(']')) {
        val = val.slice(1, -1).split(',').map(s => s.trim().replace(/"/g, ''));
      }
      result[match[1]] = val;
    }
  });
  return result;
}
