-- Doctor Settings: ensure profiles columns used by /doctor/settings exist.
-- Run once in Supabase SQL Editor.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calendly_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS npi_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credentials TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS licensed_states TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
