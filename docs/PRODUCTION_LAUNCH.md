# Production launch — step by step

Use this as the **master sequence** from “code in repo” to “live product.”  
Database RLS and migrations: see **`docs/ENGINEERING_ROLLOUT.md`** (apply those steps **before** going live).

---

## Phase 1 — Repository & build

1. **Branch / tag** the release candidate.
2. **Environment file** — copy `.env.production.example` → `.env.production` (or inject vars in Vercel/Netlify/GitHub Actions).
3. **Local build gate** — `npm run build` must pass with production env.
4. **CI gate** (recommended) — in GitHub Actions (or similar), export `CI=true` and set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY` from secrets, then run `npm run check:production`. Locally, the same command **warns** but does not fail unless `CI=true` or `PRODUCTION_PREFLIGHT_STRICT=1`.

---

## Phase 2 — Supabase (backend)

5. **Migrations** — `npx supabase db push` so `supabase/migrations/*.sql` is applied (orders, products, profiles, audit).
6. **Edge functions** — deploy: `assign-doctor`, `dispatch-prescription`, `pharmacy-webhook`, `stripe-*`, etc.  
   Set secrets: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, pharmacy keys, Stripe secret, webhook signing secrets if used.
7. **Auth JWT claims** — for every staff user set **`app_metadata.role`** and brand admins **`app_metadata.brand_id`** (must match `orders.sub_brand`).
8. **RLS smoke** — patient sees only own orders; brand admin only their brand; doctor/pharmacy/super_admin per policy.

---

## Phase 3 — Payments & pharmacy

9. **Stripe** — live mode keys in Edge + `VITE_STRIPE_PUBLISHABLE_KEY` in frontend; test one real micro-charge and refund.
10. **Pharmacy** — production `PHARMACY_API_URL` / `PHARMACY_API_KEY` on `dispatch-prescription`; confirm webhook URL reachable from vendor; test **failure path** (502 + `pharmacy_note`).

---

## Phase 4 — Third-party & content

11. **Referly** — set `VITE_REFERLY_SITE_ID` at build time (replaces placeholder in `index.html` via Vite).  
12. **Scheduling** — set `VITE_SCHEDULING_EMBED_URL` or per-product `scheduling_embed_url` in `products.features`. After `db push`, run **`npm run check:scheduling-gate`** (with Supabase URL + anon key in the environment; optional service role for deeper probes — see `docs/ENGINEERING_ROLLOUT.md` Step 3b).

---

## Phase 5 — Operations (control delays & failures)

13. **Monitoring** — connect Sentry (or similar) to the SPA + Edge logs in Supabase Dashboard.
14. **Alerts** — Edge function errors, 5xx rate, Stripe webhook failures (Stripe Dashboard), pharmacy vendor dashboard.
15. **Runbooks** — one page each: *Pharmacy dispatch failed*, *Webhook duplicate*, *Doctor pool empty for state*, *Stripe payment succeeded but order insert failed* (manual reconciliation SQL).
16. **Backups** — Supabase PITR / daily backup; test a restore on a staging project yearly.

---

## Phase 6 — Legal & clinical (outside code)

17. **HIPAA / BAA** — if you store PHI: signed BAA with Supabase (Business plan), policies, workforce training.
18. **Clinical SOP** — who acts when `pharmacy_note` or `medical_review` stalls; SLAs for clinician response.

---

## Phase 7 — Go-live smoke (blocking)

| # | Actor | Action |
|---|--------|--------|
| 1 | Patient | Register → shop → pay (or test mode) → order row + timeline |
| 2 | System | `assign-doctor` runs → `doctor_id` set when rules match |
| 3 | Doctor | Login → queue → dispatch / consult path |
| 4 | Brand admin | `/admin/orders` scoped to brand |
| 5 | Super admin | Cross-brand + `/admin/affiliates` if table exists |
| 6 | Webhook | Send test payload to `pharmacy-webhook` → order fields update |

---

## Honest scope

This repo gives you **application + database + edge** building blocks. **“Everything including every delay and webhook under control”** also requires **hosted observability, vendor dashboards, and human runbooks** — add those in Phase 5; they are not fully automated inside this repository.
