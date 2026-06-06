-- =============================================================================
-- PEAK HEALTH — SCHEMA GAP FIX (paste entire file in Supabase SQL Editor → RUN)
-- =============================================================================
-- Fixes console errors after switching to a new Supabase project:
--   • column orders.order_number does not exist
--   • Could not find table public.visit_forms
--   • Could not find table public.visit_summaries
--   • vital_readings.flagged / metric column mismatches
--   • prescriptions.medication vs medication_name
--   • messages.is_read vs read
--
-- Safe to re-run. Does NOT delete data.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(trim(auth.jwt() -> 'app_metadata' ->> 'role'), ''),
    NULLIF(trim(auth.jwt() -> 'user_metadata' ->> 'role'), ''),
    (SELECT p.role::text FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1),
    'patient'
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_role() TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 1) ORDERS
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) THEN
    RAISE NOTICE 'public.orders does not exist — run base schema first';
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT';
  EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number) WHERE order_number IS NOT NULL';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_name TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_avatar TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_age INTEGER';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_country TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_email TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS medication TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dosage_instructions TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS category TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ordered_date TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pharmacy TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS doctor TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS doctor_note TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carrier TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mrn TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT ''[]''::jsonb';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS intake_notes TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS intake_answers JSONB DEFAULT ''{}''::jsonb';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_vitals JSONB DEFAULT ''{}''::jsonb';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipped_date TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS enrollment_video_required BOOLEAN NOT NULL DEFAULT false';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS scheduling_ref TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS scheduling_booking_url TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_status TEXT DEFAULT ''not_requested''';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_join_url TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_doctor_message TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_rescheduled_time TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consultation_time TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consultation_live BOOLEAN DEFAULT false';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consultation_submitted_date TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT ''pending''';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT ''pending''';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS referral_code TEXT';
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
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES auth.users(id)';
  EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sub_brand TEXT';

  EXECUTE $q$
    UPDATE public.orders
    SET order_number = 'ORD-' || UPPER(SUBSTRING(id::text FROM 1 FOR 8))
    WHERE order_number IS NULL OR TRIM(order_number) = ''
  $q$;
END $$;

-- ---------------------------------------------------------------------------
-- 2) INTAKE + VISIT FORMS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.intake_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  status TEXT DEFAULT 'pending',
  required BOOLEAN DEFAULT true,
  completed_date TEXT,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  appointment_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.intake_forms ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.intake_forms ADD COLUMN IF NOT EXISTS required BOOLEAN DEFAULT true;
ALTER TABLE public.intake_forms ADD COLUMN IF NOT EXISTS completed_date TEXT;
ALTER TABLE public.intake_forms ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.visit_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Visit form',
  visit_name TEXT,
  status TEXT DEFAULT 'pending',
  urgent BOOLEAN DEFAULT false,
  form_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.visit_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "intake_forms_patient_own" ON public.intake_forms;
CREATE POLICY "intake_forms_patient_own" ON public.intake_forms
  FOR ALL TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "intake_forms_clinical_read" ON public.intake_forms;
CREATE POLICY "intake_forms_clinical_read" ON public.intake_forms
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IN ('doctor', 'pharmacy', 'brand_admin', 'super_admin'));

DROP POLICY IF EXISTS "visit_forms_patient_own" ON public.visit_forms;
CREATE POLICY "visit_forms_patient_own" ON public.visit_forms
  FOR ALL TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "visit_forms_clinical_read" ON public.visit_forms;
CREATE POLICY "visit_forms_clinical_read" ON public.visit_forms
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IN ('doctor', 'pharmacy', 'brand_admin', 'super_admin'));

GRANT SELECT, INSERT, UPDATE ON public.intake_forms TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.visit_forms TO authenticated;

-- ---------------------------------------------------------------------------
-- 3) PRESCRIPTIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES public.orders(id),
  medication TEXT,
  medication_name TEXT,
  dosage TEXT,
  frequency TEXT,
  refills_remaining INTEGER DEFAULT 0,
  pharmacy_name TEXT,
  pharmacy_id TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS medication TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS medication_name TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS pharmacy_name TEXT;

UPDATE public.prescriptions
SET medication = COALESCE(medication, medication_name)
WHERE medication IS NULL AND medication_name IS NOT NULL;

UPDATE public.prescriptions
SET medication_name = COALESCE(medication_name, medication)
WHERE medication_name IS NULL AND medication IS NOT NULL;

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prescriptions_patient_own" ON public.prescriptions;
CREATE POLICY "prescriptions_patient_own" ON public.prescriptions
  FOR SELECT TO authenticated USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "prescriptions_clinical_all" ON public.prescriptions;
CREATE POLICY "prescriptions_clinical_all" ON public.prescriptions
  FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('doctor', 'pharmacy', 'super_admin'))
  WITH CHECK (public.get_auth_role() IN ('doctor', 'pharmacy', 'super_admin'));

GRANT SELECT, INSERT, UPDATE ON public.prescriptions TO authenticated;

-- ---------------------------------------------------------------------------
-- 4) VISIT SUMMARIES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.visit_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES auth.users(id),
  doctor_name TEXT,
  specialty TEXT,
  date TIMESTAMPTZ DEFAULT now(),
  type TEXT DEFAULT 'video',
  diagnosis TEXT,
  follow_up_date TIMESTAMPTZ,
  report_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.visit_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visit_summaries_patient_own" ON public.visit_summaries;
CREATE POLICY "visit_summaries_patient_own" ON public.visit_summaries
  FOR SELECT TO authenticated USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "visit_summaries_clinical" ON public.visit_summaries;
CREATE POLICY "visit_summaries_clinical" ON public.visit_summaries
  FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('doctor', 'super_admin'))
  WITH CHECK (public.get_auth_role() IN ('doctor', 'super_admin'));

GRANT SELECT, INSERT, UPDATE ON public.visit_summaries TO authenticated;

-- ---------------------------------------------------------------------------
-- 5) VITAL READINGS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vital_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_name TEXT,
  metric TEXT,
  type TEXT,
  value NUMERIC,
  unit TEXT,
  source TEXT,
  flagged BOOLEAN DEFAULT false,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.vital_readings ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT false;
ALTER TABLE public.vital_readings ADD COLUMN IF NOT EXISTS metric TEXT;
ALTER TABLE public.vital_readings ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.vital_readings ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.vital_readings ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE public.vital_readings ADD COLUMN IF NOT EXISTS source TEXT;

UPDATE public.vital_readings
SET metric = COALESCE(metric, type)
WHERE metric IS NULL AND type IS NOT NULL;

CREATE INDEX IF NOT EXISTS vital_readings_patient_idx ON public.vital_readings (patient_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS vital_readings_flagged_idx ON public.vital_readings (flagged) WHERE flagged = true;

ALTER TABLE public.vital_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patient sees own vitals" ON public.vital_readings;
CREATE POLICY "Patient sees own vitals" ON public.vital_readings
  FOR SELECT TO authenticated USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Clinical staff sees all vitals" ON public.vital_readings;
CREATE POLICY "Clinical staff sees all vitals" ON public.vital_readings
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IN ('doctor', 'brand_admin', 'super_admin', 'pharmacy'));

GRANT SELECT, INSERT ON public.vital_readings TO authenticated;

-- ---------------------------------------------------------------------------
-- 6) LAB RESULTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES auth.users(id),
  panel_name TEXT NOT NULL DEFAULT 'Panel',
  ordered_by TEXT,
  tests JSONB DEFAULT '[]'::jsonb,
  report_url TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lab_results_clinical" ON public.lab_results;
CREATE POLICY "lab_results_clinical" ON public.lab_results
  FOR SELECT TO authenticated
  USING (
    auth.uid() = patient_id
    OR public.get_auth_role() IN ('doctor', 'super_admin', 'brand_admin')
  );

GRANT SELECT ON public.lab_results TO authenticated;

-- ---------------------------------------------------------------------------
-- 7) MESSAGES — is_read
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'messages'
  ) THEN
    EXECUTE 'ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false';
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'read'
    ) THEN
      EXECUTE 'UPDATE public.messages SET is_read = COALESCE(is_read, read, false) WHERE is_read IS NULL';
    END IF;
  END IF;
END $$;

DROP POLICY IF EXISTS "Super admin can view all messages" ON public.messages;
CREATE POLICY "Super admin can view all messages" ON public.messages
  FOR SELECT TO authenticated
  USING (public.get_auth_role() = 'super_admin');

-- Messages → profiles foreign keys (PostgREST joins + integrity)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'messages'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = 'public' AND table_name = 'messages'
        AND constraint_name = 'messages_sender_id_fkey'
    ) THEN
      ALTER TABLE public.messages
        ADD CONSTRAINT messages_sender_id_fkey
        FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = 'public' AND table_name = 'messages'
        AND constraint_name = 'messages_receiver_id_fkey'
    ) THEN
      ALTER TABLE public.messages
        ADD CONSTRAINT messages_receiver_id_fkey
        FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'messages FK setup skipped: %', SQLERRM;
END $$;

-- Backfill profiles for message participants missing from profiles
INSERT INTO public.profiles (id, email, role, full_name)
SELECT DISTINCT
  u.id,
  u.email,
  COALESCE(NULLIF(trim(u.raw_user_meta_data->>'role'), ''), 'patient'),
  NULLIF(trim(
    COALESCE(u.raw_user_meta_data->>'first_name', '') || ' ' ||
    COALESCE(u.raw_user_meta_data->>'last_name', '')
  ), '')
FROM (
  SELECT sender_id AS uid FROM public.messages WHERE sender_id IS NOT NULL
  UNION
  SELECT receiver_id FROM public.messages WHERE receiver_id IS NOT NULL
) m
JOIN auth.users u ON u.id = m.uid
ON CONFLICT (id) DO UPDATE SET
  email = COALESCE(EXCLUDED.email, public.profiles.email),
  role = COALESCE(NULLIF(EXCLUDED.role, ''), public.profiles.role),
  full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name);

-- ---------------------------------------------------------------------------
-- 8) NOTIFICATIONS
-- ---------------------------------------------------------------------------
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
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can read all notifications" ON public.notifications;
CREATE POLICY "Staff can read all notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.get_auth_role() IN ('doctor', 'brand_admin', 'super_admin')
  );

GRANT SELECT, UPDATE ON public.notifications TO authenticated;

-- ---------------------------------------------------------------------------
-- 9) PROFILE + ORDER NAME BACKFILL (fixes "Unknown patient" in portals)
-- ---------------------------------------------------------------------------
UPDATE public.profiles p
SET full_name = NULLIF(trim(o.patient_name), '')
FROM (
  SELECT DISTINCT ON (user_id) user_id, patient_name
  FROM public.orders
  WHERE user_id IS NOT NULL
    AND patient_name IS NOT NULL
    AND trim(patient_name) <> ''
  ORDER BY user_id, created_at DESC NULLS LAST
) o
WHERE p.id = o.user_id
  AND (p.full_name IS NULL OR trim(p.full_name) = '');

UPDATE public.profiles p
SET full_name = NULLIF(trim(
  COALESCE(u.raw_user_meta_data->>'first_name', '') || ' ' ||
  COALESCE(u.raw_user_meta_data->>'last_name', '')
), '')
FROM auth.users u
WHERE p.id = u.id
  AND (p.full_name IS NULL OR trim(p.full_name) = '');

UPDATE public.orders
SET patient_name = COALESCE(NULLIF(trim(patient_name), ''), NULLIF(trim(p.full_name), ''))
FROM public.profiles p
WHERE orders.user_id = p.id
  AND (orders.patient_name IS NULL OR trim(orders.patient_name) = '');

COMMIT;

NOTIFY pgrst, 'reload schema';

SELECT 'orders.order_number' AS check_item,
       EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'order_number'
       ) AS ok
UNION ALL
SELECT 'visit_forms table',
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'visit_forms')
UNION ALL
SELECT 'visit_summaries table',
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'visit_summaries')
UNION ALL
SELECT 'vital_readings.flagged',
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vital_readings' AND column_name = 'flagged');

SELECT 'SCHEMA GAP FIX complete' AS status;
