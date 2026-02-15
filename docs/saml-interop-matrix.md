# SAML Interop Matrix

Date: 2026-02-15

## Supported IdPs (Planned)
- Okta
- Azure AD (Entra ID)
- Google Workspace

## Required Assertions
- NameID (email recommended)
- Email attribute
- Optional: first_name, last_name, groups

## Feature Compatibility

### Okta
- SSO: Yes
- IdP-initiated: Optional
- SLO: Later
- Attribute mappings: Yes

### Azure AD (Entra ID)
- SSO: Yes
- IdP-initiated: Optional
- SLO: Later
- Attribute mappings: Yes

### Google Workspace
- SSO: Yes
- IdP-initiated: Optional
- SLO: Later
- Attribute mappings: Limited

## Notes
- Strict signature validation for all IdPs
- Clock skew window: 3-5 minutes
- RelayState supported
