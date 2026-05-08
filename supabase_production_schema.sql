-- Production Schema for TeleHealth App

-- 1. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id),
    doctor_id UUID REFERENCES auth.users(id),
    scheduled_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'canceled')),
    consultation_type TEXT DEFAULT 'video' CHECK (consultation_type IN ('video', 'async', 'in_person')),
    video_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Medical Records Table (EHR)
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id),
    doctor_id UUID REFERENCES auth.users(id),
    appointment_id UUID REFERENCES public.appointments(id),
    vitals JSONB DEFAULT '{}'::jsonb,
    allergies TEXT[],
    current_medications TEXT[],
    diagnoses TEXT[],
    clinical_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Intake Forms Table
CREATE TABLE IF NOT EXISTS public.intake_forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id),
    appointment_id UUID REFERENCES public.appointments(id),
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id),
    receiver_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Prescriptions Table
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id),
    doctor_id UUID REFERENCES auth.users(id),
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    refills_remaining INTEGER DEFAULT 0,
    pharmacy_id TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'expired')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Can be restricted further later)
CREATE POLICY "Enable read for authenticated users" ON public.appointments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.appointments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.appointments FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read for authenticated users" ON public.medical_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.medical_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.medical_records FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read for authenticated users" ON public.intake_forms FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.intake_forms FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.intake_forms FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read for authenticated users" ON public.messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read for authenticated users" ON public.prescriptions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.prescriptions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.prescriptions FOR UPDATE USING (auth.role() = 'authenticated');

