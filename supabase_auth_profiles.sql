-- ==============================================================================
-- InvestN / Peak Health: Authentication & Profiles System
-- Run this in your Supabase SQL Editor to enable Roles and secure login.
-- ==============================================================================

-- 1. Create Profiles Table (to store user roles and brand associations)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'patient',
    brand_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Turn on RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Profiles RLS Policies
-- Users can read their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Super Admins can read all profiles
CREATE POLICY "Super Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- 4. Create an Auth Trigger
-- This automatically creates a profile row whenever a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, brand_id)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'patient'),
    NEW.raw_user_meta_data->>'brand_id'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- HOW TO CREATE A DOCTOR OR SUPER ADMIN:
-- 1. Sign up normally on your website (or via Auth -> Add User in Supabase)
-- 2. Come back to the SQL Editor and run ONE of these commands:
-- 
-- Make a user a Doctor:
-- UPDATE public.profiles SET role = 'doctor' WHERE id = (SELECT id FROM auth.users WHERE email = 'your.doctor@email.com');
--
-- Make a user a Super Admin:
-- UPDATE public.profiles SET role = 'super_admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'your.admin@email.com');
-- ==============================================================================
