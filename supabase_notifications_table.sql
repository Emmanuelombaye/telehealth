-- ==============================================================================
-- Peak Health: Notifications Table Migration
-- ==============================================================================

-- 1. Create the Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT,
    type TEXT, -- appointment, lab, message, prescription, security
    unread BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 4. Insert Mock Notifications for Verification
-- (Optional: Replace 'user_id' with a real one if testing manually)
-- INSERT INTO public.notifications (title, body, type, unread) VALUES 
-- ('Prescription Approved', 'Your Semaglutide prescription has been sent to VialsRX.', 'prescription', true),
-- ('New Message', 'Dr. Thorne sent you a secure message regarding your vitals.', 'message', true);
