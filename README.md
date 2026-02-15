# Respect My Auth

A Cloudflare-first, multi-tenant B2B authentication platform.

## What's here
- `docs/auth-platform-plan.md`: architecture + schema + compliance checklist
- `docs/openapi.yaml`: detailed OpenAPI spec
- `src/`: Workers router skeleton (in progress)

## Quick start
```bash
npm install
npm run dev
```

## Deployment
```bash
npm run deploy
```

## Notes
- `wrangler.toml` contains placeholder D1 database IDs and bucket names.
- This repo is a scaffold and will expand as endpoints are implemented.
