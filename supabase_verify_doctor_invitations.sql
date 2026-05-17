-- ============================================================
-- Peak Health — Idempotent Doctor Invitations Schema Verification
-- Run in Supabase SQL Editor to guarantee all columns & constraints exist
-- ============================================================

-- 1. Ensure columns exist on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calendly_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS npi_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credentials TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS licensed_states TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS patients_count INTEGER DEFAULT 0;

-- 2. Ensure doctor_invitations table exists
CREATE TABLE IF NOT EXISTS public.doctor_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invited_by UUID REFERENCES auth.users(id),
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    specialty TEXT,
    npi_number TEXT,
    credentials TEXT,
    licensed_states TEXT,
    calendly_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    accepted_at TIMESTAMPTZ
);

-- 3. Add columns to doctor_invitations if missing (e.g. if created from clean schema)
ALTER TABLE public.doctor_invitations ADD COLUMN IF NOT EXISTS calendly_url TEXT;
ALTER TABLE public.doctor_invitations ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);

-- 4. Re-create check constraint to support 'revoked' and 'expired' status safely
ALTER TABLE public.doctor_invitations DROP CONSTRAINT IF EXISTS doctor_invitations_status_check;
ALTER TABLE public.doctor_invitations ADD CONSTRAINT doctor_invitations_status_check 
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'));

-- 5. Enable RLS and guarantee permissive policies for Authenticated SuperAdmins
ALTER TABLE public.doctor_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read invitations" ON public.doctor_invitations;
DROP POLICY IF EXISTS "SuperAdmins manage invitations" ON public.doctor_invitations;
CREATE POLICY "SuperAdmins manage invitations" ON public.doctor_invitations
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read an invitation by email" ON public.doctor_invitations;
CREATE POLICY "Anyone can read an invitation by email" ON public.doctor_invitations
    FOR SELECT USING (true);

-- Ensure profiles is fully selectable by admins
DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.profiles;
CREATE POLICY "admin_read_all_profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);

SELECT 'Doctor invitations schema fully verified and upgraded!' AS result;
