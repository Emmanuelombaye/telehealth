-- =============================================================================
-- PEAK HEALTH — STAFF AUTH (all portals, database-only login)
-- =============================================================================
-- Paste entire file in Supabase SQL Editor → RUN
--
-- Creates / updates staff accounts in auth.users + auth.identities + profiles.
-- Sets JWT app_metadata.role so portals authorize correctly.
-- Safe to re-run.
--
-- Default passwords (change after first login):
--   doctor@peakbodyco.com      → password123
--   admin@peakbodyco.com       → password123
--   brandon@peakbodyco.com     → @incorrect!
--   pharmacy@peakbodyco.com    → password123
--   affiliate@peakbodyco.com   → password123
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 0) Fix Auth 500 — NULL token columns break GoTrue login
-- ---------------------------------------------------------------------------
UPDATE auth.users SET confirmation_token = '' WHERE confirmation_token IS NULL;
UPDATE auth.users SET recovery_token = '' WHERE recovery_token IS NULL;
UPDATE auth.users SET email_change_token_new = '' WHERE email_change_token_new IS NULL;
UPDATE auth.users SET email_change = '' WHERE email_change IS NULL;

ALTER TABLE auth.users ALTER COLUMN confirmation_token SET DEFAULT '';
ALTER TABLE auth.users ALTER COLUMN recovery_token SET DEFAULT '';
ALTER TABLE auth.users ALTER COLUMN email_change_token_new SET DEFAULT '';
ALTER TABLE auth.users ALTER COLUMN email_change SET DEFAULT '';

-- ---------------------------------------------------------------------------
-- 1) Profiles table + signup trigger
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
-- 2) Upsert helper (auth.users + identities + profiles)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_staff_auth_user(
  p_email text,
  p_password text,
  p_role text,
  p_full_name text,
  p_brand_id text DEFAULT NULL,
  p_user_id uuid DEFAULT gen_random_uuid()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public, extensions
AS $$
DECLARE
  v_id uuid;
  v_instance uuid;
  v_app jsonb;
  v_meta jsonb;
  v_first text;
  v_last text;
BEGIN
  SELECT id INTO v_instance FROM auth.instances LIMIT 1;
  v_instance := COALESCE(v_instance, '00000000-0000-0000-0000-000000000000'::uuid);

  v_first := split_part(p_full_name, ' ', 1);
  v_last := NULLIF(trim(substring(p_full_name from length(v_first) + 2)), '');

  v_app := jsonb_build_object(
    'provider', 'email',
    'providers', jsonb_build_array('email'),
    'role', p_role
  );
  IF p_brand_id IS NOT NULL AND trim(p_brand_id) <> '' THEN
    v_app := v_app || jsonb_build_object('brand_id', p_brand_id);
  END IF;

  v_meta := jsonb_build_object(
    'role', p_role,
    'full_name', p_full_name,
    'first_name', v_first,
    'last_name', COALESCE(v_last, ''),
    'email_verified', true,
    'phone_verified', false
  );
  IF p_brand_id IS NOT NULL AND trim(p_brand_id) <> '' THEN
    v_meta := v_meta || jsonb_build_object('brand_id', p_brand_id);
  END IF;

  SELECT id INTO v_id FROM auth.users WHERE lower(email) = lower(p_email);

  IF v_id IS NULL THEN
    v_id := p_user_id;
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      is_sso_user
    ) VALUES (
      v_instance,
      v_id,
      'authenticated',
      'authenticated',
      lower(p_email),
      crypt(p_password, gen_salt('bf')),
      now(),
      v_app,
      v_meta || jsonb_build_object('sub', v_id::text, 'email', lower(p_email)),
      now(),
      now(),
      '',
      '',
      '',
      '',
      false
    );

    INSERT INTO auth.identities (
      id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_id::text,
      v_id,
      jsonb_build_object('sub', v_id::text, 'email', lower(p_email), 'email_verified', true, 'phone_verified', false),
      'email',
      now(),
      now(),
      now()
    )
    ON CONFLICT DO NOTHING;
  ELSE
    UPDATE auth.users SET
      encrypted_password = crypt(p_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change = COALESCE(email_change, ''),
      raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || v_app,
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || v_meta || jsonb_build_object('sub', v_id::text, 'email', lower(p_email)),
      updated_at = now()
    WHERE id = v_id;

    IF NOT EXISTS (
      SELECT 1 FROM auth.identities
      WHERE user_id = v_id AND provider = 'email'
    ) THEN
      INSERT INTO auth.identities (
        id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        v_id::text,
        v_id,
        jsonb_build_object('sub', v_id::text, 'email', lower(p_email), 'email_verified', true),
        'email',
        now(),
        now(),
        now()
      );
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, role, brand_id, full_name, status, updated_at)
  VALUES (v_id, lower(p_email), p_role, p_brand_id, p_full_name, 'active', now())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    brand_id = COALESCE(EXCLUDED.brand_id, public.profiles.brand_id),
    full_name = EXCLUDED.full_name,
    status = 'active',
    updated_at = now();

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_staff_auth_user(text, text, text, text, text, uuid) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 3) Provision all staff portal accounts
-- ---------------------------------------------------------------------------
SELECT public.upsert_staff_auth_user(
  'doctor@peakbodyco.com', 'password123', 'doctor', 'Clinical Provider', NULL,
  'be24ea7f-06a7-4e26-bf28-767a7a33e0ac'::uuid
);

SELECT public.upsert_staff_auth_user(
  'admin@peakbodyco.com', 'password123', 'brand_admin', 'Brand Administrator', 'peak',
  'f26ac66f-e65f-4817-a4eb-afec995d0d7b'::uuid
);

SELECT public.upsert_staff_auth_user(
  'brandon@peakbodyco.com', '@incorrect!', 'super_admin', 'Brandon Admin', 'peak',
  'd663b9d5-f91e-4f77-8172-6d830b975a5b'::uuid
);

SELECT public.upsert_staff_auth_user(
  'pharmacy@peakbodyco.com', 'password123', 'pharmacy', 'Pharmacy Fulfillment', NULL,
  'a8a1fa68-d720-4d92-83de-89f2d13bb7aa'::uuid
);

SELECT public.upsert_staff_auth_user(
  'affiliate@peakbodyco.com', 'password123', 'affiliate', 'Affiliate Partner', NULL,
  gen_random_uuid()
);

-- ---------------------------------------------------------------------------
-- 4) Role helper (used by RLS)
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

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Verification — every row should show ok = true
SELECT
  u.email,
  u.raw_app_meta_data->>'role' AS jwt_app_role,
  p.role AS profile_role,
  p.brand_id,
  u.email_confirmed_at IS NOT NULL AS email_confirmed,
  (u.encrypted_password IS NOT NULL) AS has_password,
  EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email') AS has_identity
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email IN (
  'doctor@peakbodyco.com',
  'admin@peakbodyco.com',
  'brandon@peakbodyco.com',
  'pharmacy@peakbodyco.com',
  'affiliate@peakbodyco.com'
)
ORDER BY u.email;

SELECT 'STAFF AUTH complete — sign in via each portal with Supabase credentials' AS status;
