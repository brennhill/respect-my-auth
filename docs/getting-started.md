# Getting Started

Date: 2026-02-15

## Architecture Entry Point
Start with these docs in order:
1. docs/product-spec.md
2. docs/tech-spec.md
3. docs/openapi.yaml
4. docs/branding-tokens.md

## High-Level Architecture
The platform is Cloudflare-first and serverless:
- Workers for API endpoints
- D1 for primary data
- KV for ephemeral tokens
- Durable Objects for coordination and rate limits
- R2 for audit logs and assets
- Pages for hosted login/consent UI

## How It Works (Conceptual)
- Tenants configure apps and auth methods in the admin UI.
- Apps use OIDC/OAuth2 to authenticate users.
- Enterprise tenants can enable SAML SSO and SCIM provisioning.
- Hosted UI is branded per tenant, defaulting to TalkLabs.

## Integration Overview (Client App)
1. Create tenant and app in admin UI.
2. Configure redirect URIs and scopes.
3. Use OIDC authorization code flow:
   - Redirect users to /oauth/authorize
   - Exchange code at /oauth/token
   - Validate tokens using /oauth/jwks

## System Diagrams
See:
- docs/product-spec.md (system diagram, OIDC flow, SAML flow, SCIM flow)
- docs/tech-spec.md (data flow and routing diagrams)

## Repository Structure
- docs/: product + tech specs, OpenAPI, compliance
- src/: Cloudflare Workers routes (stubs)
- web/: hosted UI (to be implemented)

## Next Steps
- Implement branding endpoints (/admin/branding, /branding/:tenant)
- Build hosted login UI under web/
- Add D1 schema migrations
