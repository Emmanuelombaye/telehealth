-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  PEAK HEALTH — DOCTOR INVITATION SCHEMA                        ║
-- ║  Run this in Supabase SQL Editor to enable Doctor Management    ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. Add doctor-specific columns to profiles (all idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calendly_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS npi_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credentials TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS licensed_states TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS patients_count INTEGER DEFAULT 0;

-- 2. Doctor invitations tracking table
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
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    created_at TIMESTAMPTZ DEFAULT now(),
    accepted_at TIMESTAMPTZ
);

ALTER TABLE public.doctor_invitations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read invitations
DROP POLICY IF EXISTS "Authenticated read invitations" ON public.doctor_invitations;
CREATE POLICY "Authenticated read invitations" ON public.doctor_invitations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert invitations
DROP POLICY IF EXISTS "Authenticated insert invitations" ON public.doctor_invitations;
CREATE POLICY "Authenticated insert invitations" ON public.doctor_invitations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update invitations
DROP POLICY IF EXISTS "Authenticated update invitations" ON public.doctor_invitations;
CREATE POLICY "Authenticated update invitations" ON public.doctor_invitations
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 3. Ensure profiles RLS allows admin read of all doctors
-- (The existing own_select + open_insert policies stay; we add admin reads)
DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.profiles;
CREATE POLICY "admin_read_all_profiles" ON public.profiles
    FOR SELECT USING (true);

-- 4. Ensure doctor_availability allows inserts from authenticated users
DROP POLICY IF EXISTS "Authenticated insert doctor availability" ON public.doctor_availability;
CREATE POLICY "Authenticated insert doctor availability" ON public.doctor_availability
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. Ensure doctor_availability allows delete by authenticated
DROP POLICY IF EXISTS "Authenticated delete doctor availability" ON public.doctor_availability;
CREATE POLICY "Authenticated delete doctor availability" ON public.doctor_availability
    FOR DELETE USING (auth.role() = 'authenticated');
