-- ============================================================
-- Peak Health — Fix SuperAdmin RLS access
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. visit_forms — allow super_admin to SELECT (non-clinical read for support)
DROP POLICY IF EXISTS "SuperAdmin can view visit forms" ON public.visit_forms;
CREATE POLICY "SuperAdmin can view visit forms"
  ON public.visit_forms FOR SELECT TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '')  = 'super_admin'
    OR coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'super_admin'
  );

-- Allow patients to read their own
DROP POLICY IF EXISTS "Patients can view own visit forms" ON public.visit_forms;
CREATE POLICY "Patients can view own visit forms"
  ON public.visit_forms FOR SELECT TO authenticated
  USING (patient_id = auth.uid());

-- Allow patients to insert their own
DROP POLICY IF EXISTS "Patients can insert own visit forms" ON public.visit_forms;
CREATE POLICY "Patients can insert own visit forms"
  ON public.visit_forms FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid());

-- 2. doctor_availability — allow super_admin to read
DROP POLICY IF EXISTS "SuperAdmin can view doctor availability" ON public.doctor_availability;
CREATE POLICY "SuperAdmin can view doctor availability"
  ON public.doctor_availability FOR SELECT TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '')  = 'super_admin'
    OR coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'super_admin'
  );

-- Authenticated users (patients booking) can read availability
DROP POLICY IF EXISTS "Authenticated users can view availability" ON public.doctor_availability;
CREATE POLICY "Authenticated users can view availability"
  ON public.doctor_availability FOR SELECT TO authenticated
  USING (true);

-- 3. profiles — allow super_admin to read all profiles (for user management)
DROP POLICY IF EXISTS "SuperAdmin can read all profiles" ON public.profiles;
CREATE POLICY "SuperAdmin can read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '')  = 'super_admin'
    OR coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'super_admin'
  );

-- Users can still read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

-- 4. admin_audit_logs — super_admin full access
DROP POLICY IF EXISTS "SuperAdmin full access audit logs" ON public.admin_audit_logs;
CREATE POLICY "SuperAdmin full access audit logs"
  ON public.admin_audit_logs FOR ALL TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '')  = 'super_admin'
    OR coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'super_admin'
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '')  = 'super_admin'
    OR coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'super_admin'
  );

-- Done!
SELECT 'RLS policies updated successfully' AS status;
