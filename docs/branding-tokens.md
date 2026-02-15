# Branding Tokens (Hosted UI)

Date: 2026-02-15

## Purpose
Define a strict, safe theme surface for the hosted login/consent UI.

## Token Model
The branding token set is intentionally small to avoid CSS injection risk.

### Core
- company_name
- support_email
- white_label (boolean)

### Assets
- logo_url
- logo_dark_url
- favicon_url

### Colors
- primary_color
- secondary_color
- background_color
- text_color

### Typography
- font_family

### Components
- button_radius (number)
- card_style (enum: flat | elevated)

## Rendering Rules
- Tokens are resolved by tenant or host header at request time.
- Tokens are cached at the edge for 1-5 minutes.
- All URLs are validated and, if possible, cached to R2 on save.
- If white_label is true, do not show platform branding.

## Security Constraints
- No arbitrary CSS input.
- Whitelist font families or host fonts internally.
- Validate colors as hex.
- Enforce max sizes on logo assets.

## Default Branding (TalkLabs)
- company_name: TalkLabs
- primary_color: #0B1220
- secondary_color: #1F2937
- background_color: #F8FAFC
- text_color: #0F172A
- font_family: IBM Plex Sans
- button_radius: 8
- card_style: elevated
- white_label: false
