-- ==============================================================================
-- InvestN / Peak Health: Supabase Production Schema
-- Copy and Paste this entire script into your Supabase SQL Editor and click "Run"
-- ==============================================================================

-- 1. Create the Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    patient_name TEXT NOT NULL,
    patient_avatar TEXT,
    patient_age INTEGER,
    patient_country TEXT,
    sub_brand TEXT NOT NULL,
    medication TEXT NOT NULL,
    dosage_instructions TEXT,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'order_submitted',
    ordered_date TEXT,
    consultation_submitted_date TEXT,
    pharmacy TEXT,
    amount TEXT,
    doctor TEXT,
    doctor_note TEXT,
    tracking TEXT,
    carrier TEXT,
    tracking_url TEXT,
    estimated_delivery TEXT,
    urgent BOOLEAN DEFAULT false,
    intake_complete BOOLEAN DEFAULT false,
    intake_notes TEXT,
    wait_mins INTEGER DEFAULT 0,
    time TEXT,
    mrn TEXT,
    timeline JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the Doctor Availability Table
CREATE TABLE IF NOT EXISTS public.doctor_availability (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    specialty TEXT,
    avatar TEXT,
    available BOOLEAN DEFAULT true,
    wait_time TEXT,
    next_slot TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Insert Initial Mock Data into Orders Table (So the app has data immediately)
INSERT INTO public.orders (
    order_number, patient_name, patient_avatar, patient_age, patient_country, sub_brand, 
    medication, dosage_instructions, category, status, ordered_date, pharmacy, amount, 
    doctor, urgent, intake_complete, intake_notes, wait_mins, time, mrn, timeline
) VALUES 
(
    'RX-G7K2M9', 'Sophie Bennett', 'SB', 34, '🇺🇸 US', 'GlowRx', 
    'Semaglutide 0.25mg', 'Inject 0.25mg subcutaneously once weekly', 'Weight Loss', 
    'order_submitted', 'May 07, 2026', 'VialsRX', '$245', 'Pending assignment', 
    true, true, 'First visit. Intake submitted 2 hrs ago. BMI 31.', 12, '09:00 AM', 'D31118621',
    '[{"status": "order_submitted", "date": "May 07, 9:14 AM"}]'::jsonb
),
(
    'RX-V3N8P1', 'Caleb Montgomery', 'CM', 28, '🇬🇧 UK', 'VitalCare', 
    'Sildenafil 50mg', 'Take one tablet 1 hour before sexual activity', 'Men''s Health', 
    'doctor_reviewing', 'May 06, 2026', 'VialsRX', '$35', 'Dr. Marcus Thorne', 
    false, true, 'Returning patient. Refill request.', 5, '09:30 AM', 'S43385633',
    '[{"status": "order_submitted", "date": "May 06, 8:30 AM"}, {"status": "doctor_reviewing", "date": "May 06, 10:15 AM"}]'::jsonb
);

-- 4. Insert Initial Mock Data into Doctor Availability Table
INSERT INTO public.doctor_availability (id, name, specialty, avatar, available, wait_time, next_slot)
VALUES 
(1, 'Dr. Sarah Johnson', 'General Practice', 'SJ', true, '< 5 min', 'Available now'),
(2, 'Dr. Michael Chen', 'Cardiology', 'MC', true, '< 15 min', 'Today 11:00 AM'),
(3, 'Dr. Amira Hassan', 'Dermatology', 'AH', false, 'Async only', 'Tomorrow 9:00 AM'),
(4, 'Dr. Carlos Rivera', 'Endocrinology', 'CR', true, '< 30 min', 'Today 2:30 PM');

-- 5. Turn on Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies (For MVP, we allow public read/write to test it instantly without forcing you to build complex login forms first)
CREATE POLICY "Enable read access for all users" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.orders FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON public.doctor_availability FOR SELECT USING (true);
CREATE POLICY "Enable update for all users" ON public.doctor_availability FOR UPDATE USING (true);

-- 7. Create the Shared Resources Table (For Patient Education Tracking)
CREATE TABLE IF NOT EXISTS public.shared_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID,
    doctor_id UUID,
    title TEXT NOT NULL,
    type TEXT,
    category TEXT,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.shared_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.shared_resources FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.shared_resources FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- DONE! Your backend database is now live.
-- ==============================================================================
