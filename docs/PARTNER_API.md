# Peak Health — Partner API (private v1)

**Audience:** White-label partners with their **own website** (homepage, online store, marketing).  
**Not a public API** — no marketplace, no self-serve keys. Documentation and credentials are shared **only under contract / NDA** when a partner integrates their existing front end to our **branded portals**.

**Business model:** [PARTNER_MODEL.md](./PARTNER_MODEL.md) · **Operations:** [PARTNER_INTEGRATION.md](./PARTNER_INTEGRATION.md) · **5-min guide:** [PARTNER_CONNECT.md](./PARTNER_CONNECT.md)

---

## Quick connect

| Step | Link / command |
|------|----------------|
| **1. Browse interactive docs** | [Open Swagger UI](https://kvopgyhcjcniaocjozje.supabase.co/functions/v1/partner-api?action=docs_ui) — click **Authorize**, paste your `X-Partner-Api-Key`, try endpoints |
| **2. Import to Postman** | Import → Link → `https://kvopgyhcjcniaocjozje.supabase.co/functions/v1/partner-api?action=openapi` |
| **3. Brand connect guide (JSON)** | `GET ?action=connect&brand_slug=YOUR_SLUG` with `X-Partner-Api-Key` — steps, curl, env example |
| **4. Verify deployment** | `curl "https://kvopgyhcjcniaocjozje.supabase.co/functions/v1/partner-api?action=health"` |
| **5. Enroll handoff (required)** | `POST` body `{ "action": "enrollment_start", "brand_slug": "YOUR_SLUG", "product_id": "…" }` → redirect to `enrollment_url` |

**Own product pages?** Skip catalog. Only wire step 5 from your server. Peak Super Admin downloads ready code from **Brands → Partner API**.
**No partner cart/checkout:** partner site collects intent only, then redirects into Peak flow.

Machine-readable index (JSON): `GET ?action=docs` · OpenAPI: `GET ?action=openapi`

---

## How it works

1. Partner keeps **their** product UI (optional: `GET catalog` to sync from Peak).
2. User clicks **Get started** → partner backend calls **enrollment_start**.
3. API returns **enrollment_url** → redirect to Peak **branded portal** (`/care/{slug}/shop`).
4. Checkout, intake, doctor queue, PHI stay on Peak portals (same Supabase backend).

### 9-step enrollment journey (required for partner own-product sites)

1. Partner product page (own UI)  
2. Partner backend calls `POST enrollment_start`  
3. Redirect to `enrollment_url` (`/care/{slug}/shop`)  
4. Checkout (Peak portal)  
5. Payment confirmation  
6. Account setup  
7. Two-factor + identity verification  
8. Medical intake + scheduling  
9. Land in branded patient portal (`patient_portal_url`)  

---

## Base URL

```
https://kvopgyhcjcniaocjozje.supabase.co/functions/v1/partner-api
```

| Resource | URL | Auth |
|----------|-----|------|
| Interactive docs (Swagger UI) | `GET ?action=docs_ui` | No |
| OpenAPI 3.0 (Postman / codegen) | `GET ?action=openapi` | No |
| Machine-readable index | `GET ?action=docs` | No |
| Brand connect guide | `GET ?action=connect&brand_slug=…` | Yes |

---

## Authentication

| Header | Value |
|--------|--------|
| `X-Partner-Api-Key` | Secret from Peak |

**Edge secrets (Supabase):**

| Secret | Purpose |
|--------|---------|
| `PARTNER_API_KEY` | Single shared key (dev/demo) |
| `PARTNER_API_KEYS` | JSON map per brand: `{"north-star-md":"secret…"}` — key scoped to one slug |
| `PEAK_APP_ORIGIN` | Default portal host, e.g. `https://www.peak-health.io` |

**Production:** call from **partner backend only**. Never embed the key in public JavaScript.

---

## Endpoints

### Health

```http
GET ?action=health
```

No API key. Returns `{ ok, version, auth_configured }`.

---

### Brand + portal URLs

```http
GET ?action=brand&brand_slug=north-star-md
X-Partner-Api-Key: <secret>
```

**Response**

```json
{
  "brand": {
    "id": "c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c",
    "slug": "north-star-md",
    "name": "North Star MD",
    "domain": "northstarmd.com",
    "status": "active"
  },
  "portals": {
    "enrollment_url": "https://www.peak-health.io/care/north-star-md/shop?brand=north-star-md&brandId=…",
    "patient_portal_url": "https://www.peak-health.io/care/north-star-md/patient",
    "patient_login_url": "https://www.peak-health.io/care/north-star-md/login",
    "brand_admin_url": "https://joinnorthstarmd.com/care/north-star-md/admin/login",
    "affiliate_portal_url": "https://joinnorthstarmd.com/care/north-star-md/affiliate/login",
    "provider_portal_url": "https://www.peak-health.io/providers/login"
  }
}
```

`GET ?action=portals` — same as `brand`.

Use **`portal_origin`** on enrollment to point URLs at partner subdomain:

```json
"portal_origin": "https://care.northstarmd.com"
```

---

### Product catalog

```http
GET ?action=catalog&brand_slug=north-star-md
X-Partner-Api-Key: <secret>
```

Returns active `products` with per-product `enrollment_url`.

---

### Start enrollment

```http
POST /
Content-Type: application/json
X-Partner-Api-Key: <secret>

{
  "action": "enrollment_start",
  "brand_slug": "north-star-md",
  "category": "weight-loss",
  "product_id": "optional-uuid",
  "portal_origin": "https://care.northstarmd.com",
  "return_url": "https://partner.com/thank-you"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `brand_slug` | Yes* | *Optional if API key is scoped to one brand |
| `category` | No | Pre-select shop category |
| `product_id` | No | Pre-select product |
| `portal_origin` | No | Branded subdomain base URL |
| `return_url` | No | Passed as query param for post-enrollment return (partner handles) |

**Response**

```json
{
  "session_id": "uuid",
  "brand": { "id": "…", "slug": "north-star-md", "name": "North Star MD" },
  "enrollment_url": "…",
  "patient_portal_url": "…",
  "patient_login_url": "…",
  "brand_admin_url": "…",
  "affiliate_portal_url": "…",
  "provider_portal_url": "…",
  "next_step": "redirect",
  "message": "Send the patient to enrollment_url…"
}
```

**Partner UX:** redirect browser to `enrollment_url`.

---

## Example: partner backend (Node)

```javascript
const API = "https://kvopgyhcjcniaocjozje.supabase.co/functions/v1/partner-api";
const KEY = process.env.PARTNER_API_KEY;

export async function getCatalog(brandSlug) {
  const res = await fetch(
    `${API}?action=catalog&brand_slug=${encodeURIComponent(brandSlug)}`,
    { headers: { "X-Partner-Api-Key": KEY } },
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function startEnrollment(brandSlug, opts = {}) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "X-Partner-Api-Key": KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "enrollment_start", brand_slug: brandSlug, ...opts }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

Working demos:

| Demo | Command | Notes |
|------|---------|--------|
| **Summit Health storefront** (recommended) | `npm run partner-storefront` | Full UI + mock API; set `PARTNER_API_LIVE=1` + key for Supabase |
| API test script | `npm run test:partner-storefront` | Hits `/api/*` on port 5200 |
| Minimal proxy | `npm run partner-api:proxy` | Key on server, simple HTML |
| Dev (key in browser) | `npm run partner-api:demo` | **Not for production** |

See `examples/partner-storefront/README.md`.

---

## Errors

| HTTP | Meaning |
|------|---------|
| 401 | Missing or invalid API key |
| 403 | Key valid but not allowed for requested `brand_slug` |
| 404 | Brand not found |
| 500 | Server/database error |

---

## Deploy & verify

```bash
npx supabase functions deploy partner-api --project-ref kvopgyhcjcniaocjozje
```

Set secrets in Supabase Dashboard. JWT verification **OFF** for `partner-api` (`supabase/config.toml`).

```bash
npm run check:partner-api
PARTNER_API_KEY=your-secret npm run check:partner-api
```

---

## Demos

| Mode | Command |
|------|---------|
| **Partner storefront (mock + live)** | `npm run partner-storefront` |
| Automated API test | `npm run test:partner-storefront` |
| Dev (key in browser — not for production) | `npm run partner-api:demo` |
| Production pattern (minimal) | `npm run partner-api:proxy` |

---

## v2 roadmap

- Order status by partner reference  
- Outbound webhooks (approved, shipped)  
- Per-partner rate limits and audit log  

---

## Not in scope (v1)

- Public API or developer portal  
- Self-serve API key signup  
- Raw Supabase credentials  
- Full patient chart API on the partner’s domain  
- Partner-hosted checkout with PHI (clinical workflows stay on Peak branded portals)

Clinical data connects through **one Supabase backend** with tenant scoping — the API only bridges **partner marketing → branded enrollment**.
