-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  PEAK HEALTH — COMPREHENSIVE PRODUCTION SCHEMA (ALL FEATURES)    ║
-- ║  Run this to create tables for every portal and feature.        ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. NOTIFICATIONS
DROP TABLE IF EXISTS public.notifications CASCADE;
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('appointment', 'lab', 'message', 'prescription', 'security', 'other')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    unread BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. FAMILY MEMBERS
DROP TABLE IF EXISTS public.family_members CASCADE;
CREATE TABLE public.family_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    relation TEXT NOT NULL,
    age INTEGER,
    access_level TEXT DEFAULT 'View Only' CHECK (access_level IN ('Full', 'View Only', 'Emergency')),
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. LAB RESULTS
DROP TABLE IF EXISTS public.lab_results CASCADE;
CREATE TABLE public.lab_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES auth.users(id),
    panel_name TEXT NOT NULL,
    ordered_by TEXT,
    tests JSONB DEFAULT '[]'::jsonb,
    report_url TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'pending', 'partial', 'final')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. PATIENT DOCUMENTS
DROP TABLE IF EXISTS public.patient_documents CASCADE;
CREATE TABLE public.patient_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Other' CHECK (type IN ('Lab Report', 'Diagnostic', 'Prescription', 'Insurance', 'Immunization', 'Referral', 'Other')),
    url TEXT NOT NULL,
    size TEXT,
    storage_path TEXT,
    new BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. INSURANCE & CLAIMS
DROP TABLE IF EXISTS public.insurance_plans CASCADE;
CREATE TABLE public.insurance_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    plan_name TEXT,
    member_id TEXT NOT NULL,
    group_number TEXT,
    is_primary BOOLEAN DEFAULT true,
    deductible_total NUMERIC DEFAULT 1500,
    deductible_met NUMERIC DEFAULT 0,
    out_of_pocket_max NUMERIC DEFAULT 5000,
    created_at TIMESTAMPTZ DEFAULT now()
);

DROP TABLE IF EXISTS public.insurance_claims CASCADE;
CREATE TABLE public.insurance_claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    provider_name TEXT,
    billed_amount NUMERIC NOT NULL,
    covered_amount NUMERIC NOT NULL,
    patient_responsibility NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. IDENTITY & SECURITY STATUS
DROP TABLE IF EXISTS public.identity_verification CASCADE;
CREATE TABLE public.identity_verification (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
    verification_date TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    verification_id TEXT,
    checklist JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. PRESCRIPTIONS
DROP TABLE IF EXISTS public.prescriptions CASCADE;
CREATE TABLE public.prescriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES auth.users(id),
    medication TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT,
    refills_remaining INTEGER DEFAULT 0,
    pharmacy_name TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'expired', 'discontinued')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. APPOINTMENTS
DROP TABLE IF EXISTS public.appointments CASCADE;
CREATE TABLE public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id),
    doctor_id UUID REFERENCES auth.users(id),
    scheduled_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'canceled')),
    consultation_type TEXT DEFAULT 'video' CHECK (consultation_type IN ('video', 'async', 'in_person')),
    video_url TEXT,
    notes TEXT,
    reason TEXT,
    check_in_status BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ENABLE RLS ON ALL TABLES
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- POLICIES (Users see their own data)
CREATE POLICY "Select Notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Select Family" ON public.family_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Select Labs" ON public.lab_results FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Select Docs" ON public.patient_documents FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Select Ins Plans" ON public.insurance_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Select Ins Claims" ON public.insurance_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Select Identity" ON public.identity_verification FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Select Prescriptions" ON public.prescriptions FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Select Appointments" ON public.appointments FOR SELECT USING (auth.uid() = patient_id);
