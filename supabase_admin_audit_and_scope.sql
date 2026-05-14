-- ═══════════════════════════════════════════════════════════════════════════
-- Peak Health — Admin audit trail + JWT role alignment notes
-- Run in Supabase SQL Editor after reviewing existing policies on `orders` / `profiles`.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  actor_id UUID NOT NULL,
  actor_email TEXT,
  role TEXT NOT NULL,
  brand_scope TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON public.admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_brand ON public.admin_audit_logs (brand_scope);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_audit_insert_authenticated_staff" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_insert_authenticated_staff" ON public.admin_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND (
      coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('brand_admin', 'super_admin')
      OR coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('brand_admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "admin_audit_super_select" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_super_select" ON public.admin_audit_logs
  FOR SELECT TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'super_admin'
    OR coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'super_admin'
  );

DROP POLICY IF EXISTS "admin_audit_brand_select" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_brand_select" ON public.admin_audit_logs
  FOR SELECT TO authenticated
  USING (
    (
      coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'brand_admin'
      OR coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'brand_admin'
    )
    AND coalesce(brand_scope, '') = coalesce(
      nullif(auth.jwt() -> 'app_metadata' ->> 'brand_id', ''),
      nullif(auth.jwt() -> 'user_metadata' ->> 'brand_id', '')
    )
  );

COMMENT ON TABLE public.admin_audit_logs IS 'Non-clinical admin/superadmin action log; populated from the web app.';
