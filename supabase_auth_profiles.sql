-- ==============================================================================
-- Peak Health: Profiles — EMERGENCY FIX v4 (schema-safe)
-- Run this ENTIRE script in your Supabase SQL Editor
-- ==============================================================================

-- STEP 1: Disable RLS immediately (stops all 500 errors right now)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- STEP 2: Add ALL missing columns safely (idempotent — safe to re-run)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email     TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brand_id  TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role      TEXT NOT NULL DEFAULT 'patient';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- STEP 3: Make email nullable (in case it has NOT NULL constraint)
DO $$ BEGIN
  ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- STEP 4: Drop ALL existing RLS policies (clean slate — no duplicates)
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- STEP 5: Re-enable RLS with correct, non-recursive policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_open"
  ON public.profiles FOR INSERT WITH CHECK (true);

-- STEP 6: Rebuild trigger function — includes email, never fails signup
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
    SET email = EXCLUDED.email;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[handle_new_user] failed for %: %', NEW.id, SQLERRM;
  RETURN NEW; -- NEVER block signup
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 7: Backfill all existing auth users (no updated_at reference)
INSERT INTO public.profiles (id, role, email)
SELECT
  u.id,
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'role'), ''), 'patient'),
  u.email
FROM auth.users u
ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;

-- STEP 8: Verify — should show all users with role + email
SELECT id, email, role FROM public.profiles ORDER BY id;

-- ==============================================================================
-- PROMOTE USERS (run individually):
--   UPDATE public.profiles SET role = 'doctor'     WHERE email = 'dr@example.com';
--   UPDATE public.profiles SET role = 'super_admin' WHERE email = 'sa@example.com';
-- ==============================================================================
