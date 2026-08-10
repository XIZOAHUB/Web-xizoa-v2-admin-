// ============================================
// MISSION CONTROL - Frontend
// ============================================

const API_BASE = ''; // Same origin
let currentUser = null;
let currentRepo = null;

// Auth
async function login() {
  const email = document.getElementById('loginEmail').value;
  if (!email) return alert('Email required');
  
  // In production, integrate with Cloudflare Access
  // For now, simple API call
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, cfToken: 'demo' })
    });
    
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('mc_token', data.token);
      await initApp();
    } else {
      alert(data.error || 'Login failed');
    }
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

async function initApp() {
  const token = localStorage.getItem('mc_token');
  if (!token) return showLogin();
  
  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error('Auth failed');
    
    currentUser = await res.json();
    showApp();
    loadRepos();
    loadDashboard();
    applyRolePermissions();
  } catch (e) {
    localStorage.removeItem('mc_token');
    showLogin();
  }
}

function showLogin() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('userName').textContent = currentUser.name || currentUser.email;
  document.getElementById('userRole').textContent = currentUser.role;
}

function logout() {
  localStorage.removeItem('mc_token');
  currentUser = null;
  showLogin();
}

// Role-based UI
function applyRolePermissions() {
  if (currentUser.role === 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
  }
  
  // Hide restricted nav items
  const allowedSections = currentUser.permissions || [];
  document.querySelectorAll('.nav-item').forEach(nav => {
    const section = nav.getAttribute('href').slice(1);
    if (!allowedSections.includes(section) && section !== 'dashboard') {
      nav.classList.add('hidden');
    }
  });
}

// Navigation
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`[href="#${sectionId}"]`).classList.add('active');
  document.getElementById('pageTitle').textContent = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
  
  // Load section data
  if (sectionId === 'blog') loadPosts();
  if (sectionId === 'repos') loadReposList();
  if (sectionId === 'analytics') loadAnalytics();
  if (sectionId === 'users') loadUsers();
}

// Repos
async function loadRepos() {
  const token = localStorage.getItem('mc_token');
  const res = await fetch('/api/repos', { headers: { 'Authorization': `Bearer ${token}` } });
  const data = await res.json();
  
  const select = document.getElementById('repoSelect');
  select.innerHTML = data.repos.map(r => 
    `<option value="${r.owner}/${r.name}" ${data.activeRepo?.repo === r.name ? 'selected' : ''}>${r.owner}/${r.name}</option>`
  ).join('');
}

async function switchRepo() {
  const token = localStorage.getItem('mc_token');
  const [owner, repo] = document.getElementById('repoSelect').value.split('/');
  
  await fetch('/api/repos/switch', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ owner, repo })
  });
  
  currentRepo = { owner, repo };
  loadPosts();
}

// Blog
async function loadPosts() {
  const token = localStorage.getItem('mc_token');
  const res = await fetch('/api/blog', { headers: { 'Authorization': `Bearer ${token}` } });
  const posts = await res.json();
  
  const container = document.getElementById('postsList');
  if (!Array.isArray(posts) || posts.length === 0) {
    container.innerHTML = '<p>No posts yet. Create your first post!</p>';
    return;
  }
  
  container.innerHTML = posts.map(p => `
    <div class="post-item">
      <div>
        <h4>${p.name.replace('.md', '')}</h4>
        <span class="post-meta">${new Date(p.updated_at).toLocaleDateString()}</span>
      </div>
      <div class="post-actions">
        <button class="btn-secondary" onclick="editPost('${p.name.replace('.md', '')}')">Edit</button>
        ${currentUser.role === 'admin' ? `<button class="btn-secondary" style="color:var(--danger)" onclick="deletePost('${p.name.replace('.md', '')}')">Delete</button>` : ''}
      </div>
    </div>
  `).join('');
}

function showEditor() {
  document.getElementById('editorOverlay').classList.remove('hidden');
}

function closeEditor() {
  document.getElementById('editorOverlay').classList.add('hidden');
  // Clear form
  document.getElementById('postTitle').value = '';
  document.getElementById('postSlug').value = '';
  document.getElementById('postContent').value = '';
}

async function publishPost() {
  const token = localStorage.getItem('mc_token');
  const body = {
    title: document.getElementById('postTitle').value,
    slug: document.getElementById('postSlug').value,
    category: document.getElementById('postCategory').value,
    tags: document.getElementById('postTags').value.split(',').map(t => t.trim()),
    excerpt: document.getElementById('postExcerpt').value,
    content: document.getElementById('postContent').value
  };
  
  const res = await fetch('/api/blog', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  const data = await res.json();
  if (data.success) {
    closeEditor();
    loadPosts();
    alert('Published!');
  } else {
    alert(data.error || 'Failed');
  }
}

// Dashboard
async function loadDashboard() {
  // Mock data for now
  document.getElementById('statPosts').textContent = '12';
  document.getElementById('statViews').textContent = '5.2K';
  document.getElementById('statEarnings').textContent = '$0';
  document.getElementById('statRepos').textContent = '3';
}

// Theme
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('mc-theme', next);
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('mc-theme');
  if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
  initApp();
});
