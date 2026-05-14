# Engineering rollout — step by step

Goal: one enforced security story (RLS + JWT), real data paths, no accidental “open” policies from legacy scripts.

## Step 1 — Freeze and backup

- Tag the current deployed commit.
- Supabase: **Database backup** (Dashboard → Database → Backups) before any policy change.

## Step 2 — Link CLI (optional but recommended)

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

## Step 3 — Apply migrations (ordered)

Migrations run in filename order:

1. `supabase/migrations/20260514143000_production_core_rbac.sql` — helpers, `admin_audit_logs`, `orders`, `products`, optional `affiliates` policies.
2. `supabase/migrations/20260514143100_profiles_rls_core.sql` — `profiles` RLS using `get_auth_role()`.

```bash
npx supabase db push
```

If you cannot use the CLI, paste **both** files into the SQL editor **in that order**.

## Step 4 — Auth claims (required for RLS)

For each staff user, set **server-side** JWT claims (preferred: `app_metadata`):

- `role`: `patient` | `doctor` | `pharmacy` | `brand_admin` | `super_admin` | `affiliate`
- `brand_id`: string matching `orders.sub_brand` for **brand admins** (e.g. `Peak Health`)

Use the Supabase **Auth Admin API** or Dashboard → Authentication → user → **App metadata**.

The app reads `app_metadata` before `user_metadata` (`src/lib/auth-store.ts`).

## Step 5 — Optional modules

- Affiliates: run `supabase_affiliate_system.sql` once if you use `/admin/affiliates` and the affiliate portal.
- Consult routing: `supabase_consult_routing_rules.sql` if you use DB-driven video rules.

## Step 6 — Smoke tests (blocking)

Run through this matrix and fix failures before calling prod “ready”:

| Persona | Path | Expect |
|---------|------|--------|
| Patient | Shop checkout | Order insert succeeds; sees own orders only |
| Doctor | Queue / consult | Sees orders per RLS; dispatch still works |
| Brand admin | `/admin/orders` | Only same `sub_brand`; can update fulfillment fields |
| Super admin | `/superadmin`, `/admin/affiliates` | Cross-brand read; affiliates list if table exists |
| Anon | Shop catalog | `products` select for **active** only |

## Step 7 — Retire legacy SQL

Treat root `supabase_*.sql` as **archived** (see `supabase/LEGACY_SQL.md`). Do not paste random files into prod to “fix” an issue.

## Step 8 — Repo hygiene

```bash
npm run check:engineering
```

Fix any reported gaps (missing migrations folder, etc.).

## Step 9 — Ongoing (outside this repo)

- Error tracking (e.g. Sentry), uptime, log retention.
- BAA / HIPAA program if you handle PHI.
- Penetration test before high-risk launch.
