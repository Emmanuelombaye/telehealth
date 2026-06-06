# North Star MD — Partner Storefront Demo

Standalone **second frontend** for North Star MD that exercises the [Partner API](../../docs/PARTNER_API.md) the way a real external marketing site would.

> **Full North Star frontend guide:** [`docs/partners/NORTH_STAR_MD_FRONTEND.md`](../../docs/partners/NORTH_STAR_MD_FRONTEND.md)

---

## Frontend developer — quick start

| Step | Command / action |
|------|------------------|
| 1 | `npm run partner-storefront` from Peak telehealth repo root |
| 2 | Open **http://localhost:5200** |
| 3 | Click **Enroll** on a product card |
| 4 | Confirm redirect to `/care/north-star-md/shop?…` |

**Rule:** This demo never puts the API key in the browser. All calls go through `server.mjs` → Peak `partner-api`.

---

## Architecture

```
app.js (browser)  →  fetch /api/enrollment_start  →  server.mjs  →  Peak partner-api
                              ↑
                        no API key here
```

| File | Role |
|------|------|
| `app.js` | UI — catalog cards, enroll buttons, portal links |
| `server.mjs` | Local server + Partner API proxy |
| `index.html` | Layout |
| `styles.css` | Demo styling |

---

## Run modes

### Mock (no Supabase deploy)

```bash
cd d:\telehealth\telehealth
npm run partner-storefront
```

Open **http://localhost:5200** — uses local mock matching live API shape.

### Live Supabase API

After deploying `partner-api` and running multi-tenant SQL:

```powershell
$env:PARTNER_API_KEY = "pk_live_ns_…"
$env:PARTNER_API_LIVE = "1"
npm run partner-storefront
```

---

## What each UI action does

| UI action | Frontend code | Server → API |
|-----------|---------------|--------------|
| Page load | `boot()` in `app.js` | `GET health`, `docs`, `brand`, `catalog` |
| Product card **Enroll** | `startEnrollment({ category, product_id })` | `POST enrollment_start` |
| Hero **Start enrollment** | `startEnrollment()` | same |
| Portal links panel | `renderPortals()` | from `GET brand` response |

After enroll, browser redirects to:

```text
https://www.peak-health.io/care/north-star-md/shop?brand=north-star-md&brandId=…
```

---

## Copy this pattern to your marketing site

Minimal frontend button (same as `app.js`):

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

Working production example: [Summit MD repo](https://github.com/Emmanuelombaye/summitmd) — see [`docs/partners/SUMMIT_MD_FRONTEND.md`](../../docs/partners/SUMMIT_MD_FRONTEND.md).

---

## Compare with other demos

| Command | Site | Key location |
|---------|------|----------------|
| `npm run partner-storefront` | North Star demo (this) | Server only |
| `npm run partner-api:proxy` | Minimal proxy demo | Server only |
| `npm run partner-api:demo` | Dev key in browser | **Not for production** |

Verify live deployment:

```bash
npm run check:partner-api
```
