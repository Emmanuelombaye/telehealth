-- =============================================================================
-- PEAK HEALTH — FIX Auth 500 "Database error querying schema" on login
-- =============================================================================
-- Run this FIRST in Supabase SQL Editor if staff login returns HTTP 500.
--
-- Cause: GoTrue cannot read auth.users rows where token columns are NULL.
-- Safe to re-run.
-- =============================================================================

BEGIN;

-- 1) Fix existing rows (required for login to work)
UPDATE auth.users SET confirmation_token = '' WHERE confirmation_token IS NULL;
UPDATE auth.users SET recovery_token = '' WHERE recovery_token IS NULL;
UPDATE auth.users SET email_change_token_new = '' WHERE email_change_token_new IS NULL;
UPDATE auth.users SET email_change = '' WHERE email_change IS NULL;

-- 2) Prevent future NULL inserts
ALTER TABLE auth.users ALTER COLUMN confirmation_token SET DEFAULT '';
ALTER TABLE auth.users ALTER COLUMN recovery_token SET DEFAULT '';
ALTER TABLE auth.users ALTER COLUMN email_change_token_new SET DEFAULT '';
ALTER TABLE auth.users ALTER COLUMN email_change SET DEFAULT '';

-- 3) Ensure email identities exist for staff emails
INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT
  gen_random_uuid(),
  u.id::text,
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  COALESCE(u.last_sign_in_at, now()),
  COALESCE(u.created_at, now()),
  COALESCE(u.updated_at, now())
FROM auth.users u
WHERE u.email IN (
  'doctor@peakbodyco.com',
  'admin@peakbodyco.com',
  'brandon@peakbodyco.com',
  'pharmacy@peakbodyco.com',
  'affiliate@peakbodyco.com'
)
AND NOT EXISTS (
  SELECT 1 FROM auth.identities i
  WHERE i.user_id = u.id AND i.provider = 'email'
);

-- 4) JWT roles: app_metadata.role + user_metadata.role (portals read both)
UPDATE auth.users u SET
  email_confirmed_at = COALESCE(u.email_confirmed_at, now()),
  raw_app_meta_data = (
    COALESCE(u.raw_app_meta_data, '{}'::jsonb)
    - 'role' - 'brand_id'
  ) || jsonb_strip_nulls(jsonb_build_object(
    'provider', 'email',
    'providers', jsonb_build_array('email'),
    'role', v.role,
    'brand_id', v.brand_id
  )),
  raw_user_meta_data = COALESCE(u.raw_user_meta_data, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
    'role', v.role,
    'brand_id', v.brand_id,
    'full_name', v.full_name,
    'email_verified', true
  ))
FROM (VALUES
  ('doctor@peakbodyco.com',      'doctor',       NULL,   'Clinical Provider'),
  ('admin@peakbodyco.com',       'brand_admin',  'peak', 'Brand Administrator'),
  ('brandon@peakbodyco.com',     'super_admin',  'peak', 'Brandon Admin'),
  ('pharmacy@peakbodyco.com',    'pharmacy',     NULL,   'Pharmacy Fulfillment'),
  ('affiliate@peakbodyco.com',   'affiliate',    NULL,   'Affiliate Partner')
) AS v(email, role, brand_id, full_name)
WHERE lower(u.email) = v.email;

-- 5) Reset staff passwords to known values (bcrypt from working migration)
UPDATE auth.users SET encrypted_password = v.pw_hash
FROM (VALUES
  ('doctor@peakbodyco.com',    '$2a$10$M4pVqMXqsgyiwdwgCOUNZubyGHA7/x4BJHxubO6j5.YxQpyY0TIjS'),
  ('admin@peakbodyco.com',     '$2a$10$XvKD33W5X0fofvUIAmoUcu60hy2kbVjNJp3mYGSUZ2frxTHNzvXMu'),
  ('brandon@peakbodyco.com',   '$2a$10$C6kr8Kfnz5fURa5CSsUDCOH03bRKe3sTDdi67UE.AD2XML164e.2S'),
  ('pharmacy@peakbodyco.com',  '$2a$10$.sX2AnvbFPx2N44q8U0iReEuvlfDL1dtTTrbFOlg/1tJz2AdZZP4C')
) AS v(email, pw_hash)
WHERE lower(auth.users.email) = v.email;

-- 6) Sync profiles
INSERT INTO public.profiles (id, email, role, brand_id, full_name, status, updated_at)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_app_meta_data->>'role', u.raw_user_meta_data->>'role', 'patient'),
  NULLIF(u.raw_app_meta_data->>'brand_id', ''),
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  'active',
  now()
FROM auth.users u
WHERE u.email IN (
  'doctor@peakbodyco.com',
  'admin@peakbodyco.com',
  'brandon@peakbodyco.com',
  'pharmacy@peakbodyco.com',
  'affiliate@peakbodyco.com'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  brand_id = COALESCE(EXCLUDED.brand_id, public.profiles.brand_id),
  full_name = EXCLUDED.full_name,
  status = 'active',
  updated_at = now();

COMMIT;

-- Verification
SELECT
  u.email,
  u.raw_app_meta_data->>'role' AS app_role,
  (u.confirmation_token IS NOT NULL) AS confirmation_ok,
  (u.recovery_token IS NOT NULL) AS recovery_ok,
  u.email_confirmed_at IS NOT NULL AS email_confirmed,
  EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email') AS has_identity
FROM auth.users u
WHERE u.email IN (
  'doctor@peakbodyco.com',
  'admin@peakbodyco.com',
  'brandon@peakbodyco.com',
  'pharmacy@peakbodyco.com',
  'affiliate@peakbodyco.com'
)
ORDER BY u.email;

SELECT 'AUTH 500 FIX complete — try portal login again' AS status;
