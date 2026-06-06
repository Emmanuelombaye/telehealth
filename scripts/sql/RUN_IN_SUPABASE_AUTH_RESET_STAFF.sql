-- =============================================================================
-- PEAK HEALTH — RESET broken staff auth (optional)
-- =============================================================================
-- Usually handled automatically by: npm run auth:provision-staff
-- Run this only if that script reports it cannot delete corrupt rows.
-- Requires RUN_IN_SUPABASE_STAFF_AUTH_ALL.sql (RPC) installed first.
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'delete_broken_staff_auth_users'
  ) THEN
    PERFORM public.delete_broken_staff_auth_users();
    RAISE NOTICE 'Deleted broken staff auth rows — run: npm run auth:provision-staff';
  ELSE
    RAISE NOTICE 'RPC not found — run RUN_IN_SUPABASE_STAFF_AUTH_ALL.sql first';
  END IF;
END $$;

SELECT 'Next: npm run auth:provision-staff' AS next_step;
