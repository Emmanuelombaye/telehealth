-- Add missing zoom_join_url column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_join_url TEXT;

-- Verify if other potentially missing columns should be added
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consultation_time TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_status TEXT DEFAULT 'not_requested';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_doctor_message TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_rescheduled_time TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Ensure RLS is enabled and policies are set (safety check)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
CREATE POLICY "Enable read access for all users" ON public.orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable update for all users" ON public.orders;
CREATE POLICY "Enable update for all users" ON public.orders FOR UPDATE USING (true);
