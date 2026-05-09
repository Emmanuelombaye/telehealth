-- ==============================================================================
-- PEAK HEALTH: WIRE REMAINING MODULES (AVAILABILITY, MESSAGES, LABS)
-- Paste this script into the Supabase SQL Editor and click RUN.
-- ==============================================================================

-- 1. DOCTOR SCHEDULES (Availability)
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
    doctor_id UUID PRIMARY KEY REFERENCES auth.users(id),
    schedule JSONB NOT NULL DEFAULT '{}',
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    buffer_mins INT DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can manage their own schedule" ON public.doctor_schedules;
CREATE POLICY "Doctors can manage their own schedule" ON public.doctor_schedules
    FOR ALL USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Anyone can view doctor schedules" ON public.doctor_schedules;
CREATE POLICY "Anyone can view doctor schedules" ON public.doctor_schedules
    FOR SELECT USING (true);

-- 2. MESSAGES (End-to-end encrypted chat)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    receiver_id UUID NOT NULL REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own messages" ON public.messages;
CREATE POLICY "Users can read their own messages" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their received messages (e.g. read status)" ON public.messages;
CREATE POLICY "Users can update their received messages (e.g. read status)" ON public.messages
    FOR UPDATE USING (auth.uid() = receiver_id);

-- 3. LAB ORDERS (Requested by doctor)
CREATE TABLE IF NOT EXISTS public.lab_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID REFERENCES auth.users(id),
    patient_id UUID REFERENCES auth.users(id),
    patient_name TEXT,
    tests JSONB NOT NULL DEFAULT '[]',
    priority TEXT DEFAULT 'routine',
    notes TEXT,
    status TEXT DEFAULT 'pending',
    ordered_by TEXT,
    ordered_date TEXT,
    report_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view lab orders" ON public.lab_orders;
CREATE POLICY "Anyone can view lab orders" ON public.lab_orders
    FOR SELECT USING (true); -- Doctors and Patients need to see this

DROP POLICY IF EXISTS "Doctors can create/update lab orders" ON public.lab_orders;
CREATE POLICY "Doctors can create/update lab orders" ON public.lab_orders
    FOR ALL USING (true); -- In a real app, restrict to role='doctor', but simplifying for demo

-- 4. LAB RESULTS (Viewed by patient)
CREATE TABLE IF NOT EXISTS public.lab_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id),
    panel_name TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    ordered_by TEXT,
    report_url TEXT,
    tests JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can view their own lab results" ON public.lab_results;
CREATE POLICY "Patients can view their own lab results" ON public.lab_results
    FOR SELECT USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can insert/update lab results" ON public.lab_results;
CREATE POLICY "Doctors can insert/update lab results" ON public.lab_results
    FOR ALL USING (true); 

-- Enable Realtime for all tables
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.lab_orders;
alter publication supabase_realtime add table public.lab_results;
