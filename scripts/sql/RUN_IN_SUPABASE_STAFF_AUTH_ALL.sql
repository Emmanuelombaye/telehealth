-- =============================================================================
-- PEAK HEALTH — STAFF AUTH (public schema only — SQL Editor safe)
-- =============================================================================
-- Hosted Supabase does NOT allow ALTER/INSERT helpers on auth.users from SQL
-- Editor (must be owner). Use Admin API for auth accounts:
--
--   1. RUN this file in SQL Editor
--   2. RUN scripts/sql/RUN_IN_SUPABASE_AUTH_500_FIX.sql
--   3. If login still fails: RUN_IN_SUPABASE_AUTH_RESET_STAFF.sql
--   4. Locally: npm run auth:provision-staff
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Profiles table + signup trigger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'patient',
  email TEXT,
  full_name TEXT,
  brand_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brand_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'patient';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email, full_name, brand_id, status)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(NEW.raw_app_meta_data->>'role'), ''), NULLIF(trim(NEW.raw_user_meta_data->>'role'), ''), 'patient'),
    NEW.email,
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_app_meta_data->>'brand_id', NEW.raw_user_meta_data->>'brand_id', '')), ''),
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    role = COALESCE(NULLIF(EXCLUDED.role, ''), public.profiles.role),
    brand_id = COALESCE(EXCLUDED.brand_id, public.profiles.brand_id),
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    updated_at = now();
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'profile insert skipped for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Role helper (RLS)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(trim(auth.jwt() -> 'app_metadata' ->> 'role'), ''),
    NULLIF(trim(auth.jwt() -> 'user_metadata' ->> 'role'), ''),
    (SELECT p.role::text FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1),
    'patient'
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_role() TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Helpers callable from npm run auth:provision-staff (service role RPC)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fix_auth_null_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  UPDATE auth.users SET confirmation_token = '' WHERE confirmation_token IS NULL;
  UPDATE auth.users SET recovery_token = '' WHERE recovery_token IS NULL;
  UPDATE auth.users SET email_change_token_new = '' WHERE email_change_token_new IS NULL;
  UPDATE auth.users SET email_change = '' WHERE email_change IS NULL;
  UPDATE auth.users SET email_confirmed_at = COALESCE(email_confirmed_at, now())
  WHERE email IN (
    'doctor@peakbodyco.com', 'admin@peakbodyco.com', 'brandon@peakbodyco.com',
    'pharmacy@peakbodyco.com', 'affiliate@peakbodyco.com'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.lookup_staff_user_ids()
RETURNS TABLE(email text, user_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT u.email::text, u.id
  FROM auth.users u
  WHERE u.email IN (
    'doctor@peakbodyco.com',
    'admin@peakbodyco.com',
    'brandon@peakbodyco.com',
    'pharmacy@peakbodyco.com',
    'affiliate@peakbodyco.com'
  );
$$;

CREATE OR REPLACE FUNCTION public.delete_broken_staff_auth_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  DELETE FROM auth.identities
  WHERE user_id IN (
    SELECT id FROM auth.users
    WHERE email IN (
      'doctor@peakbodyco.com', 'admin@peakbodyco.com',
      'brandon@peakbodyco.com', 'pharmacy@peakbodyco.com'
    )
  );
  DELETE FROM auth.users
  WHERE email IN (
    'doctor@peakbodyco.com', 'admin@peakbodyco.com',
    'brandon@peakbodyco.com', 'pharmacy@peakbodyco.com'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fix_auth_null_tokens() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lookup_staff_user_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_broken_staff_auth_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fix_auth_null_tokens() TO service_role;
GRANT EXECUTE ON FUNCTION public.lookup_staff_user_ids() TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_broken_staff_auth_users() TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';

SELECT 'Profiles + trigger ready — run npm run auth:provision-staff for staff logins' AS status;
