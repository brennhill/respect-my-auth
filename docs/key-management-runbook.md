# Key Management Runbook

Date: 2026-02-15

## Scope
Defines operational procedures for encryption keys and JWT signing keys.

## Key Types
- Platform root KMS key: protects tenant data keys
- Tenant data keys (DEK): encrypt PII in D1
- Tenant JWT signing keys: sign access/id tokens

## Rotation Policy
- JWT signing keys: rotate every 90 days
- Tenant data keys: rotate every 180 days
- Emergency rotation: immediately on suspected compromise

## Rotation Procedure (JWT)
1. Generate new key pair (kid B)
2. Publish kid B in JWKS
3. Switch signing to kid B
4. Keep kid A in JWKS for overlap window (7 days)
5. Retire kid A, update audit log

## Rotation Procedure (DEK)
1. Generate new tenant data key
2. Re-encrypt PII fields asynchronously
3. Store new wrapped DEK metadata
4. Retain previous DEK for rollback window (7 days)
5. Retire old DEK after window

## Incident Handling
- Trigger immediate key rotation
- Invalidate refresh tokens for affected tenant
- Notify security team and affected customers
- Audit log all actions

## Evidence
- Rotation logs
- JWKS history
- Change approvals

## Related Docs
- [docs/getting-started.md](getting-started.md)
- [docs/tech-spec.md](tech-spec.md)
- [docs/compliance-readiness-checklist.md](compliance-readiness-checklist.md)
