# Auth Platform Plan (B2B, Multi-Tenant, Cloudflare-First)

Date: 2026-02-15

## 1. Data Model and Schema (Hybrid Tenant Model)

### Core Entities
- tenants: orgs/accounts (billing unit)
- apps: client apps per tenant (OIDC/OAuth)
- users: identities (PII separated)
- memberships: user ↔ tenant relationship + roles
- credentials: auth methods (password, magic link, social, mfa)
- sessions: refresh tokens + device/session state
- saml_connections: tenant SSO configs (IdP metadata)
- scim_configs: tenant provisioning configs
- audit_logs: immutable events

### Storage Layout
- Shared plane: tenants, apps, users, memberships, credentials, sessions, audit_logs
- Dedicated tenant option: same schema but per-tenant D1 + R2 namespace; tenant routing decides which DB
- KV: one-time tokens (magic link, MFA challenge)
- Durable Objects: rate limits, session nonce, tenant cache
- R2: audit log archives & exports

### Key Points
- Keep PII in a user_profiles table with per-tenant data key encryption.
- Store auth-critical fields in credentials to minimize PII surface.
- Tenant isolation: tenant_id everywhere; row-level auth enforced at API.

### Schema (D1/SQLite)
```sql
-- tenants
create table tenants (
  id text primary key,
  name text not null,
  plan text not null,
  region text not null, -- e.g. "us", "eu"
  data_plane text not null, -- "shared" | "dedicated"
  created_at text not null
);

-- apps
create table apps (
  id text primary key,
  tenant_id text not null,
  name text not null,
  client_id text not null unique,
  client_secret_hash text not null,
  redirect_uris text not null, -- JSON array
  grant_types text not null,   -- JSON array
  created_at text not null,
  foreign key (tenant_id) references tenants(id)
);

-- users (non-PII)
create table users (
  id text primary key,
  primary_email_hash text not null, -- hash for lookup
  status text not null, -- "active","disabled"
  created_at text not null
);

-- user_profiles (PII)
create table user_profiles (
  user_id text primary key,
  tenant_id text not null,
  email_encrypted text not null,
  name_encrypted text,
  phone_encrypted text,
  locale text,
  foreign key (user_id) references users(id)
);

-- memberships
create table memberships (
  id text primary key,
  tenant_id text not null,
  user_id text not null,
  role text not null,
  created_at text not null,
  unique(tenant_id, user_id),
  foreign key (tenant_id) references tenants(id),
  foreign key (user_id) references users(id)
);

-- credentials
create table credentials (
  id text primary key,
  user_id text not null,
  tenant_id text not null,
  type text not null, -- "password","magic","google","mfa_totp"
  secret_hash text,   -- password or MFA secret hash
  provider_id text,   -- social provider user id
  created_at text not null,
  foreign key (user_id) references users(id)
);

-- sessions (refresh tokens & device)
create table sessions (
  id text primary key,
  user_id text not null,
  tenant_id text not null,
  refresh_token_hash text not null,
  device_fingerprint text,
  created_at text not null,
  expires_at text not null,
  revoked_at text,
  foreign key (user_id) references users(id)
);

-- saml_connections
create table saml_connections (
  id text primary key,
  tenant_id text not null,
  name text not null,
  idp_entity_id text not null,
  idp_sso_url text not null,
  idp_x509_cert text not null,
  sp_entity_id text not null,
  created_at text not null,
  foreign key (tenant_id) references tenants(id)
);

-- scim configs
create table scim_configs (
  id text primary key,
  tenant_id text not null,
  base_url text not null,
  bearer_token_hash text not null,
  created_at text not null,
  foreign key (tenant_id) references tenants(id)
);

-- audit logs (recent hot)
create table audit_logs (
  id text primary key,
  tenant_id text not null,
  actor_user_id text,
  event_type text not null,
  ip text,
  user_agent text,
  metadata text, -- JSON
  created_at text not null
);

-- tenant branding
create table tenant_branding (
  tenant_id text primary key,
  company_name text,
  support_email text,
  logo_url text,
  logo_dark_url text,
  favicon_url text,
  primary_color text,
  secondary_color text,
  background_color text,
  text_color text,
  font_family text,
  button_radius integer,
  card_style text, -- "flat" | "elevated"
  white_label integer, -- 0 or 1
  updated_at text not null,
  foreign key (tenant_id) references tenants(id)
);
```

