# North Star MD — Frontend integration guide

**Brand slug:** `north-star-md`  
**Brand UUID:** `c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c`  
**Reference white-label partner** — custom DNS, Peak-hosted care portals, Partner API demo.

---

## Two frontend patterns (pick yours)

| Pattern | Who | Frontend work |
|---------|-----|----------------|
| **A. External marketing site** | Separate repo (like Summit MD) | Same as Summit: button → `/api/enroll-start` → redirect to `enrollment_url` |
| **B. Peak white-label paths** | Shop lives on Peak app | Link directly to `/care/north-star-md/…` — no Partner API on marketing pages |
| **C. Demo / test storefront** | Engineers validating API | `npm run partner-storefront` in Peak telehealth repo |

North Star is the **template for all three**.

---

## Pattern A — External marketing site (recommended for partners)

Use this if North Star (or a clone) has its **own** React/Vite/Next site on `northstarmd.com` / `joinnorthstarmd.com`.

### Frontend checklist

- [ ] Add server route `POST /api/enroll-start` (never call Peak from browser)
- [ ] Set server env: `PARTNER_API_KEY`, `PARTNER_BRAND_SLUG=north-star-md`
- [ ] Set frontend env: `VITE_PARTNER_ENROLLMENT_ENDPOINT=/api/enroll-start` (no key)
- [ ] Enroll button calls your server, then redirects:

```javascript
async function onEnroll(category, productId) {
  const res = await fetch("/api/enroll-start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, product_id: productId }),
  });
  const { enrollment_url, error } = await res.json();
  if (error) throw new Error(error);
  window.location.href = enrollment_url;
}
```

- [ ] Expected redirect target:

```text
https://www.peak-health.io/care/north-star-md/shop?brand=north-star-md&brandId=c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c
```

