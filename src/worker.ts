import { routeRequest, type Route, type Env } from "./router";

const notImplemented = (name: string) => () =>
  new Response(JSON.stringify({ error: "not_implemented", endpoint: name }), {
    status: 501,
    headers: { "content-type": "application/json" }
  });

const routes: Route[] = [
  { method: "GET", pattern: "/health", handler: () => new Response("ok") },

  // OIDC
  { method: "GET", pattern: "/.well-known/openid-configuration", handler: notImplemented("oidc_discovery") },
  { method: "GET", pattern: "/oauth/jwks", handler: notImplemented("jwks") },
  { method: "GET", pattern: "/oauth/authorize", handler: notImplemented("authorize") },
  { method: "POST", pattern: "/oauth/token", handler: notImplemented("token") },
  { method: "GET", pattern: "/oauth/userinfo", handler: notImplemented("userinfo") },
  { method: "POST", pattern: "/oauth/introspect", handler: notImplemented("introspect") },
  { method: "POST", pattern: "/oauth/revoke", handler: notImplemented("revoke") },

  // Auth
  { method: "POST", pattern: "/auth/login", handler: notImplemented("login") },
  { method: "POST", pattern: "/auth/magic/start", handler: notImplemented("magic_start") },
  { method: "POST", pattern: "/auth/magic/verify", handler: notImplemented("magic_verify") },
  { method: "POST", pattern: "/auth/social/:provider/start", handler: notImplemented("social_start") },
  { method: "POST", pattern: "/auth/social/:provider/callback", handler: notImplemented("social_callback") },
  { method: "POST", pattern: "/auth/mfa/setup", handler: notImplemented("mfa_setup") },
  { method: "POST", pattern: "/auth/mfa/verify", handler: notImplemented("mfa_verify") },

  // Sessions
  { method: "POST", pattern: "/sessions/refresh", handler: notImplemented("sessions_refresh") },
  { method: "POST", pattern: "/sessions/logout", handler: notImplemented("sessions_logout") },

  // SAML
  { method: "GET", pattern: "/saml/metadata/:tenant", handler: notImplemented("saml_metadata") },
  { method: "POST", pattern: "/saml/acs/:tenant", handler: notImplemented("saml_acs") },
  { method: "GET", pattern: "/saml/login/:tenant", handler: notImplemented("saml_login") },

  // SCIM
  { method: "GET", pattern: "/scim/v2/Users", handler: notImplemented("scim_users_list") },
  { method: "POST", pattern: "/scim/v2/Users", handler: notImplemented("scim_users_create") },
  { method: "PATCH", pattern: "/scim/v2/Users/:id", handler: notImplemented("scim_users_patch") },
  { method: "DELETE", pattern: "/scim/v2/Users/:id", handler: notImplemented("scim_users_delete") },
  { method: "GET", pattern: "/scim/v2/Groups", handler: notImplemented("scim_groups_list") },

  // Admin
  { method: "GET", pattern: "/admin/tenants/:tenant", handler: notImplemented("admin_tenant_get") },
  { method: "POST", pattern: "/admin/apps", handler: notImplemented("admin_apps_create") },
  { method: "GET", pattern: "/admin/apps", handler: notImplemented("admin_apps_list") },
  { method: "POST", pattern: "/admin/users", handler: notImplemented("admin_users_create") },
  { method: "GET", pattern: "/admin/users", handler: notImplemented("admin_users_list") },
  { method: "POST", pattern: "/admin/saml", handler: notImplemented("admin_saml_create") },
  { method: "GET", pattern: "/admin/audit", handler: notImplemented("admin_audit_list") },

  // Branding
  { method: "GET", pattern: "/admin/branding", handler: notImplemented("branding_get") },
  { method: "PUT", pattern: "/admin/branding", handler: notImplemented("branding_update") },
  { method: "POST", pattern: "/admin/branding/logo", handler: notImplemented("branding_logo_upload") },
  { method: "GET", pattern: "/branding/:tenant", handler: notImplemented("branding_public") },

  // Actions
  { method: "POST", pattern: "/actions", handler: notImplemented("actions_create") },
  { method: "POST", pattern: "/actions/test", handler: notImplemented("actions_test") },
  { method: "POST", pattern: "/actions/run", handler: notImplemented("actions_run") }
];

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return routeRequest(req, env, ctx, routes);
  }
};