## 2. Endpoint Map

### OIDC / OAuth2
- GET /.well-known/openid-configuration
- GET /oauth/jwks
- GET /oauth/authorize
- POST /oauth/token
- GET /oauth/userinfo
- POST /oauth/introspect
- POST /oauth/revoke

### Auth Methods
- POST /auth/login (email/password)
- POST /auth/magic/start
- POST /auth/magic/verify
- POST /auth/social/:provider/start
- POST /auth/social/:provider/callback
- POST /auth/mfa/setup
- POST /auth/mfa/verify

### Sessions
- POST /sessions/refresh
- POST /sessions/logout

### SAML
- GET /saml/metadata/:tenant
- POST /saml/acs/:tenant
- GET /saml/login/:tenant

### SCIM
- GET /scim/v2/Users
- POST /scim/v2/Users
- PATCH /scim/v2/Users/:id
- DELETE /scim/v2/Users/:id
- GET /scim/v2/Groups

### Admin (tenant scoped)
- GET /admin/tenants/:tenant
- POST /admin/apps
- GET /admin/apps
- POST /admin/users
- GET /admin/users
- POST /admin/saml
- GET /admin/audit

### Hooks / Actions
- POST /actions (register)
- POST /actions/test
- POST /actions/run (internal only)

## 3. SOC2 + GDPR Checklist (Implementation-Mapped)

### SOC2
1. Access control
- RBAC for admin UI
- Audit log for admin actions
- Strong MFA for admin accounts

2. Change management
- Versioned deployments (Workers routes)
- Deployment approvals
- Release logs

3. Logging + monitoring
- Central audit log
- Security events: login failures, MFA bypass, token issuance
- Alerting on anomalies

4. Incident response
- Incident playbook
- Security contact + escalation paths
- Log retention policy

5. Data integrity
- Token signing keys per tenant
- Key rotation with overlap
- Backups for D1 (export to R2)

6. Vendor management
- DPAs with email/SMS providers
- Risk assessments for dependencies

### GDPR
1. Data minimization
- Split PII into user_profiles table
- Store only needed attributes

2. Consent + lawful basis
- Track consent for marketing vs auth

3. Right to access
- User export API: /admin/users/:id/export

4. Right to erasure
- Delete user + cascade
- Tombstone audit entry

5. Data residency
- Tenant routing: EU tenants stored in EU namespace
- Dedicated data planes for enterprises

6. Security
- Encrypt PII with tenant key
- TLS everywhere

## 4. Branding and White-Labeling (Hosted UI)

### Goals
- Per-tenant branding for hosted login/consent pages and transactional emails.
- Optional white-labeling (no platform branding) for enterprise plans.
- Asset uploads stored in R2 with optional external URL support (cached).

### Data Model
- tenant_branding table (see schema above)
- R2 assets for logos and favicon

### Branding Endpoints
- GET /admin/branding
- PUT /admin/branding
- POST /admin/branding/logo
- GET /branding/:tenant (public tokens for hosted UI)

### Behavior
- Admin UI updates branding config.
- Hosted UI resolves branding by tenant or by host header.
- White-label flag removes platform footer and co-branding.
- Custom domains can be added later (Cloudflare custom hostnames + per-tenant TLS).

## 5. Theme Tokens (Hosted UI)

### Token Set
- company_name
- logo_url
- logo_dark_url
- favicon_url
- primary_color
- secondary_color
- background_color
- text_color
- font_family
- button_radius
- card_style
- white_label

### Notes
- Tokens are returned by /branding/:tenant and cached at the edge.
- UI consumes tokens at render time to prevent brand leakage between tenants.

## Related Docs
- [docs/getting-started.md](getting-started.md)
- [docs/product-spec.md](product-spec.md)
- [docs/tech-spec.md](tech-spec.md)
- [docs/openapi.yaml](openapi.yaml)
- [docs/branding-tokens.md](branding-tokens.md)
