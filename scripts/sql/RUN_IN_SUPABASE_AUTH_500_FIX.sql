-- =============================================================================
-- PEAK HEALTH — FIX Auth 500 (SQL Editor safe — no ALTER on auth.users)
-- =============================================================================
-- Best path:
--   1. RUN_IN_SUPABASE_STAFF_AUTH_ALL.sql  (installs RPC helpers)
--   2. npm run auth:provision-staff        (fixes tokens + creates users)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'fix_auth_null_tokens'
  ) THEN
    PERFORM public.fix_auth_null_tokens();
    RAISE NOTICE 'Called fix_auth_null_tokens() — now run: npm run auth:provision-staff';
  ELSE
    RAISE NOTICE 'RPC not found — run RUN_IN_SUPABASE_STAFF_AUTH_ALL.sql first, then npm run auth:provision-staff';
  END IF;
END $$;

SELECT 'Next: npm run auth:provision-staff (from project folder with .env.production)' AS next_step;
