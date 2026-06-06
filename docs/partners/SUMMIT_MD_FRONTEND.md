# Summit MD — Frontend integration guide

**Marketing site:** [summitmd.vercel.app](https://summitmd.vercel.app)  
**Peak enrollment (after handoff):** `https://www.peak-health.io/care/summit-md/shop`  
**Repo:** [github.com/Emmanuelombaye/summitmd](https://github.com/Emmanuelombaye/summitmd)  
**Brand slug:** `summit-md` · **Brand UUID:** `7caaa526-185e-4eda-bf0e-832be6ba37a7`

---

## Frontend developer — do this first

| Step | What | Where |
|------|------|--------|
| 1 | Wire checkout button to **your server**, not Peak | `src/components/public/ShopPage.jsx` |
| 2 | Use the shared client (already built) | `src/api/partnerEnrollmentClient.js` |
| 3 | Set **Vite** env vars only (no API key) | Vercel → Environment Variables |
| 4 | Confirm SPA rewrite **excludes** `/api/*` | `vercel.json` |
| 5 | Test redirect to Peak shop | Shop → **Secure Treatment Plan & Checkout** |

---

## The one rule

```
Browser  →  POST /api/enroll-start  →  Vercel function  →  Peak partner-api
                ↑                           ↑
           frontend only              PARTNER_API_KEY here
```

**Never** put `PARTNER_API_KEY` in `VITE_*` variables or ship it in JavaScript.

---

## Frontend checklist

### A. Environment (Vercel — Production + Preview)

**Safe for frontend (prefix `VITE_`):**

```env
VITE_PARTNER_BRAND_SLUG=summit-md
VITE_PARTNER_ENROLLMENT_ENDPOINT=/api/enroll-start
VITE_PARTNER_PORTAL_ORIGIN=https://www.peak-health.io
VITE_PARTNER_RETURN_URL=https://summitmd.vercel.app/shop
```

**Server only (no `VITE_` prefix):**

```env
PARTNER_API_KEY=pk_live_sm_…
PARTNER_BRAND_SLUG=summit-md
PARTNER_API_URL=https://vzzmdbdvcofajgrjgajq.supabase.co/functions/v1/partner-api
PARTNER_PORTAL_ORIGIN=https://www.peak-health.io
PARTNER_RETURN_URL=https://summitmd.vercel.app/shop
```

Optional product mapping (frontend-safe — maps your ids to Peak UUIDs):

```env
VITE_PARTNER_PRODUCT_MAP_JSON={"weightloss_semaglutide":"<peak-product-uuid>"}
```

### B. Button / checkout flow (already implemented)

File: `src/components/public/ShopPage.jsx`

```javascript
import { startPartnerEnrollment } from "../../api/partnerEnrollmentClient";

// On "Secure Treatment Plan & Checkout":
const result = await startPartnerEnrollment({
  product: quizRecommendation,   // your shop product object (uses product.id for mapping)
  category: quizRecommendation.category,  // e.g. "subscriptions" → mapped server-side
});
window.location.assign(result.enrollment_url);
```

File: `src/api/partnerEnrollmentClient.js`

- Default endpoint: `/api/enroll-start`
- Sends `{ category, product_id?, return_url? }` to your server
- Expects `{ enrollment_url }` back
- Falls back to local cart if enrollment fails (dev-friendly)

### C. What the browser sends

```http
POST /api/enroll-start
Content-Type: application/json

{
  "category": "subscriptions",
  "return_url": "https://summitmd.vercel.app/shop"
}
```

If `VITE_PARTNER_PRODUCT_MAP_JSON` maps the product id, the client also sends `product_id` (Peak UUID).

### D. What the browser receives

```json
{
  "enrollment_url": "https://www.peak-health.io/care/summit-md/shop?brand=summit-md&brandId=7caaa526-…",
  "brand": { "slug": "summit-md", "name": "Summit MD" }
}
```

**Your job:** `window.location.href = enrollment_url` (or `assign`).

### E. Category mapping (server)

Summit shop tabs use internal names; the Vercel proxy maps them to Peak categories in `api/lib/partnerProxy.js`:

| Summit tab / category | Peak category |
|----------------------|---------------|
| `subscriptions` | `weight-loss` |
| `nutrition` | `longevity` |
| `wellness` | `longevity` |
| `devices` | `longevity` |
| `maternal` | `longevity` |

Frontend can keep sending Summit category names — mapping happens on the server.

---

## File map (SummitMD repo)

| File | Role |
|------|------|
| `src/api/partnerEnrollmentClient.js` | Frontend — calls `/api/enroll-start` |
| `src/components/public/ShopPage.jsx` | Checkout button + redirect |
| `api/enroll-start.js` | Vercel serverless route |
| `api/lib/partnerProxy.js` | Server proxy + category map |
| `vite.config.js` | Dev middleware for `/api/enroll-start` locally |
| `vercel.json` | SPA rewrite must exclude `/api/*` |
| `.env.partner.example` | Copy to `.env.local` for dev |
| `PARTNER_SETUP.md` | Short ops checklist (this doc is the frontend deep dive) |
| `scripts/test-partner-enrollment.mjs` | `npm run test:partner` |

---

## Local dev

```bash
cp .env.partner.example .env.local
# Add PARTNER_API_KEY to .env.local (server + test script only)

npm install
npm run dev
```

Open shop → complete quiz → **Secure Treatment Plan & Checkout** → should redirect to Peak white-label shop.

---

## Verify

```bash
PARTNER_API_KEY=pk_live_sm_… npm run test:partner
```

Manual:

1. Open [summitmd.vercel.app/shop](https://summitmd.vercel.app/shop)
2. Complete treatment quiz
3. Click **Secure Treatment Plan & Checkout**
4. URL should change to `https://www.peak-health.io/care/summit-md/shop?…`

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Button adds to local cart instead of redirect | Partner API down or env missing — check Network tab on `POST /api/enroll-start` |
| `500` on `/api/enroll-start` | Set `PARTNER_API_KEY` in Vercel (server env) |
| `404` from Partner API | Deploy edge function: `npx supabase functions deploy partner-api --project-ref vzzmdbdvcofajgrjgajq` |
| Redirect goes to wrong brand | Check `VITE_PARTNER_BRAND_SLUG=summit-md` and server `PARTNER_BRAND_SLUG` |
| API key in browser bundle | Remove any `VITE_PARTNER_API_KEY` from production env |

---

## Peak-side setup (not frontend — for your backend/DevOps contact)

1. SQL: `scripts/sql/RUN_IN_SUPABASE_SUMMITMD_PARTNER.sql` (Peak telehealth repo)
2. Deploy: `partner-api` edge function
3. Issue API key via Super Admin or SQL reveal

**API docs:** `https://vzzmdbdvcofajgrjgajq.supabase.co/functions/v1/partner-api?action=docs_ui`

See also: Peak repo `docs/PARTNER_CONNECT.md`, `docs/PLATFORM_MASTER_GUIDE.md` §13.
