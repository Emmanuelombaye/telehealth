-- ==============================================================================
-- Peak Health: Profiles — EMERGENCY FIX + CLEAN REBUILD
-- Run this ENTIRE script in your Supabase SQL Editor NOW
-- ==============================================================================

-- STEP 1: EMERGENCY — Disable RLS immediately to stop all 500 errors
-- (We will re-enable it with correct policies below)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- STEP 2: Make email nullable (actual Supabase schema has email NOT NULL)
DO $$
BEGIN
  ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
  NULL; -- column may not exist yet, that's fine
END $$;

-- STEP 3: Add missing columns safely
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brand_id TEXT;

-- STEP 4: Drop ALL existing policies (clean slate)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- STEP 5: Re-enable RLS with CORRECT non-recursive policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users read/update their own row only (no self-referencing subquery)
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Open insert for service role + trigger (SECURITY DEFINER bypasses RLS anyway)
CREATE POLICY "profiles_insert_open"
  ON public.profiles FOR INSERT WITH CHECK (true);

-- STEP 6: Rebuild trigger — always includes email, never fails signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email, full_name, brand_id)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'patient'),
    NEW.email,
    NULLIF(TRIM(
      COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' ||
      COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    ), ' '),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'brand_id', '')), '')
  )
  ON CONFLICT (id) DO UPDATE
    SET email      = EXCLUDED.email,
        updated_at = now();
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- NEVER block signup even if profile insert fails
  RAISE WARNING '[handle_new_user] profile insert failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 7: Backfill all existing auth users into profiles
INSERT INTO public.profiles (id, role, email)
SELECT
  u.id,
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'role'), ''), 'patient'),
  u.email
FROM auth.users u
ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = now();

-- STEP 8: Verify everything looks correct
-- Run this SELECT to confirm (should show all your users with email + role):
SELECT id, email, role, created_at FROM public.profiles ORDER BY created_at DESC;

-- ==============================================================================
-- PROMOTE A USER (run individually):
--
--   UPDATE public.profiles SET role = 'doctor'
--   WHERE email = 'doctor@peakhealth.com';
--
--   UPDATE public.profiles SET role = 'super_admin'
--   WHERE email = 'admin@peakhealth.com';
-- ==============================================================================
