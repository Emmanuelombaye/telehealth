# Partner API — connect in 5 minutes

**You keep your website and products.** Peak handles checkout, intake, and care after handoff.

---

## Links (no API key needed)

| Tool | URL |
|------|-----|
| **Interactive docs** (Swagger — try endpoints) | `{BASE}?action=docs_ui` |
| **OpenAPI** (import Postman / Insomnia) | `{BASE}?action=openapi` |
| **Health check** | `{BASE}?action=health` |

Replace `{BASE}` with your Partner API base URL from Peak (e.g. `https://….supabase.co/functions/v1/partner-api`).

---

## 3 steps (own products — no catalog sync required)

### 1. Server environment

```env
PARTNER_API_KEY=pk_live_…          # Peak sends once — server only
PARTNER_BRAND_SLUG=summit-md       # your tenant slug
PARTNER_API_URL=https://….supabase.co/functions/v1/partner-api
```

**Never** use `NEXT_PUBLIC_` or put the key in frontend JavaScript.

### 2. One server route (`/api/enroll-start`)

Your backend proxies to Peak:

```http
POST {BASE}
X-Partner-Api-Key: <secret>
Content-Type: application/json

{
  "action": "enrollment_start",
  "brand_slug": "summit-md",
  "product_id": "<uuid-from-peak-mapping>",
  "category": "weight-loss"
}
```

Response → redirect browser to `enrollment_url`.

### 3. Frontend button

```javascript
async function onGetStarted(productId, category) {
  const res = await fetch("/api/enroll-start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId, category }),
  });
  const data = await res.json();
  window.location.href = data.enrollment_url;
}
```

---

## Optional: sync catalog from Peak

Only if you want Peak to drive your product list:

```http
GET ?action=catalog&brand_slug=summit-md
X-Partner-Api-Key: <secret>
```

Most partners with an existing shop **skip this** and only use `enrollment_start`.

---

## Brand-specific guide (with API key)

```http
GET ?action=connect&brand_slug=summit-md
X-Partner-Api-Key: <secret>
```

Returns steps, curl examples, and env template for your brand.

---

## Full reference

[PARTNER_API.md](./PARTNER_API.md) · [PARTNER_MODEL.md](./PARTNER_MODEL.md)

Peak Super Admin can download a ready-made `.md` + code snippets from **Brands → Partner API → Connect in 3 steps**.
