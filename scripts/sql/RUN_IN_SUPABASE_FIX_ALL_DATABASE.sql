-- =============================================================================
-- PEAK HEALTH — FIX ALL DATABASE (SUPABASE SQL EDITOR ONLY)
-- =============================================================================
-- WHERE: Supabase Dashboard → SQL Editor → New query → paste ALL of this → RUN
-- DO NOT paste deploy-browser-edge-functions.ps1 here (that is not SQL).
--
-- After RUN: scroll down — every verification row should show ok = true
-- SAFE TO RE-RUN: idempotent. Does NOT delete orders or auth users.
-- =============================================================================

BEGIN;

-- =============================================================================
-- PART 1 — Role helpers (JWT + profiles; avoids RLS recursion)
-- =============================================================================
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

-- =============================================================================
-- PART 2 — Profiles (signup trigger + columns + RLS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'patient',
  email TEXT,
  full_name TEXT,
  brand_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brand_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'patient';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calendly_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS npi_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credentials TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS licensed_states TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS patients_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT;

DO $$ BEGIN
  ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email, full_name, brand_id)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'role'), ''), 'patient'),
    NEW.email,
    NULLIF(trim(
      COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' ||
      COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    ), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'brand_id', '')), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    role = COALESCE(NULLIF(EXCLUDED.role, ''), public.profiles.role);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'profile insert skipped for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, role, email, full_name, brand_id)
SELECT
  u.id,
  COALESCE(NULLIF(trim(u.raw_user_meta_data->>'role'), ''), 'patient'),
  u.email,
  NULLIF(trim(
    COALESCE(u.raw_user_meta_data->>'first_name', '') || ' ' ||
    COALESCE(u.raw_user_meta_data->>'last_name', '')
  ), ''),
  NULLIF(trim(COALESCE(u.raw_user_meta_data->>'brand_id', '')), '')
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET email = COALESCE(EXCLUDED.email, public.profiles.email);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles: view own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: staff view all" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: insert self" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: update own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: super_admin update any" ON public.profiles;
DROP POLICY IF EXISTS "own_select" ON public.profiles;
DROP POLICY IF EXISTS "own_update" ON public.profiles;
DROP POLICY IF EXISTS "open_insert" ON public.profiles;
DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.profiles;

CREATE POLICY "Profiles: view own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Profiles: staff view all" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IN ('doctor', 'pharmacy', 'brand_admin', 'super_admin', 'affiliate'));

