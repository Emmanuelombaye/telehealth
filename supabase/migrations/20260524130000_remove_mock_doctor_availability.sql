-- Remove legacy mock "doctor_availability" rows (Dr. Sarah Johnson, etc.).
-- Real clinicians live in public.profiles (role = doctor).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'doctor_availability'
  ) THEN
    DELETE FROM public.doctor_availability;
    COMMENT ON TABLE public.doctor_availability IS
      'Deprecated display table. Active clinicians are sourced from profiles.role = doctor.';
  END IF;
END$$;

-- Revoke early placeholder doctor profiles (empty/test names).
-- Only if the profiles table has a status column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status'
  ) THEN
    UPDATE public.profiles
    SET status = 'revoked'
    WHERE role = 'doctor'
      AND lower(trim(coalesce(full_name, ''))) IN ('ww ww', 'clinical provider');
  END IF;
END$$;
