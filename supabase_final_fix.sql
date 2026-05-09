-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  PEAK HEALTH — INFRASTRUCTURE & MESSAGING FIX                  ║
-- ║  Paste this entire block into Supabase SQL Editor and click RUN ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. FIX ORDERS TABLE (Add missing columns for Shop/Doctor flow)
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

-- 1b. CREATE DOCTOR SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
    doctor_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    schedule JSONB DEFAULT '{}'::jsonb,
    timezone TEXT DEFAULT 'America/New_York',
    buffer_mins INTEGER DEFAULT 10,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. FIX MESSAGES TABLE (Ensures Join with Profiles works)
-- First, recreate the messages table to ensure clean foreign keys to public.profiles
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

-- 3. ENABLE RLS FOR MESSAGES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. CREATE POLICIES FOR MESSAGES (Simplified for now to ensure flow)
CREATE POLICY "Users can view their own messages"
    ON public.messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert their own messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- 5. RE-SYNC PROFILES (Just in case)
INSERT INTO public.profiles (id, email, role, full_name)
SELECT 
    id, 
    email, 
    COALESCE((raw_user_meta_data::jsonb)->>'role', 'patient'),
    COALESCE((raw_user_meta_data::jsonb)->>'full_name', CONCAT_WS(' ', (raw_user_meta_data::jsonb)->>'first_name', (raw_user_meta_data::jsonb)->>'last_name'))
FROM auth.users
ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

-- 6. ENSURE ORDERS RLS COVERS USER_ID
DROP POLICY IF EXISTS "Patients view own orders" ON public.orders;
CREATE POLICY "Patients view own orders" 
    ON public.orders FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Patients insert own orders" ON public.orders;
CREATE POLICY "Patients insert own orders" 
    ON public.orders FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 7. RE-LINK MESSAGES TO PROFILES (For Supabase Studio UI)
COMMENT ON COLUMN public.messages.sender_id IS '@foreignKey (profiles) references id';
COMMENT ON COLUMN public.messages.receiver_id IS '@foreignKey (profiles) references id';
