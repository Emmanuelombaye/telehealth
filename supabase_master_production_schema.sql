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

-- 9. VISIT SUMMARIES
DROP TABLE IF EXISTS public.visit_summaries CASCADE;
CREATE TABLE public.visit_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES auth.users(id),
    doctor_name TEXT,
    specialty TEXT,
    date TIMESTAMPTZ DEFAULT now(),
    type TEXT DEFAULT 'video' CHECK (type IN ('video', 'async')),
    diagnosis TEXT,
    follow_up_date TIMESTAMPTZ,
    report_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. VISIT FORMS (Questionnaires/Consents)
DROP TABLE IF EXISTS public.visit_forms CASCADE;
CREATE TABLE public.visit_forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    visit_name TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'in-progress')),
    urgent BOOLEAN DEFAULT false,
    form_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. DOCTOR AVAILABILITY
DROP TABLE IF EXISTS public.doctor_availability CASCADE;
CREATE TABLE public.doctor_availability (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    avatar TEXT NOT NULL,
    available BOOLEAN DEFAULT true,
    wait_time TEXT DEFAULT '< 5 min',
    next_slot TEXT DEFAULT 'Available now'
);

INSERT INTO public.doctor_availability (name, specialty, avatar, available, wait_time, next_slot) VALUES
('Dr. Sarah Chen', 'Weight Loss Specialist', 'SC', true, '< 5 min', 'Available now'),
('Dr. Michael Patel', 'Men''s Health', 'MP', true, '~ 10 min', '10:15 AM'),
('Dr. Emily Stone', 'General Practice', 'ES', false, 'Unavailable', 'Tomorrow 9:00 AM');

-- 12. INTAKE FORMS
DROP TABLE IF EXISTS public.intake_forms CASCADE;
CREATE TABLE public.intake_forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
    required BOOLEAN DEFAULT true,
    completed_date TEXT,
    form_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- 13. ADMIN QUESTIONNAIRES
DROP TABLE IF EXISTS public.admin_questionnaires CASCADE;
CREATE TABLE public.admin_questionnaires (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    date TEXT,
    questions TEXT,
    products TEXT,
    checkout_pages TEXT,
    domain TEXT,
    slug TEXT,
    review TEXT,
    status TEXT,
    mode TEXT,
    intake TEXT,
    last_used TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
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
ALTER TABLE public.visit_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Family Members
CREATE POLICY "Users can view their family members" ON public.family_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert family members" ON public.family_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete family members" ON public.family_members FOR DELETE USING (auth.uid() = user_id);

-- Patient Documents
CREATE POLICY "Users can view their own documents" ON public.patient_documents FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can upload their own documents" ON public.patient_documents FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Insurance
CREATE POLICY "Users can view their insurance plans" ON public.insurance_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their claims" ON public.insurance_claims FOR SELECT USING (auth.uid() = user_id);

-- Lab Results
CREATE POLICY "Users can view their lab results" ON public.lab_results FOR SELECT USING (auth.uid() = patient_id);

-- Prescriptions
CREATE POLICY "Users can view their prescriptions" ON public.prescriptions FOR SELECT USING (auth.uid() = patient_id);

-- Appointments
CREATE POLICY "Users can view their appointments" ON public.appointments FOR SELECT USING (auth.uid() = patient_id);

-- Visit Summaries
CREATE POLICY "Users can view their visit summaries" ON public.visit_summaries FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can insert visit summaries" ON public.visit_summaries FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Visit Forms
CREATE POLICY "Users can view their visit forms" ON public.visit_forms FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can update their visit forms" ON public.visit_forms FOR UPDATE USING (auth.uid() = patient_id);

-- Intake Forms
CREATE POLICY "Users can view their intake forms" ON public.intake_forms FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can update their intake forms" ON public.intake_forms FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Users can insert intake forms" ON public.intake_forms FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Doctor Availability
CREATE POLICY "Anyone can view doctor availability" ON public.doctor_availability FOR SELECT USING (true);
CREATE POLICY "Doctors can update their availability" ON public.doctor_availability FOR UPDATE USING (auth.uid() IS NOT NULL);
