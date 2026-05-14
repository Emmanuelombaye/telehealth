-- =============================================================================
-- Peak Health — admin_questionnaires + idempotent orders column parity + audit
-- Fixes PostgREST 400 (unknown orders columns) and 404 (missing admin tables).
-- Apply: supabase db push  OR  paste into Supabase SQL editor (single run).
-- Idempotent with 20260514143000_production_core_rbac.sql (helpers duplicated below).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0) JWT / profile role helpers (required by RLS policies below)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(trim(auth.jwt() -> 'app_metadata' ->> 'role'), ''),
    NULLIF(trim(auth.jwt() -> 'user_metadata' ->> 'role'), ''),
    (SELECT p.role::text FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1),
    'patient'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_auth_brand()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(trim(auth.jwt() -> 'app_metadata' ->> 'brand_id'), ''),
    NULLIF(trim(auth.jwt() -> 'user_metadata' ->> 'brand_id'), ''),
    (SELECT p.brand_id::text FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1),
    ''
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_auth_brand() TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 1) Admin audit log (idempotent — projects that never ran production_core)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  actor_id uuid NOT NULL,
  actor_email text,
  role text NOT NULL,
  brand_scope text,
  action text NOT NULL,
  target_type text,
  target_id text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON public.admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_brand ON public.admin_audit_logs (brand_scope);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_audit_insert_authenticated_staff" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_insert_authenticated_staff" ON public.admin_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND public.get_auth_role() IN ('brand_admin', 'super_admin')
  );

DROP POLICY IF EXISTS "admin_audit_super_select" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_super_select" ON public.admin_audit_logs
  FOR SELECT TO authenticated
  USING (public.get_auth_role() = 'super_admin');

DROP POLICY IF EXISTS "admin_audit_brand_select" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_brand_select" ON public.admin_audit_logs
  FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'brand_admin'
    AND coalesce(brand_scope, '') = coalesce(nullif(public.get_auth_brand(), ''), '')
  );

GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;

COMMENT ON TABLE public.admin_audit_logs IS 'Non-clinical admin/superadmin action log; populated from the web app.';

-- -----------------------------------------------------------------------------
-- 2) Admin questionnaires (admin UI: src/app/pages/admin/pages/Questionnaire.tsx)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  name text NOT NULL DEFAULT 'Untitled questionnaire',
  slug text,
  status text NOT NULL DEFAULT 'draft',
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  brand_id text,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_questionnaires_created ON public.admin_questionnaires (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_questionnaires_brand ON public.admin_questionnaires (brand_id);

ALTER TABLE public.admin_questionnaires ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_questionnaires_super_all" ON public.admin_questionnaires;
CREATE POLICY "admin_questionnaires_super_all" ON public.admin_questionnaires
  FOR ALL TO authenticated
  USING (public.get_auth_role() = 'super_admin')
  WITH CHECK (public.get_auth_role() = 'super_admin');

DROP POLICY IF EXISTS "admin_questionnaires_brand_select" ON public.admin_questionnaires;
CREATE POLICY "admin_questionnaires_brand_select" ON public.admin_questionnaires
  FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'brand_admin'
    AND coalesce(brand_id, '') = coalesce(nullif(public.get_auth_brand(), ''), '')
  );

DROP POLICY IF EXISTS "admin_questionnaires_brand_insert" ON public.admin_questionnaires;
CREATE POLICY "admin_questionnaires_brand_insert" ON public.admin_questionnaires
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_auth_role() = 'brand_admin'
    AND coalesce(brand_id, '') = coalesce(nullif(public.get_auth_brand(), ''), '')
  );

DROP POLICY IF EXISTS "admin_questionnaires_brand_update" ON public.admin_questionnaires;
CREATE POLICY "admin_questionnaires_brand_update" ON public.admin_questionnaires
  FOR UPDATE TO authenticated
  USING (
    public.get_auth_role() = 'brand_admin'
    AND coalesce(brand_id, '') = coalesce(nullif(public.get_auth_brand(), ''), '')
  )
  WITH CHECK (
    public.get_auth_role() = 'brand_admin'
    AND coalesce(brand_id, '') = coalesce(nullif(public.get_auth_brand(), ''), '')
  );

DROP POLICY IF EXISTS "admin_questionnaires_brand_delete" ON public.admin_questionnaires;
CREATE POLICY "admin_questionnaires_brand_delete" ON public.admin_questionnaires
  FOR DELETE TO authenticated
  USING (
    public.get_auth_role() = 'brand_admin'
    AND coalesce(brand_id, '') = coalesce(nullif(public.get_auth_brand(), ''), '')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_questionnaires TO authenticated;
GRANT ALL ON public.admin_questionnaires TO service_role;

COMMENT ON TABLE public.admin_questionnaires IS 'Configurable intake questionnaires per brand; JSON question definitions.';

-- -----------------------------------------------------------------------------
-- 3) Orders — columns referenced by ORDERS_ADMIN_NON_CLINICAL_SELECT (PostgREST)
--     (aligned with supabase_add_missing_columns.sql + fulfillment fields)
-- -----------------------------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_status TEXT DEFAULT 'not_requested';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_join_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_doctor_message TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_rescheduled_time TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consultation_time TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consultation_live BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consultation_submitted_date TEXT;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS follow_up_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kyc_session_id TEXT;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pharmacy_note TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pharmacy_email TEXT;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_delivery TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS urgent BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS intake_complete BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS wait_mins INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "time" TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS last_approved_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS next_refill_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refill_interval_days INTEGER;