CREATE POLICY "Profiles: insert self" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles: update own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Profiles: super_admin update any" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.get_auth_role() = 'super_admin')
  WITH CHECK (public.get_auth_role() = 'super_admin');

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- =============================================================================
-- PART 3 — Orders columns + scoped RLS
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) THEN
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES auth.users(id)';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sub_brand TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_status TEXT DEFAULT ''not_requested''';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_join_url TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_doctor_message TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_rescheduled_time TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consultation_time TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consultation_live BOOLEAN DEFAULT false';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consultation_submitted_date TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS enrollment_video_required BOOLEAN NOT NULL DEFAULT false';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT ''pending''';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS follow_up_reason TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_reason TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT ''pending''';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kyc_session_id TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS referral_code TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_email TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pharmacy_note TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pharmacy_email TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_url TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_delivery TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS urgent BOOLEAN DEFAULT false';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS intake_complete BOOLEAN DEFAULT false';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS wait_mins INTEGER';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "time" TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS last_approved_at TIMESTAMPTZ';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS next_refill_at TIMESTAMPTZ';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refill_interval_days INTEGER';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS scheduling_ref TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS scheduling_booking_url TEXT';

    -- Human-readable order ref + clinical/display columns (PostgREST 42703 fixes)
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT';
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number) WHERE order_number IS NOT NULL';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_name TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_avatar TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_age INTEGER';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_country TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS medication TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dosage_instructions TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS category TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ordered_date TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pharmacy TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS doctor TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS doctor_note TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mrn TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT ''[]''::jsonb';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS intake_notes TEXT';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS intake_answers JSONB DEFAULT ''{}''::jsonb';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_vitals JSONB DEFAULT ''{}''::jsonb';
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipped_date TEXT';
    EXECUTE $q$
      UPDATE public.orders
      SET order_number = 'ORD-' || UPPER(SUBSTRING(id::text FROM 1 FOR 8))
      WHERE order_number IS NULL OR TRIM(order_number) = ''
    $q$;

    EXECUTE 'ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "MVP Public Select" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "MVP Public Insert" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "MVP Public Update" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Orders: patient view own" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Orders: brand admin view" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Orders: global staff view" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Orders: patient insert own" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Orders: brand admin insert scoped" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Orders: super admin insert" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Orders: clinical staff update" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Orders: brand admin update scoped" ON public.orders';

    EXECUTE $p$
      CREATE POLICY "Orders: patient view own" ON public.orders
      FOR SELECT TO authenticated USING (auth.uid() = user_id)
    $p$;
    EXECUTE $p$
      CREATE POLICY "Orders: brand admin view" ON public.orders
      FOR SELECT TO authenticated
      USING (
        public.get_auth_role() = 'brand_admin'
        AND coalesce(sub_brand, '') = coalesce(nullif(public.get_auth_brand(), ''), '')
      )
    $p$;
    EXECUTE $p$
      CREATE POLICY "Orders: global staff view" ON public.orders
      FOR SELECT TO authenticated
      USING (public.get_auth_role() IN ('doctor', 'pharmacy', 'super_admin'))
    $p$;
    EXECUTE $p$
      CREATE POLICY "Orders: patient insert own" ON public.orders
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)
    $p$;
    EXECUTE $p$
      CREATE POLICY "Orders: brand admin insert scoped" ON public.orders
      FOR INSERT TO authenticated
      WITH CHECK (
        public.get_auth_role() = 'brand_admin'
        AND coalesce(sub_brand, '') = coalesce(nullif(public.get_auth_brand(), ''), '')
      )
    $p$;
    EXECUTE $p$
      CREATE POLICY "Orders: super admin insert" ON public.orders
      FOR INSERT TO authenticated WITH CHECK (public.get_auth_role() = 'super_admin')
    $p$;
    EXECUTE $p$
      CREATE POLICY "Orders: clinical staff update" ON public.orders
      FOR UPDATE TO authenticated
      USING (public.get_auth_role() IN ('doctor', 'pharmacy', 'super_admin'))
    $p$;
    EXECUTE $p$
      CREATE POLICY "Orders: brand admin update scoped" ON public.orders
      FOR UPDATE TO authenticated
      USING (
        public.get_auth_role() = 'brand_admin'
        AND coalesce(sub_brand, '') = coalesce(nullif(public.get_auth_brand(), ''), '')
      )
    $p$;
  END IF;
END $$;

-- =============================================================================
-- PART 4 — Products RLS
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  ) THEN
    EXECUTE 'ALTER TABLE public.products ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "MVP Public Product Select" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "Products public read active" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "Products staff select all" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "Products staff insert" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "Products staff update" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "Products staff delete" ON public.products';
    EXECUTE $p$
      CREATE POLICY "Products public read active" ON public.products
      FOR SELECT TO anon, authenticated
      USING (coalesce(active, true) = true)
    $p$;
    EXECUTE $p$
      CREATE POLICY "Products staff select all" ON public.products
      FOR SELECT TO authenticated
      USING (public.get_auth_role() IN ('brand_admin', 'super_admin'))
    $p$;
    EXECUTE $p$
      CREATE POLICY "Products staff insert" ON public.products
      FOR INSERT TO authenticated
      WITH CHECK (public.get_auth_role() IN ('brand_admin', 'super_admin'))
    $p$;
    EXECUTE $p$
      CREATE POLICY "Products staff update" ON public.products
      FOR UPDATE TO authenticated
      USING (public.get_auth_role() IN ('brand_admin', 'super_admin'))
    $p$;
    EXECUTE $p$
      CREATE POLICY "Products staff delete" ON public.products
      FOR DELETE TO authenticated
      USING (public.get_auth_role() = 'super_admin')
    $p$;
  END IF;
