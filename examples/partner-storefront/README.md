# Summit Health — Partner Storefront Demo

Standalone **second frontend** that exercises the [Partner API](../../docs/PARTNER_API.md) the way a real partner would: marketing site + server-side API calls (no key in the browser).

## Quick start (mock — no Supabase deploy)

```bash
cd d:\telehealth\telehealth
npm run partner-storefront
```

Open **http://localhost:5200**

This runs a local mock that matches the live API response shape (`health`, `docs`, `brand`, `catalog`, `enrollment_start`).

## Live Supabase API

After deploying `partner-api` and running the multi-tenant SQL:

```powershell
$env:PARTNER_API_KEY = "pk_live_ns_…"   # from SQL verification output
$env:PARTNER_API_LIVE = "1"
npm run partner-storefront
```

## What it tests

| UI action | API call |
|-----------|----------|
| Page load | `GET health`, `docs`, `brand`, `catalog` |
| Treatment card → Enroll | `POST enrollment_start` → redirect to `/care/north-star-md/shop` |
| Portal links panel | `GET brand` → enrollment, patient, admin, affiliate URLs |

## Compare with other demos

| Command | Site | Key location |
|---------|------|----------------|
| `npm run partner-storefront` | Summit Health (this) | Server only |
| `npm run partner-api:proxy` | Minimal proxy demo | Server only |
| `npm run partner-api:demo` | Dev key in browser | **Not for production** |

Verify live deployment:

```bash
npm run check:partner-api
```
