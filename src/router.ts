export type Handler = (
  req: Request,
  env: Env,
  ctx: ExecutionContext,
  params: Record<string, string>
) => Promise<Response> | Response;

export type Route = {
  method: string;
  pattern: string;
  handler: Handler;
};

export function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const p = patternParts[i];
    const v = pathParts[i];
    if (p.startsWith(":")) {
      params[p.slice(1)] = decodeURIComponent(v);
      continue;
    }
    if (p !== v) return null;
  }

  return params;
}

export async function routeRequest(
  req: Request,
  env: Env,
  ctx: ExecutionContext,
  routes: Route[]
): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method.toUpperCase();

  for (const route of routes) {
    if (route.method !== method) continue;
    const params = matchRoute(route.pattern, url.pathname);
    if (!params) continue;
    return route.handler(req, env, ctx, params);
  }

  return new Response(JSON.stringify({ error: "not_found" }), {
    status: 404,
    headers: { "content-type": "application/json" }
  });
}

export interface Env {
  APP_ENV: string;
  DB: D1Database;
  AUDIT_BUCKET: R2Bucket;
  ASSETS_BUCKET: R2Bucket;
}
