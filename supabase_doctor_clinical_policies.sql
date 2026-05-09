-- ==============================================================================
-- InvestN / Peak Health: Doctor & Pharmacy Clinical RLS Policies
-- This script ensures Doctors can read/write clinical data across the platform,
-- while implicitly maintaining the restriction that Admin/SuperAdmin cannot.
-- ==============================================================================

-- 0. Ensure Clinical Tables Exist (Safe Create without wiping data)
CREATE TABLE IF NOT EXISTS public.intake_forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
    required BOOLEAN DEFAULT true,
    completed_date TEXT,
    form_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.visit_forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    visit_name TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'in-progress')),
    urgent BOOLEAN DEFAULT false,
    form_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prescriptions (
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

CREATE TABLE IF NOT EXISTS public.visit_summaries (
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

CREATE TABLE IF NOT EXISTS public.lab_results (
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

CREATE TABLE IF NOT EXISTS public.patient_documents (
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

CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES auth.users(id),
    record_type TEXT NOT NULL,
    description TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all of them
ALTER TABLE public.intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- 1. Intake Forms (Doctors)
CREATE POLICY "Doctors can view intake forms" 
    ON public.intake_forms FOR SELECT 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Doctors can update intake forms" 
    ON public.intake_forms FOR UPDATE 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

-- 2. Visit Forms (Doctors)
CREATE POLICY "Doctors can view visit forms" 
    ON public.visit_forms FOR SELECT 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Doctors can update visit forms" 
    ON public.visit_forms FOR UPDATE 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

-- 3. Prescriptions (Doctors & Pharmacy)
CREATE POLICY "Doctors can view prescriptions" 
    ON public.prescriptions FOR SELECT 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Doctors can insert prescriptions" 
    ON public.prescriptions FOR INSERT 
    WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Doctors can update prescriptions" 
    ON public.prescriptions FOR UPDATE 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Pharmacy can view prescriptions" 
    ON public.prescriptions FOR SELECT 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'pharmacy');

CREATE POLICY "Pharmacy can update prescriptions" 
    ON public.prescriptions FOR UPDATE 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'pharmacy');

-- 4. Visit Summaries (Doctors)
CREATE POLICY "Doctors can view visit summaries" 
    ON public.visit_summaries FOR SELECT 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

-- 5. Lab Results (Doctors)
CREATE POLICY "Doctors can view lab results" 
    ON public.lab_results FOR SELECT 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Doctors can update lab results" 
    ON public.lab_results FOR UPDATE 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Doctors can insert lab results" 
    ON public.lab_results FOR INSERT 
    WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

-- 6. Patient Documents (Doctors)
CREATE POLICY "Doctors can view patient documents" 
    ON public.patient_documents FOR SELECT 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Doctors can upload patient documents" 
    ON public.patient_documents FOR INSERT 
    WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

-- 7. Medical Records (Doctors)
CREATE POLICY "Doctors can view medical records" 
    ON public.medical_records FOR SELECT 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Doctors can insert medical records" 
    ON public.medical_records FOR INSERT 
    WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Doctors can update medical records" 
    ON public.medical_records FOR UPDATE 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');
