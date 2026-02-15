# Respect My Auth

A Cloudflare-first, multi-tenant B2B authentication platform for SaaS apps that need OIDC/OAuth2, SAML SSO, SCIM provisioning, MFA, and hosted branded login.

## Start Here
1. [docs/getting-started.md](docs/getting-started.md)
2. [docs/product-spec.md](docs/product-spec.md)
3. [docs/tech-spec.md](docs/tech-spec.md)
4. [docs/openapi.yaml](docs/openapi.yaml)

## Repository Map
- [docs/](docs/): product and technical specs, OpenAPI, compliance, and runbooks
- `src/`: Cloudflare Workers route stubs (API skeleton)
- `web/`: hosted login/consent UI (planned)
- `wrangler.toml`: Workers config (placeholder D1/R2 IDs)

## Local Dev
```bash
npm install
npm run dev
```

## Deploy
```bash
npm run deploy
```

## Status
This repo is an early-stage scaffold. Endpoints are documented in [docs/openapi.yaml](docs/openapi.yaml) and stubbed in `src/`.
