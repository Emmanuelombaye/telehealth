-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  PEAK HEALTH — ALL FEATURES DATABASE SCHEMA                      ║
-- ║  Run this to create tables for all patient portal features       ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    unread BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. FAMILY MEMBERS
CREATE TABLE IF NOT EXISTS public.family_members (
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
CREATE TABLE IF NOT EXISTS public.lab_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES auth.users(id),
    test_name TEXT NOT NULL,
    lab_name TEXT,
    result_data JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'final' CHECK (status IN ('pending', 'partial', 'final')),
    collected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. DOCUMENTS (Medical records, PDFs, etc)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    size INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. INSURANCE INFO
CREATE TABLE IF NOT EXISTS public.insurance_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    policy_number TEXT NOT NULL,
    group_number TEXT,
    plan_type TEXT,
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. IDENTITY VERIFICATION
CREATE TABLE IF NOT EXISTS public.identity_verification (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
    document_type TEXT,
    document_front_url TEXT,
    document_back_url TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ENABLE RLS ON ALL NEW TABLES
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_verification ENABLE ROW LEVEL SECURITY;

-- CREATE BASIC RLS POLICIES (Users see their own data)
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users view own family" ON public.family_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own family" ON public.family_members FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Patients view own labs" ON public.lab_results FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Users view own docs" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own docs" ON public.documents FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own insurance" ON public.insurance_info FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own insurance" ON public.insurance_info FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own identity" ON public.identity_verification FOR SELECT USING (auth.uid() = user_id);