END $$;

-- =============================================================================
-- PART 5 — Admin audit + questionnaires
-- =============================================================================
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
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_audit_insert_authenticated_staff" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_insert_authenticated_staff" ON public.admin_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() AND public.get_auth_role() IN ('brand_admin', 'super_admin'));

DROP POLICY IF EXISTS "admin_audit_super_select" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_super_select" ON public.admin_audit_logs
  FOR SELECT TO authenticated USING (public.get_auth_role() = 'super_admin');

DROP POLICY IF EXISTS "admin_audit_brand_select" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_brand_select" ON public.admin_audit_logs
  FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'brand_admin'
    AND coalesce(brand_scope, '') = coalesce(nullif(public.get_auth_brand(), ''), '')
  );

GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;

CREATE TABLE IF NOT EXISTS public.admin_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  name TEXT NOT NULL DEFAULT 'Untitled questionnaire',
  slug TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  brand_id TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

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

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_questionnaires_touch_updated_at ON public.admin_questionnaires;
CREATE TRIGGER admin_questionnaires_touch_updated_at
  BEFORE UPDATE ON public.admin_questionnaires
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =============================================================================
-- PART 6 — Platform settings + tools
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow super_admin to manage platform_settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Allow authenticated to view public platform_settings" ON public.platform_settings;

CREATE POLICY "Allow super_admin to manage platform_settings" ON public.platform_settings
  FOR ALL TO authenticated
  USING (public.get_auth_role() = 'super_admin')
  WITH CHECK (public.get_auth_role() = 'super_admin');

CREATE POLICY "Allow authenticated to view public platform_settings" ON public.platform_settings
  FOR SELECT TO authenticated USING (true);

