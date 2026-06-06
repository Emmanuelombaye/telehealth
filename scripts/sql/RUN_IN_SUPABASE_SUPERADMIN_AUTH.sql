-- =============================================================================
-- PEAK HEALTH — Super Admin auth fix (Supabase SQL Editor)
-- =============================================================================
-- Run this on the SAME project as VITE_SUPABASE_URL (e.g. vzzmshbvofwihrigewiq).
--
-- BEFORE running SQL:
--   1. Dashboard → Authentication → Users → Add user
--      Email: brandon@peakbodyco.com
--      Password: (your choice — update demo password in staffDemoAuth.ts if needed)
--      ✓ Auto Confirm User
--   2. Open that user → App metadata → set:
--        { "role": "super_admin", "brand_id": "peak" }
--
-- THEN paste ALL of this → RUN. Safe to re-run.
-- =============================================================================

-- Safe signup trigger (prevents 500 on user creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email, full_name, brand_id)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'role'), ''), 'patient'),
    NEW.email,
    NULLIF(trim(
      COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' ||
      COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    ), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'brand_id', '')), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    role = COALESCE(NULLIF(EXCLUDED.role, ''), public.profiles.role);
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

-- Sync brandon@peakbodyco.com profile + metadata
UPDATE auth.users
SET
  raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"super_admin","brand_id":"peak"}'::jsonb,
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
    'role', 'super_admin',
    'brand_id', 'peak',
    'first_name', COALESCE(raw_user_meta_data->>'first_name', 'Brandon'),
    'last_name', COALESCE(raw_user_meta_data->>'last_name', 'Admin'),
    'full_name', COALESCE(raw_user_meta_data->>'full_name', 'Brandon Admin')
  )
WHERE email = 'brandon@peakbodyco.com';

INSERT INTO public.profiles (id, email, role, brand_id, full_name, status)
SELECT
  u.id,
  u.email,
  'super_admin',
  'peak',
  COALESCE(u.raw_user_meta_data->>'full_name', 'Brandon Admin'),
  'active'
FROM auth.users u
WHERE u.email = 'brandon@peakbodyco.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  brand_id = 'peak',
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
  status = 'active';

-- Verification
SELECT
  u.email,
  u.raw_app_meta_data->>'role' AS app_role,
  u.raw_user_meta_data->>'role' AS user_role,
  p.role AS profile_role,
  p.brand_id,
  u.email_confirmed_at IS NOT NULL AS email_confirmed
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'brandon@peakbodyco.com';
