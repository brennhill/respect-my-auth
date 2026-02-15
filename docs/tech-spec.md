# Tech Spec and Plan

Date: 2026-02-15

## 1. Architecture Overview
Cloudflare-first serverless architecture with a hybrid tenant model.

- Workers: HTTP APIs for OIDC/OAuth2, SAML, SCIM, Admin, Branding
- D1: primary data store
- KV: ephemeral tokens (magic link, MFA challenge)
- Durable Objects: session coordination, rate limiting
- R2: audit log archive + asset storage
- Pages: hosted login/consent UI

## 2. Hybrid Tenant Model
- Shared control plane (tenant registry, billing, routing)
- Shared data plane by default
- Dedicated data plane for enterprise tenants (D1 + R2 namespace)
- Per-tenant JWT signing keys and encryption keys

## 3. Security Model
- PII stored encrypted with tenant data keys
- Token signing keys per tenant with rotation
- Strict rate limiting at edge
- Admin endpoints require MFA and RBAC

## 4. Data Flow Diagrams

### 4.1 Token Issuance
```text
User -> /oauth/authorize -> Login UI -> Auth API
Auth API -> D1 (user, credential check)
Auth API -> issue code -> /oauth/token -> JWT
```

### 4.2 SAML Login
```text
User -> /saml/login/{tenant}
-> Redirect to IdP -> SAMLResponse -> /saml/acs/{tenant}
-> Map to user -> issue tokens -> redirect to app
```

### 4.3 SCIM Provisioning
```text
IdP -> /scim/v2/Users (create/update)
-> D1 user + membership update
-> Audit log
```

### 4.4 Branding Resolution
```text
Request Host/Header -> Tenant lookup
-> Branding tokens from D1/R2 -> Edge cache
-> Hosted UI render
```

### 4.5 Tenant Isolation Routing
```text
API Request -> Tenant Registry -> Data Plane Selector
-> Shared D1 (default) OR Dedicated D1 (enterprise)
```

## 5. API Surface (Summary)
OIDC/OAuth2:
- GET /.well-known/openid-configuration
- GET /oauth/jwks
- GET /oauth/authorize
- POST /oauth/token
- GET /oauth/userinfo
- POST /oauth/introspect
- POST /oauth/revoke

Auth:
- POST /auth/login
- POST /auth/magic/start
- POST /auth/magic/verify
- POST /auth/social/:provider/start
- POST /auth/social/:provider/callback
- POST /auth/mfa/setup
- POST /auth/mfa/verify

Sessions:
- POST /sessions/refresh
- POST /sessions/logout

SAML:
- GET /saml/metadata/:tenant
- POST /saml/acs/:tenant
- GET /saml/login/:tenant

SCIM:
- GET /scim/v2/Users
- POST /scim/v2/Users
- PATCH /scim/v2/Users/:id
- DELETE /scim/v2/Users/:id
- GET /scim/v2/Groups

Admin:
- GET /admin/tenants/:tenant
- POST /admin/apps
- GET /admin/apps
- POST /admin/users
- GET /admin/users
- POST /admin/saml
- GET /admin/audit

Branding:
- GET /admin/branding
- PUT /admin/branding
- POST /admin/branding/logo
- GET /branding/:tenant

Actions:
- POST /actions
- POST /actions/test
- POST /actions/run

## 6. Operations and Compliance
- Audit logs stored in D1 (hot) and R2 (cold)
- GDPR deletion workflow: cascade delete + tombstone
- SOC2: change management, access logging, incident response

## 7. Phased Delivery Plan

### Phase 0 (Weeks 1-4)
- Tenant + app models
- OIDC core endpoints
- Email/password login
- Admin UI (basic)
- Audit logging (hot)

### Phase 1 (Weeks 5-8)
- Magic links
- MFA (TOTP)
- SAML SP
- Social login (Google)
- Branding + hosted UI

### Phase 2 (Weeks 9-12)
- SCIM v2
- Actions/hooks
- Enterprise data plane isolation
- Audit log export/retention

## 8. Dependencies
- Cloudflare Workers, D1, KV, R2, Pages
- Email provider (Postmark/SES)
- SAML library for Workers

## 9. Risks and Mitigations
- SAML library compatibility: preselect and test in Workers early
- D1 scale limitations: heavy read caching at edge
- JWT key rotation: enforce overlap window
