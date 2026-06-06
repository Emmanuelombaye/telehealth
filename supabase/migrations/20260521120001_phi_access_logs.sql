-- Peak Health — PHI access audit trail (HIPAA §164.312(b) audit controls)
-- Run via supabase db push or scripts/sql/RUN_IN_SUPABASE_phi_access_logs.sql

CREATE TABLE IF NOT EXISTS public.phi_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  actor_id uuid NOT NULL,
  actor_email text,
  role text NOT NULL,
  brand_scope text,
  access_type text NOT NULL DEFAULT 'staff' CHECK (access_type IN ('staff', 'self', 'system')),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  subject_user_id uuid,
  route_path text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_phi_access_created ON public.phi_access_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phi_access_actor ON public.phi_access_logs (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phi_access_subject ON public.phi_access_logs (subject_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phi_access_resource ON public.phi_access_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_phi_access_brand ON public.phi_access_logs (brand_scope);

ALTER TABLE public.phi_access_logs ENABLE ROW LEVEL SECURITY;

-- Any authenticated user may append their own audit row
DROP POLICY IF EXISTS "phi_access_insert_own" ON public.phi_access_logs;
CREATE POLICY "phi_access_insert_own" ON public.phi_access_logs
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

DROP POLICY IF EXISTS "phi_access_super_select" ON public.phi_access_logs;
CREATE POLICY "phi_access_super_select" ON public.phi_access_logs
  FOR SELECT TO authenticated
  USING (public.get_auth_role() = 'super_admin');

DROP POLICY IF EXISTS "phi_access_brand_select" ON public.phi_access_logs;
CREATE POLICY "phi_access_brand_select" ON public.phi_access_logs
  FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'brand_admin'
    AND coalesce(brand_scope, '') = coalesce(nullif(public.get_auth_brand(), ''), '')
  );

-- Patients: accounting of disclosures — who accessed records tied to them
DROP POLICY IF EXISTS "phi_access_subject_select" ON public.phi_access_logs;
CREATE POLICY "phi_access_subject_select" ON public.phi_access_logs
  FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'patient'
    AND subject_user_id = auth.uid()
    AND access_type = 'staff'
  );

-- Clinicians may review their own access history
DROP POLICY IF EXISTS "phi_access_actor_select" ON public.phi_access_logs;
CREATE POLICY "phi_access_actor_select" ON public.phi_access_logs
  FOR SELECT TO authenticated
  USING (
    public.get_auth_role() IN ('doctor', 'pharmacy')
    AND actor_id = auth.uid()
  );

GRANT SELECT, INSERT ON public.phi_access_logs TO authenticated;
GRANT ALL ON public.phi_access_logs TO service_role;

COMMENT ON TABLE public.phi_access_logs IS
  'HIPAA-oriented PHI access log: who viewed or exported clinical/patient data, when, and from which route.';