INSERT INTO public.platform_settings (key, value, category, description) VALUES
  ('platform_name', 'Peak Health', 'general', 'Display name'),
  ('support_email', 'support@peak-health.io', 'general', 'Support contact'),
  ('referly_enabled', 'true', 'integrations', 'Referly affiliate tracking'),
  ('stripe_enabled', 'true', 'integrations', 'Stripe checkout')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.platform_tools (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  status BOOLEAN DEFAULT false,
  category TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.platform_tools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SuperAdmins manage platform tools" ON public.platform_tools;
DROP POLICY IF EXISTS "Anyone can read platform tools" ON public.platform_tools;

CREATE POLICY "Anyone can read platform tools" ON public.platform_tools
  FOR SELECT USING (true);

CREATE POLICY "SuperAdmins manage platform tools" ON public.platform_tools
  FOR ALL TO authenticated
  USING (public.get_auth_role() = 'super_admin')
  WITH CHECK (public.get_auth_role() = 'super_admin');

INSERT INTO public.platform_tools (name, description, status, category) VALUES
  ('Chatbot Assistant', '24/7 patient support chatbot.', true, 'AI'),
  ('AI Symptom Checker', 'AI triage before booking.', true, 'AI'),
  ('Automated Reminders', 'SMS/email appointment reminders.', true, 'Automation'),
  ('E-Prescribing Integration', 'Pharmacy network integration.', true, 'Integration')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- PART 7 — Scheduling + consult routing
-- =============================================================================
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
  ON public.scheduling_pending_bookings (scheduling_ref) WHERE consumed_at IS NULL;

ALTER TABLE public.scheduling_pending_bookings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.scheduling_pending_bookings FROM PUBLIC;
GRANT ALL ON TABLE public.scheduling_pending_bookings TO service_role;

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

ALTER TABLE public.consult_routing_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consult_routing_rules_select_public" ON public.consult_routing_rules;
CREATE POLICY "consult_routing_rules_select_public" ON public.consult_routing_rules
  FOR SELECT TO anon, authenticated USING (active = true);

DROP POLICY IF EXISTS "consult_routing_super_admin_all" ON public.consult_routing_rules;
CREATE POLICY "consult_routing_super_admin_all" ON public.consult_routing_rules
  FOR ALL TO authenticated
  USING (public.get_auth_role() = 'super_admin')
  WITH CHECK (public.get_auth_role() = 'super_admin');

GRANT SELECT ON public.consult_routing_rules TO anon;
GRANT ALL ON public.consult_routing_rules TO authenticated, service_role;

-- =============================================================================
-- PART 8 — Doctor invite + availability (invite-doctor edge function)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.doctor_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invited_by UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  specialty TEXT,
  npi_number TEXT,
  credentials TEXT,
  licensed_states TEXT,
  calendly_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS doctor_invitations_email_key ON public.doctor_invitations (lower(email));

ALTER TABLE public.doctor_invitations DROP CONSTRAINT IF EXISTS doctor_invitations_status_check;
ALTER TABLE public.doctor_invitations ADD CONSTRAINT doctor_invitations_status_check
  CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'));

ALTER TABLE public.doctor_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctor_invitations_super_admin" ON public.doctor_invitations;
CREATE POLICY "doctor_invitations_super_admin" ON public.doctor_invitations
  FOR ALL TO authenticated
  USING (public.get_auth_role() = 'super_admin')
  WITH CHECK (public.get_auth_role() = 'super_admin');

DROP POLICY IF EXISTS "doctor_invitations_doctor_read_own" ON public.doctor_invitations;
CREATE POLICY "doctor_invitations_doctor_read_own" ON public.doctor_invitations
  FOR SELECT TO authenticated
  USING (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    OR public.get_auth_role() = 'super_admin'
  );

CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  doctor_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  buffer_mins INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can manage their own schedule" ON public.doctor_schedules;
CREATE POLICY "Doctors can manage their own schedule" ON public.doctor_schedules
  FOR ALL TO authenticated
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Anyone can view doctor schedules" ON public.doctor_schedules;
CREATE POLICY "Anyone can view doctor schedules" ON public.doctor_schedules
  FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.increment_patients_count(doctor_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET patients_count = COALESCE(patients_count, 0) + 1
  WHERE id = doctor_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_patients_count(UUID) TO service_role;

-- =============================================================================
-- PART 9 — Messages (patient + doctor portals)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update received messages" ON public.messages;

CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received messages" ON public.messages
  FOR UPDATE USING (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Super admin can view all messages" ON public.messages;
CREATE POLICY "Super admin can view all messages" ON public.messages
  FOR SELECT TO authenticated
  USING (public.get_auth_role() = 'super_admin');

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- PART 10 — PHI access logs
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.phi_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  actor_id UUID NOT NULL,
  actor_email TEXT,
  role TEXT NOT NULL,
  brand_scope TEXT,
  access_type TEXT NOT NULL DEFAULT 'staff' CHECK (access_type IN ('staff', 'self', 'system')),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  subject_user_id UUID,
  route_path TEXT,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.phi_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "phi_access_insert_own" ON public.phi_access_logs;
CREATE POLICY "phi_access_insert_own" ON public.phi_access_logs
  FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

DROP POLICY IF EXISTS "phi_access_super_select" ON public.phi_access_logs;
CREATE POLICY "phi_access_super_select" ON public.phi_access_logs
  FOR SELECT TO authenticated USING (public.get_auth_role() = 'super_admin');

GRANT SELECT, INSERT ON public.phi_access_logs TO authenticated;
GRANT ALL ON public.phi_access_logs TO service_role;

-- =============================================================================
-- PART 11 — Notifications
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'other',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  unread BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can read all notifications" ON public.notifications;
CREATE POLICY "Staff can read all notifications" ON public.notifications
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.get_auth_role() IN ('doctor', 'brand_admin', 'super_admin')
  );

-- =============================================================================
-- PART 12 — Patient portal extras (conditional)
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'insurance_plans') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert their insurance plans" ON public.insurance_plans';
    EXECUTE 'CREATE POLICY "Users can insert their insurance plans" ON public.insurance_plans FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their insurance plans" ON public.insurance_plans';
    EXECUTE 'CREATE POLICY "Users can update their insurance plans" ON public.insurance_plans FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patient_documents') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own documents" ON public.patient_documents';
    EXECUTE 'CREATE POLICY "Users can update their own documents" ON public.patient_documents FOR UPDATE USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id)';
  END IF;
