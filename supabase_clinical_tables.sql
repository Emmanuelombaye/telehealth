-- ==============================================================================
-- Peak Health: Clinical Tables Migration (Prescriptions & Visit Forms)
-- ==============================================================================

-- 1. Create the Prescriptions Table
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID,
    doctor_id UUID,
    medication TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    status TEXT DEFAULT 'active', -- active, fulfilled, expired
    refills_remaining INTEGER DEFAULT 0,
    pharmacy_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the Visit Forms Table
CREATE TABLE IF NOT EXISTS public.visit_forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID,
    visit_name TEXT,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, completed
    urgent BOOLEAN DEFAULT false,
    content JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS and Policies (Simplified for demo, usually locked to user_id)
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for prescriptions" ON public.prescriptions;
CREATE POLICY "Enable all access for prescriptions" ON public.prescriptions FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for visit_forms" ON public.visit_forms;
CREATE POLICY "Enable all access for visit_forms" ON public.visit_forms FOR ALL USING (true);

-- 4. Insert Mock Data for Testing
INSERT INTO public.visit_forms (title, visit_name, status, urgent) VALUES 
('Medical History Consent', 'Initial Weight Loss Consult', 'pending', true),
('Lifestyle Questionnaire', 'Follow-up Bio-Optimization', 'completed', false)
ON CONFLICT DO NOTHING;

INSERT INTO public.prescriptions (medication, dosage, frequency, status, refills_remaining, pharmacy_name) VALUES 
('Semaglutide', '0.25mg Weekly', 'Inject once weekly as directed', 'active', 5, 'VialsRX Express')
ON CONFLICT DO NOTHING;
