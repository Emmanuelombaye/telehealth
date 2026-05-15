-- =============================================================================
-- PEAK HEALTH — Video enrollment + Calendly/Cal.com scheduling (RUN IN SUPABASE)
-- =============================================================================
-- Paste this entire file into: Supabase Dashboard → SQL Editor → Run
-- Safe to re-run (idempotent). Run once per project.
--
-- After this:
--   1) Superadmin → Doctors: set calendly_url + licensed_states per doctor
--   2) Superadmin → Products → edit product → "Checkout & sync video"
--   3) Optional: run scripts/sql/RUN_IN_SUPABASE_seed_example_video_product.sql
--   4) npm run check:scheduling-gate (from repo with .env)
-- =============================================================================

-- ── A) Profiles — doctor calendar + licensing (probe failed: calendly_url missing) ──
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calendly_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS npi_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credentials TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS licensed_states TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS patients_count INTEGER DEFAULT 0;

COMMENT ON COLUMN public.profiles.calendly_url IS 'Calendly or Cal.com booking URL for enrollment embed + appointments.';
COMMENT ON COLUMN public.profiles.licensed_states IS 'Comma-separated US state codes, e.g. CA,NY,TX';

-- ── B) Orders — shipping + video + scheduling correlation ──
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_state TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address_line1 TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_city TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_zip TEXT;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_status TEXT DEFAULT 'not_requested';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_join_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_doctor_message TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_rescheduled_time TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consultation_time TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consultation_live BOOLEAN DEFAULT false;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS intake_answers JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS intake_complete BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_vitals JSONB;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS scheduling_ref TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS scheduling_booking_url TEXT;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS requires_sync_video BOOLEAN;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS video_routing_reasons JSONB;

CREATE INDEX IF NOT EXISTS idx_orders_scheduling_ref
  ON public.orders (scheduling_ref)
  WHERE scheduling_ref IS NOT NULL;

-- ── C) Pending bookings (Calendly fires before order row exists) ──
CREATE TABLE IF NOT EXISTS public.scheduling_pending_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  consumed_at TIMESTAMPTZ,
  scheduling_ref TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  invitee_name TEXT,
  meeting_url TEXT,
  consultation_time_iso TIMESTAMPTZ,
  zoom_status TEXT DEFAULT 'confirmed',
  provider TEXT DEFAULT 'calendly',
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_number TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_scheduling_pending_ref_active
  ON public.scheduling_pending_bookings (scheduling_ref)
  WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_scheduling_pending_email_created
  ON public.scheduling_pending_bookings (patient_email, created_at DESC);

ALTER TABLE public.scheduling_pending_bookings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.scheduling_pending_bookings FROM PUBLIC;
GRANT ALL ON TABLE public.scheduling_pending_bookings TO service_role;

-- ── D) Admin consult routing rules (optional cross-product rules) ──
CREATE TABLE IF NOT EXISTS public.consult_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,
  match_states TEXT[] NULL,
  match_categories TEXT[] NULL,
  match_product_ids UUID[] NULL,
  requires_sync_video BOOLEAN NOT NULL DEFAULT true,
  clinical_json JSONB NULL,
  label TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS consult_routing_rules_active_priority
  ON public.consult_routing_rules (active, priority);

ALTER TABLE public.consult_routing_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consult_routing_rules_select_public" ON public.consult_routing_rules;
CREATE POLICY "consult_routing_rules_select_public"
  ON public.consult_routing_rules FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- Requires get_auth_role() from production_core migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_auth_role'
  ) THEN
    DROP POLICY IF EXISTS "consult_routing_super_admin_all" ON public.consult_routing_rules;
    EXECUTE $pol$
      CREATE POLICY "consult_routing_super_admin_all"
        ON public.consult_routing_rules FOR ALL TO authenticated
        USING (public.get_auth_role() = 'super_admin')
        WITH CHECK (public.get_auth_role() = 'super_admin')
    $pol$;
  ELSE
    RAISE NOTICE 'get_auth_role() not found — apply supabase/migrations/20260514143000_production_core_rbac.sql first, then re-run policy section if needed.';
  END IF;
END $$;

GRANT SELECT ON TABLE public.consult_routing_rules TO anon, authenticated;
GRANT ALL ON TABLE public.consult_routing_rules TO service_role;

-- ── E) Superadmin can update doctor profiles (calendar URLs) ──
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_auth_role'
  ) THEN
    DROP POLICY IF EXISTS "Profiles: super_admin update any" ON public.profiles;
    EXECUTE $pol$
      CREATE POLICY "Profiles: super_admin update any" ON public.profiles
        FOR UPDATE TO authenticated
        USING (public.get_auth_role() = 'super_admin')
        WITH CHECK (public.get_auth_role() = 'super_admin')
    $pol$;
  END IF;
END $$;

-- ── F) Verify (read results in SQL editor) ──
SELECT 'profiles.calendly_url' AS check_item,
       EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'calendly_url'
       ) AS ok
UNION ALL
SELECT 'orders.scheduling_ref',
       EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'scheduling_ref'
       )
UNION ALL
SELECT 'consult_routing_rules table',
       to_regclass('public.consult_routing_rules') IS NOT NULL
UNION ALL
SELECT 'scheduling_pending_bookings table',
       to_regclass('public.scheduling_pending_bookings') IS NOT NULL;