END $$;

COMMIT;

-- =============================================================================
-- VERIFICATION — all should show ok = true
-- =============================================================================
SELECT 'get_auth_role()' AS check_item,
       EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_auth_role') AS ok
UNION ALL
SELECT 'profiles table', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
UNION ALL
SELECT 'doctor_invitations table', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'doctor_invitations')
UNION ALL
SELECT 'doctor_schedules table', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'doctor_schedules')
UNION ALL
SELECT 'messages table', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages')
UNION ALL
SELECT 'admin_questionnaires table', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_questionnaires')
UNION ALL
SELECT 'scheduling_pending_bookings', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scheduling_pending_bookings')
UNION ALL
SELECT 'consult_routing_rules', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consult_routing_rules')
UNION ALL
SELECT 'profiles.calendly_url column', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'calendly_url')
UNION ALL
SELECT 'orders.enrollment_video_required', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'enrollment_video_required')
UNION ALL
SELECT 'orders.order_number', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'order_number')
UNION ALL
SELECT 'orders.patient_name', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'patient_name')
UNION ALL
SELECT 'increment_patients_count()', EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'increment_patients_count');

SELECT 'FIX ALL DATABASE complete — review ok column above' AS status;

-- =============================================================================
-- PART 14 — Multi-tenant platform (brands hostnames, partner keys, North Star seed)
-- Run scripts/sql/RUN_IN_SUPABASE_MULTI_TENANT_PLATFORM.sql in SQL Editor instead.
-- PART 13 below is superseded by that script but kept for backward compatibility.
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'brands'
  ) THEN
    INSERT INTO public.brands (
      id, name, slug, domain, country, timezone, status, plan, since_date
    ) VALUES (
      'c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c'::uuid,
      'North Star MD',
      'north-star-md',
      'northstarmd.com',
      'United States',
      'America/New_York',
      'active',
      'Enterprise',
      to_char(now(), 'Mon YYYY')
    )
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      domain = EXCLUDED.domain,
      status = 'active';
  END IF;
END $$;

-- =============================================================================
-- AFTER SQL — deploy ALL browser Edge Functions (Supabase Dashboard → Edge Functions)
-- Paste each file from supabase/functions/<name>/index.ts (self-contained, no _shared imports).
-- For EACH function below: Settings → turn OFF "Enforce JWT Verification" → Deploy.
--
-- Status on project kvopgyhcjcniaocjozje (check Edge Functions list):
--   [deployed] dispatch-prescription, invite-doctor
--   [missing — deploy from repo] assign-doctor, create-payment-intent, stripe-attach-order,
--     merge-scheduling-pending, send-otp, verify-otp, verify-identity, zoom-video-token,
--     ai-medical-scribe, stripe-create-refund, process-refund
--
-- Required secrets (Dashboard → Edge Functions → Secrets):
--   STRIPE_SECRET_KEY          → create-payment-intent, verify-identity, stripe-attach-order, stripe-create-refund
--   TWILIO_*                   → send-otp, verify-otp
--   ZOOM_VIDEO_SDK_KEY/SECRET  → zoom-video-token
--   OPENAI_API_KEY             → ai-medical-scribe (optional — has fallback)
--   PHARMACY_API_URL/KEY       → dispatch-prescription
--
-- Auth users (Authentication → Users) — demo login cannot call Edge Functions:
--   brandon@peakbodyco.com  → super_admin (invite-doctor, super admin tools)
--   doctor@peakbodyco.com   → doctor (dispatch-prescription, ai-medical-scribe, refunds)
-- =============================================================================
