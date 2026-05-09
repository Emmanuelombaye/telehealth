-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  PEAK HEALTH — INFRASTRUCTURE FIX + CLEAN RESET                ║
-- ║  Run this to wipe mock data and prepare for production testing. ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. DATA WIPE (Nuclear Reset)
TRUNCATE TABLE public.orders CASCADE;
TRUNCATE TABLE public.messages CASCADE;
TRUNCATE TABLE public.doctor_schedules CASCADE;
TRUNCATE TABLE public.doctor_availability CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- 2. INFRASTRUCTURE ALIGNMENT (Ensuring all columns exist)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS intake_answers JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_vitals JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consultation_time TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_status TEXT DEFAULT 'not_requested';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_doctor_message TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_rescheduled_time TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipped_date TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.profiles(id);

-- 3. TABLE RE-CREATION (Clean State)
DROP TABLE IF EXISTS public.messages;
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.doctor_schedules (
    doctor_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    schedule JSONB DEFAULT '{}'::jsonb,
    timezone TEXT DEFAULT 'America/New_York',
    buffer_mins INTEGER DEFAULT 10,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS POLICIES (Strict Production Security)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own messages" ON public.messages;
CREATE POLICY "Users view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS "Users insert own messages" ON public.messages;
CREATE POLICY "Users insert own messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Patients view own orders" ON public.orders;
CREATE POLICY "Patients view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Patients insert own orders" ON public.orders;
CREATE POLICY "Patients insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. RE-SYNC PROFILES FROM AUTH (Empty at first, will sync on new signups)
-- (Trigger handle_new_user should already be in place from previous scripts)

-- 6. SYSTEM SEED (Minimal required for app to function)
INSERT INTO public.doctor_availability (id, name, specialty, avatar, available, wait_time, next_slot)
VALUES 
(1, 'Dr. Sarah Johnson', 'General Practice', 'SJ', true, '< 5 min', 'Available now'),
(2, 'Dr. Michael Chen', 'Cardiology', 'MC', true, '< 15 min', 'Today 11:00 AM'),
(3, 'Dr. Amira Hassan', 'Dermatology', 'AH', false, 'Async only', 'Tomorrow 9:00 AM'),
(4, 'Dr. Carlos Rivera', 'Endocrinology', 'CR', true, '< 30 min', 'Today 2:30 PM')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    specialty = EXCLUDED.specialty,
    available = EXCLUDED.available;

-- 7. RESULT
SELECT 'DATABASE WIPED & INFRASTRUCTURE READY' as status;
