// Simple router for Cloudflare Worker
export class Router {
  constructor(request, env) {
    this.request = request;
    this.env = env;
    this.url = new URL(request.url);
    this.routes = [];
    this.middlewares = [];
  }

  use(middleware) {
    this.middlewares.push(middleware);
  }

  get(path, ...handlers) {
    this.addRoute('GET', path, handlers);
  }

  post(path, ...handlers) {
    this.addRoute('POST', path, handlers);
  }

  put(path, ...handlers) {
    this.addRoute('PUT', path, handlers);
  }

  delete(path, ...handlers) {
    this.addRoute('DELETE', path, handlers);
  }

  addRoute(method, path, handlers) {
    this.routes.push({ method, path, handlers });
  }

  matchPath(routePath, actualPath) {
    const routeParts = routePath.split('/');
    const actualParts = actualPath.split('/');
    
    if (routeParts.length !== actualParts.length) return null;
    
    const params = {};
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].slice(1)] = actualParts[i];
      } else if (routeParts[i] !== actualParts[i]) {
        return null;
      }
    }
    return params;
  }

  async handle() {
    const route = this.routes.find(r => {
      if (r.method !== this.request.method) return false;
      const match = this.matchPath(r.path, this.url.pathname);
      if (match) {
        this.params = match;
        return true;
      }
      return false;
    });

    if (!route) {
      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Run middlewares
    for (const mw of this.middlewares) {
      const result = await mw(this.request, this.env, this);
      if (result instanceof Response) return result;
    }

    // Run route handlers
    for (const handler of route.handlers) {
      const result = await handler(this.request, this.env, this);
      if (result instanceof Response) return result;
    }

    return new Response(JSON.stringify({ error: 'No handler' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
