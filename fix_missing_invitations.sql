
-- ============================================================
-- FIX: Missing doctor_invitations table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.doctor_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    specialty TEXT,
    npi_number TEXT,
    credentials TEXT,
    licensed_states TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    invited_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctor_invitations ENABLE ROW LEVEL SECURITY;

-- Allow SuperAdmins to manage invitations
CREATE POLICY "SuperAdmins manage invitations" ON public.doctor_invitations
    FOR ALL USING (auth.role() = 'authenticated');

-- Allow Public access to read an invitation by email (for onboarding)
CREATE POLICY "Anyone can read an invitation by email" ON public.doctor_invitations
    FOR SELECT USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_invitations;

SELECT 'Table doctor_invitations created successfully!' as result;
