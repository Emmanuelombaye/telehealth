-- Add missing column for tracking approval timestamps
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS last_approved_at TIMESTAMPTZ;

-- Force Supabase to reload its schema cache immediately so the errors go away
NOTIFY pgrst, 'reload schema';
