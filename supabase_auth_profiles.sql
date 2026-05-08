-- ==============================================================================
-- Peak Health: Authentication & Profiles System — FIXED v3
-- Run this ENTIRE script in your Supabase SQL Editor
-- ==============================================================================

-- 1. Ensure profiles table exists (safe if already exists)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'patient',
    brand_id TEXT,
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Fix schema: make email nullable (if it has a NOT NULL constraint, remove it)
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- 3. Add any missing columns safely
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brand_id TEXT;

-- 4. Turn on RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Drop ALL old policies to start clean
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow trigger insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_all" ON public.profiles;

-- 6. Clean non-recursive RLS Policies
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "profiles_insert_all"
ON public.profiles FOR INSERT
WITH CHECK (true);

-- 7. Trigger function — includes email from auth.users, handles all cases
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, brand_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'patient'),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'brand_id'), ''),
    NULLIF(
      TRIM(
        COALESCE(NEW.raw_user_meta_data->>'first_name', '') ||
        ' ' ||
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
      ),
      ' '
    ),
    NEW.email  -- always available from auth.users
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = now();
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '[handle_new_user] Profile insert failed for %. Error: %', NEW.id, SQLERRM;
    RETURN NEW;  -- NEVER block signup
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Backfill: create/update profiles for existing auth users
--    Pulls email directly from auth.users — no null constraint violation
INSERT INTO public.profiles (id, role, email)
SELECT
  u.id,
  COALESCE(NULLIF(u.raw_user_meta_data->>'role', ''), 'patient'),
  u.email
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = now();

-- ==============================================================================
-- VERIFY (run this to check your profiles):
--   SELECT p.id, p.role, p.email FROM public.profiles p;
--
-- PROMOTE USERS:
--   UPDATE public.profiles SET role = 'doctor'
--   WHERE email = 'doctor@example.com';
--
--   UPDATE public.profiles SET role = 'brand_admin'
--   WHERE email = 'admin@example.com';
--
--   UPDATE public.profiles SET role = 'super_admin'
--   WHERE email = 'superadmin@example.com';
-- ==============================================================================
