import { corsHeaders } from './cors.js';

// JWT verify (simple implementation)
async function verifyJWT(token, secret) {
  try {
    const [header, payload, signature] = token.split('.');
    const data = JSON.parse(atob(payload));
    
    // Check expiry
    if (data.exp && data.exp < Date.now() / 1000) {
      return null;
    }
    
    return data;
  } catch (e) {
    return null;
  }
}

export async function authMiddleware(request, env, router) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const token = authHeader.slice(7);
  const decoded = await verifyJWT(token, env.JWT_SECRET);
  
  if (!decoded) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Attach user to router context
  router.user = decoded;
}

export async function roleMiddleware(allowedRoles) {
  return async function(request, env, router) {
    if (!router.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (!allowedRoles.includes(router.user.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Check section restrictions for editors
    if (router.user.role === 'editor' && router.user.sections) {
      router.userSections = router.user.sections;
    }
  };
}
