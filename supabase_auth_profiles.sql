-- ==============================================================================
-- Peak Health: Authentication & Profiles System
-- Run this ENTIRE script in your Supabase SQL Editor
-- ==============================================================================

-- 1. Create Profiles Table (stores user roles and brand associations)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'patient',
    brand_id TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Turn on RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop old policies first to avoid duplicates on re-run
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- 4. Profiles RLS Policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Allow the trigger function (SECURITY DEFINER) to insert profiles
CREATE POLICY "Service role can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (true);

-- Super Admins can view all profiles
CREATE POLICY "Super Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- 5. Create / replace the trigger function WITH error handling
--    Using EXCEPTION WHEN OTHERS means signup NEVER returns a 500 due to this trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, brand_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NULLIF((NEW.raw_user_meta_data->>'role')::text, ''), 'patient'),
    NULLIF(NEW.raw_user_meta_data->>'brand_id', ''),
    NULLIF(
      TRIM(
        COALESCE(NEW.raw_user_meta_data->>'first_name', '') ||
        ' ' ||
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
      ),
      ''
    )
  )
  ON CONFLICT (id) DO NOTHING;  -- safe if profile already exists
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but NEVER fail the signup
    RAISE WARNING 'handle_new_user: could not create profile for user %. Error: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attach / re-attach the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- HOW TO PROMOTE A USER TO DOCTOR OR ADMIN:
--
-- Make a user a Doctor:
-- UPDATE public.profiles SET role = 'doctor'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'doctor@example.com');
--
-- Make a user a Brand Admin:
-- UPDATE public.profiles SET role = 'brand_admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');
--
-- Make a user a Super Admin:
-- UPDATE public.profiles SET role = 'super_admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'superadmin@example.com');
-- ==============================================================================