Copy the **Summit MD implementation** as a working reference: [summitmd repo](https://github.com/Emmanuelombaye/summitmd) — swap slug to `north-star-md`.

---

## Pattern B — Peak-hosted white-label (no Partner API on marketing)

Use this when patients enroll **on Peak** under the North Star brand skin.

### Direct links (paste into marketing site CTAs)

| Portal | URL |
|--------|-----|
| **Shop / enroll** | `https://www.peak-health.io/care/north-star-md/shop?brand=north-star-md&brandId=c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c` |
| **Patient login** | `https://www.peak-health.io/care/north-star-md/login` |
| **Patient app** | `https://www.peak-health.io/care/north-star-md/patient` |
| **Brand admin** | `https://www.peak-health.io/care/north-star-md/admin/login` |
| **Affiliate** | `https://www.peak-health.io/care/north-star-md/affiliate` |

### Frontend checklist (marketing site)

- [ ] **Get Started** buttons → link to shop URL above (or open in same tab)
- [ ] **Patient login** nav link → patient login URL
- [ ] Do **not** embed Peak in an iframe unless explicitly approved
- [ ] Logo/assets: `/brands/north-star-md-logo.svg` on Peak CDN/app

### Peak app theming (Peak repo — not partner marketing repo)

| File | Purpose |
|------|---------|
| `src/brand-sites/north-star-md/site.ts` | Hostnames, copy, theme colors |
| `src/lib/brands/northStar.ts` | Brand id, slug, domains |
| `src/brand-sites/index.ts` | Registers site kit |

Optional env overrides when building Peak:

```env
VITE_NORTH_STAR_BRAND_ID=c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c
VITE_NORTH_STAR_DOMAIN=northstarmd.com
```

### Custom DNS (when live)

| Subdomain | `host_kind` | Resolves to |
|-----------|-------------|-------------|
| `northstarmd.com` | `marketing` | Partner marketing |
| `care.northstarmd.com` | `care` | Rewrites to `/care/north-star-md/…` |
| `admin.northstarmd.com` | `admin` | Brand admin portal |
| `affiliate.northstarmd.com` | `affiliate` | Affiliate portal |

Hostname rows live in Supabase `brand_hostnames` — see `scripts/sql/RUN_IN_SUPABASE_MULTI_TENANT_PLATFORM.sql`.

---

## Pattern C — Demo storefront (engineers / QA)

Validates Partner API without a separate marketing repo.

### Run locally

```bash
cd d:\telehealth\telehealth

# Mock (no deploy needed)
npm run partner-storefront
# → http://localhost:5200

# Live API
$env:PARTNER_API_KEY = "pk_live_ns_…"
$env:PARTNER_API_LIVE = "1"
npm run partner-storefront
```

### What the demo frontend does

| UI action | Code | API |
|-----------|------|-----|
| Page load | `examples/partner-storefront/app.js` → `boot()` | `GET health`, `brand`, `catalog` via `/api/*` |
| **Enroll** on product card | `startEnrollment()` | `POST /api/enrollment_start` → redirect to `/care/north-star-md/shop` |
| Hero **Start enrollment** | same | same |

Server: `examples/partner-storefront/server.mjs` — proxies all Partner API calls (key server-side).

---

## Environment variables summary

### External site (Pattern A)

**Server only:**

```env
PARTNER_API_KEY=pk_live_ns_…
PARTNER_BRAND_SLUG=north-star-md
PARTNER_API_URL=https://vzzmdbdvcofajgrjgajq.supabase.co/functions/v1/partner-api
PARTNER_PORTAL_ORIGIN=https://www.peak-health.io
PARTNER_RETURN_URL=https://northstarmd.com/thank-you
```

**Frontend (safe):**

```env
VITE_PARTNER_BRAND_SLUG=north-star-md
VITE_PARTNER_ENROLLMENT_ENDPOINT=/api/enroll-start
VITE_PARTNER_PORTAL_ORIGIN=https://www.peak-health.io
VITE_PARTNER_RETURN_URL=https://northstarmd.com/thank-you
```

### Direct links only (Pattern B)

No Partner API env on marketing site — just hardcode or config the shop URL.

---

## Product / catalog (optional)

If marketing site **displays Peak products** (most partners use their own catalog):

```http
GET /functions/v1/partner-api?action=catalog&brand_slug=north-star-md
X-Partner-Api-Key: pk_live_ns_…
```

Call from **server** only. Map `product.id` from response into `enrollment_start`.

If you own the product list (typical), skip catalog sync — only use `enrollment_start` with `category` and optional `product_id`.

---

## Verify

```bash
# From Peak telehealth repo
npm run check:partner-api

# Demo storefront live mode
PARTNER_API_KEY=pk_live_ns_… PARTNER_API_LIVE=1 npm run partner-storefront
```

Manual (Pattern B):

1. Open shop URL with `brand=north-star-md`
2. Confirm North Star logo, colors, and copy
3. Complete checkout on Peak

Manual (Pattern A):

1. Click enroll on marketing site
2. Network: `POST /api/enroll-start` → 200 with `enrollment_url`
3. Browser lands on `/care/north-star-md/shop?…`

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Wrong brand skin on Peak shop | URL must include `brand=north-star-md` and correct `brandId` |
| `404` on partner-api | Deploy `partner-api` edge function |
| Custom domain shows Peak default | Add hostname in `brand_hostnames`; check `src/brand-sites/north-star-md/site.ts` hosts list |
| Demo storefront mock vs live | Set `PARTNER_API_LIVE=1` and real `PARTNER_API_KEY` |

---

## Peak-side setup (backend / DevOps)

1. Run `scripts/sql/RUN_IN_SUPABASE_MULTI_TENANT_PLATFORM.sql`
2. Set edge secret `PARTNER_API_KEYS={"north-star-md":"<key>"}`
3. Deploy `partner-api`
4. Super Admin → issue Partner API key for North Star

**API docs:** `https://vzzmdbdvcofajgrjgajq.supabase.co/functions/v1/partner-api?action=docs_ui&brand_slug=north-star-md`

See also: `docs/PARTNER_CONNECT.md`, `docs/PLATFORM_MASTER_GUIDE.md` §14, `examples/partner-storefront/README.md`.
