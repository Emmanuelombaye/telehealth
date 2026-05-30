-- Doctor provisioning (invite-doctor), availability, and routing helpers.
-- Requires 20260514143000_production_core_rbac.sql (get_auth_role).

-- Profiles: clinician columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calendly_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS npi_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credentials TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS licensed_states TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS patients_count INTEGER DEFAULT 0;

-- Doctor invitations (Super Admin → invite-doctor edge function)
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

-- Doctor schedules (availability page)
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

-- assign-doctor edge function
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
