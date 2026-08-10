import { corsHeaders } from '../middleware/cors.js';

export async function handleMedia(request, env, router) {
  // For now, return placeholder. R2 integration later.
  if (request.method === 'GET') {
    return new Response(JSON.stringify({ media: [] }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  if (request.method === 'POST') {
    // Upload to R2 in future
    return new Response(JSON.stringify({ success: true, message: 'Upload via GitHub for now' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
