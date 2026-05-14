# Legacy SQL scripts (repo root)

These files are **historical / one-off** snippets. They are **not** the source of truth for production security.

## Authoritative path

- **`supabase/migrations/*.sql`** — apply in order via `supabase db push` (or paste in order in the SQL editor).

## Do **not** run on production without explicit review

These can **widen RLS**, **drop policies**, or **duplicate** logic from migrations:

| File | Risk |
|------|------|
| `supabase_mvp_rls_reset.sql` | Opens RLS on core tables for “MVP” |
| `supabase_add_zoom_url.sql` | Historically used permissive `USING (true)` on `orders` |
| `supabase_wipe_reset.sql` / `supabase_full_rollback.sql` | Destructive |
| `supabase_inject_enterprise_volume.sql` / `supabase_undo_injection.sql` | Demo data / undo |
| `seed.sql` (if present) | May disable RLS for demos |
| `pharmacy_integration_master.sql` / `pharmacy_integration_master_v2.sql` | Overlapping order policies — reconcile with migrations first |

## Safe to use as **reference** only (often superseded by migrations)

Examples: `supabase_fix_recursion_final.sql`, `supabase_admin_audit_and_scope.sql` (content merged into `20260514143000_production_core_rbac.sql`), `supabase_affiliate_system.sql` (schema for affiliates — run once if you need that module).

When in doubt: **backup**, then **only** apply files under `supabase/migrations/` unless a senior engineer has merged their intent into that tree.
