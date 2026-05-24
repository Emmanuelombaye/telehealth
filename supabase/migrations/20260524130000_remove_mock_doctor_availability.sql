-- Remove legacy mock "doctor_availability" rows (Dr. Sarah Johnson, etc.).
-- Real clinicians live in public.profiles (role = doctor).

DELETE FROM public.doctor_availability;

COMMENT ON TABLE public.doctor_availability IS
  'Deprecated display table. Active clinicians are sourced from profiles.role = doctor.';

-- Revoke early placeholder doctor profiles (empty/test names).
UPDATE public.profiles
SET status = 'revoked'
WHERE role = 'doctor'
  AND lower(trim(coalesce(full_name, ''))) IN ('ww ww', 'clinical provider');
