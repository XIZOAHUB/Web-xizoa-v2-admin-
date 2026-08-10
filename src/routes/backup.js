import { corsHeaders } from '../middleware/cors.js';

export async function handleBackup(request, env, router) {
  // Trigger backup - export all KV data
  const allData = await env.ADMIN_KV.list();
  const backup = {};
  
  for (const key of allData.keys) {
    backup[key.name] = await env.ADMIN_KV.get(key.name);
  }
  
  // Save backup to R2 or return as download
  const backupKey = `backup-${new Date().toISOString()}.json`;
  
  return new Response(JSON.stringify({ 
    success: true, 
    backupKey,
    data: backup 
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}
