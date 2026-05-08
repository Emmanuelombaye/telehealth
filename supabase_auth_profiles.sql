-- ==============================================================================
-- Peak Health: Authentication & Profiles System — FIXED (no RLS recursion)
-- Run this ENTIRE script in your Supabase SQL Editor
-- ==============================================================================

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'patient',
    brand_id TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Turn on RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop ALL old policies to start clean
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow trigger insert" ON public.profiles;

-- 4. Simple non-recursive RLS Policies
--    IMPORTANT: Never query the profiles table from within a profiles policy
--               (causes infinite recursion → 500 error)

-- Users can read their own profile row only
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile row only
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Anyone authenticated can insert (trigger runs as SECURITY DEFINER, always safe)
CREATE POLICY "profiles_insert_all"
ON public.profiles FOR INSERT
WITH CHECK (true);

-- Super admin SELECT is handled server-side via service_role key, NOT via a
-- recursive RLS policy. Remove the old recursive policy that caused 500 errors.

-- 5. Trigger function — creates a profile row when a new user signs up
--    Uses EXCEPTION so it NEVER blocks signup even if something goes wrong
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, brand_id, full_name)
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
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '[handle_new_user] Profile insert failed for user %. Signup still succeeds. Error: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Backfill: create profiles for any existing auth users who don't have one
--    (safe to run multiple times due to ON CONFLICT DO NOTHING)
INSERT INTO public.profiles (id, role)
SELECT id, COALESCE(NULLIF(raw_user_meta_data->>'role', ''), 'patient')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- PROMOTE USERS (run these individually as needed):
--
-- Doctor:
--   UPDATE public.profiles SET role = 'doctor'
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'doctor@example.com');
--
-- Brand Admin:
--   UPDATE public.profiles SET role = 'brand_admin'
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');
--
-- Super Admin:
--   UPDATE public.profiles SET role = 'super_admin'
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'superadmin@example.com');
-- ==============================================================================
