# Product Spec: Respect My Auth

Date: 2026-02-15

## 1. Summary
Respect My Auth is a B2B, multi-tenant authentication and identity platform designed to be a pluggable auth provider for SaaS products and websites. It supports OIDC/OAuth2, SAML SSO, SCIM provisioning, and modern login methods (email/password, magic link, social, MFA). It is Cloudflare-first and serverless, with a hybrid tenant model that supports shared infrastructure by default and optional dedicated data planes for enterprise needs.

## 2. Goals
- Provide a full-featured, secure identity platform comparable to Auth0.
- Enable fast integration for B2B SaaS apps (OIDC/OAuth2 + SAML).
- Support multi-tenant organizations and enterprise SSO.
- Scale instantly and operate at very low cost.
- Be SOC2 and GDPR compliant from the start.
- Offer per-tenant branding for hosted login/consent UI.

## 3. Non-Goals
- Consumer-only B2C product.
- Embedded login widgets (hosted-only in MVP).
- Custom domain support in MVP (planned later).

## 4. Target Users
- SaaS product teams needing authentication and enterprise SSO.
- Enterprise IT/security teams needing SCIM and SAML.
- Developers integrating auth into apps with minimal overhead.

## 5. Core Capabilities
- OIDC/OAuth2 provider
- SAML SP (Service Provider) for tenant-specific IdPs
- SCIM v2 provisioning
- Email/password, magic link, social login (Google), MFA (TOTP)
- Admin UI for tenants
- Audit logs with export/retention controls
- Hooks/Actions (post-login, pre-token)
- Per-tenant branding and hosted login/consent UI

## 6. Tenant Model (Hybrid)
- Default: shared control plane + shared data plane
- Optional: dedicated data plane per enterprise tenant
- Per-tenant JWT signing keys and encryption keys

## 7. User Journeys

### 7.1 App Developer Integrates OIDC
1. Developer creates tenant and app in admin UI.
2. Platform issues client_id and client_secret.
3. Developer configures redirect URIs and scopes.
4. App uses standard OIDC flow.

### 7.2 Enterprise SSO via SAML
1. Tenant admin adds SAML IdP metadata.
2. Platform provides SP metadata.
3. Users are redirected to IdP on login.
4. SAML response maps to user identity and creates or links user.

### 7.3 SCIM Provisioning
1. Tenant admin enables SCIM and generates token.
2. Enterprise IdP pushes user and group updates.
3. Platform updates users and memberships.

### 7.4 Branded Hosted Login
1. Tenant configures branding (logo, colors, fonts).
2. Hosted UI renders with tenant branding.
3. Users authenticate via configured methods.

## 8. Branding and White-Labeling
- Tenant-specific branding tokens control hosted UI appearance.
- Asset uploads stored in R2 with caching.
- Enterprise plan can remove platform branding entirely.

## 9. Compliance and Security
- SOC2 controls: access control, change management, logging, incident response.
- GDPR controls: data minimization, right to access/erasure, EU residency support.
- Strong encryption for PII and per-tenant key rotation.

## 10. Success Metrics
- Time-to-integrate for OIDC < 1 hour.
- Successful SAML setup in < 1 day with enterprise IT.
- P95 auth request latency < 150ms.
- Zero critical incidents with PII exposure.

## 11. System Diagram

```text
+-------------------+        +---------------------------+
| SaaS App / Client | <----> | Auth Platform (Edge APIs) |
+-------------------+        +---------------------------+
                                      |    |    |
                                      |    |    +--> Audit Log (R2)
                                      |    +------> Storage (D1/KV)
                                      +----------> Actions/Queues
```

## 12. Login Flow Diagram (OIDC)

```text
User -> App -> /oauth/authorize -> Hosted Login
      <- redirect with code <-
App -> /oauth/token -> access/id tokens
```
