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

### 4.6 Email/Password Login
```text
User -> /auth/login
-> D1 credential verify -> issue session + tokens
-> Audit log
```

### 4.7 Magic Link Login
```text
User -> /auth/magic/start -> KV code stored -> email sent
User -> /auth/magic/verify -> code validated -> tokens issued
```

### 4.8 Social Login (Google)
```text
User -> /auth/social/google/start -> Redirect to Google
-> /auth/social/google/callback -> tokens issued
```

### 4.9 MFA (TOTP)
```text
User -> /auth/mfa/setup -> TOTP secret generated -> user confirms
User -> /auth/mfa/verify -> challenge validated -> tokens issued
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

## 6.1 Compliance Controls and Evidence
SOC2:
- Access control: RBAC + MFA for admins, logged access events
- Change management: tagged releases and deployment approvals
- Logging/monitoring: centralized audit logs and alerts
- Incident response: runbooks, on-call, postmortems

GDPR:
- Right to access: export API
- Right to erasure: cascade delete + tombstone
- Data residency: EU data plane option
- Data minimization: PII separation and encryption

Evidence artifacts:
- Audit log exports (R2)
- Deployment records
- Incident logs
- Access reviews

## 6.2 SLOs and Monitoring
- Auth API p95 latency < 150ms
- Token issuance error rate < 0.1%
- SAML login success rate > 99%
- Audit log write success > 99.9%
- Uptime target 99.9% for core auth APIs

Monitoring:
- Latency percentiles by endpoint
- Error rates by endpoint
- D1 query latency
- Rate-limit triggers
- Queue backlog for actions

## 6.3 Threat Model (Summary)
Threats:
- Credential stuffing
- Token theft (XSS or token leakage)
- SAML response tampering
- SCIM abuse or over-provisioning
- Privilege escalation via admin API

Mitigations:
- Rate limits, IP reputation, bot detection
- Short-lived access tokens and refresh token rotation
- Signed SAML assertions and strict clock skew checks
- SCIM token scoping and IP allowlists
- RBAC + MFA + audit logs for admin actions

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

## 10. Data Model Appendix (PII + Retention)

PII classification:
- Direct: email, name, phone (user_profiles)
- Indirect: IP, user agent (audit_logs)
- Auth-only: password hashes, MFA secrets (credentials)

Retention:
- Audit logs (hot): 30-90 days in D1 by plan
- Audit logs (cold): 1-7 years in R2 by plan
- Sessions: 30 days (refresh tokens)
- Magic link codes: minutes (KV)

## 11. Security Architecture Appendix

### 11.1 Key Hierarchy
- Root KMS key (platform) protects per-tenant data keys.
- Per-tenant data key encrypts PII fields in D1.
- Per-tenant JWT signing key (separate from data key).

### 11.2 Encryption Flow (PII)
```text
Write PII -> generate DEK (tenant) -> encrypt PII -> store in D1
DEK wrapped by KMS key -> store encrypted DEK metadata
```

### 11.3 JWT Signing and Rotation
```text
Active signing key (kid A) issues tokens
Rotation -> introduce kid B, publish both in JWKS
Overlap window (e.g., 7 days) -> retire kid A
```

### 11.4 Refresh Token Rotation
```text
Client uses refresh token -> new refresh token issued
Old refresh token revoked -> audit log entry
```

### 11.5 SAML Assertion Validation
- Verify XML signature with IdP cert
- Enforce strict audience and recipient checks
- Enforce clock skew window (e.g., 3-5 minutes)
- Reject unsigned assertions

### 11.6 Admin Access Controls
- MFA required for admin roles
- IP allowlists optional for enterprise tenants
- All admin actions recorded in audit logs
