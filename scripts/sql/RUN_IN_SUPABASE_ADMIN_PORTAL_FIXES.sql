-- =============================================================================
-- PEAK HEALTH — ADMIN PORTAL FIXES (paste entire file in Supabase SQL Editor → RUN)
-- =============================================================================
-- Fixes from admin portal work:
--   1. Brand admin could not see Orders / Analytics (RLS + legacy sub_brand)
--   2. JWT brand_id "peak" vs UUID mismatch
--   3. Staff profile brand_id alignment
--
-- SAFE TO RE-RUN (idempotent). Does NOT delete orders or users.
-- AFTER RUN: log out and log back in as brand admin (admin@peakbodyco.com).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- PART 1 — Auth helpers (role + brand from JWT / profiles)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(trim(auth.jwt() -> 'app_metadata' ->> 'role'), ''),
    NULLIF(trim(auth.jwt() -> 'user_metadata' ->> 'role'), ''),
    (SELECT p.role::text FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1),
    'patient'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_auth_brand()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    CASE
      WHEN lower(trim(raw)) IN ('peak', 'peak-health') THEN (
        SELECT b.id::text FROM public.brands b WHERE b.slug = 'peak-health' LIMIT 1
      )
      ELSE raw
    END,
    ''
  )
  FROM (
    SELECT COALESCE(
      NULLIF(trim(auth.jwt() -> 'app_metadata' ->> 'brand_id'), ''),
      NULLIF(trim(auth.jwt() -> 'user_metadata' ->> 'brand_id'), ''),
      (SELECT p.brand_id::text FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1),
      ''
    ) AS raw
  ) s;
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_auth_brand() TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- PART 2 — Brand admin orders RLS (legacy sub_brand = 'Peak Health')
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sub_brand_matches_auth_brand(p_sub_brand text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH auth AS (
    SELECT nullif(trim(public.get_auth_brand()), '') AS bid
  ),
  peak AS (
    SELECT id::text AS pid FROM public.brands WHERE slug = 'peak-health' LIMIT 1
  )
  SELECT EXISTS (
    SELECT 1
    FROM auth
    LEFT JOIN peak ON true
    WHERE
      coalesce(p_sub_brand, '') = coalesce(auth.bid, '')
      OR (
        peak.pid IS NOT NULL
        AND auth.bid IN (peak.pid, 'a009d8db-c770-4287-a15e-cc82515437ef')
        AND coalesce(p_sub_brand, '') IN (
          'Peak Health', 'peak', 'peak-health', peak.pid, 'a009d8db-c770-4287-a15e-cc82515437ef'
        )
      )
      OR (
        peak.pid IS NOT NULL
        AND lower(coalesce(auth.bid, '')) IN ('peak', 'peak-health')
        AND coalesce(p_sub_brand, '') IN (
          'Peak Health', 'peak', 'peak-health', peak.pid, 'a009d8db-c770-4287-a15e-cc82515437ef'
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.sub_brand_matches_auth_brand(text) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Orders: brand admin view" ON public.orders;
CREATE POLICY "Orders: brand admin view" ON public.orders
  FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'brand_admin'
    AND public.sub_brand_matches_auth_brand(sub_brand)
  );

DROP POLICY IF EXISTS "Orders: brand admin insert scoped" ON public.orders;
CREATE POLICY "Orders: brand admin insert scoped" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_auth_role() = 'brand_admin'
    AND public.sub_brand_matches_auth_brand(sub_brand)
  );

DROP POLICY IF EXISTS "Orders: brand admin update scoped" ON public.orders;
CREATE POLICY "Orders: brand admin update scoped" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    public.get_auth_role() = 'brand_admin'
    AND public.sub_brand_matches_auth_brand(sub_brand)
  );

-- -----------------------------------------------------------------------------
-- PART 3 — Ensure Peak Health brand row exists (never change id — FK on brand_hostnames)
-- -----------------------------------------------------------------------------
INSERT INTO public.brands (name, slug, status)
VALUES ('Peak Health', 'peak-health', 'active')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  status = COALESCE(public.brands.status, EXCLUDED.status);

-- -----------------------------------------------------------------------------
-- PART 4 — Staff JWT + profiles: use LIVE peak-health id from brands table
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  peak_id text;
BEGIN
  SELECT id::text INTO peak_id FROM public.brands WHERE slug = 'peak-health' LIMIT 1;
  IF peak_id IS NULL THEN
    RAISE NOTICE 'peak-health brand not found — skipping staff brand_id sync';
    RETURN;
  END IF;
  -- profiles.brand_id for brand admins / super admins on Peak
  UPDATE public.profiles p
  SET brand_id = peak_id,
      role = COALESCE(p.role, 'brand_admin')
  FROM auth.users u
  WHERE p.id = u.id
    AND u.email IN ('admin@peakbodyco.com', 'brandon@peakbodyco.com')
    AND (p.brand_id IS NULL OR p.brand_id IN ('peak', 'peak-health', ''));

  -- JWT app_metadata (requires SQL editor / service access to auth schema)
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('brand_id', peak_id)
  WHERE email IN ('admin@peakbodyco.com', 'brandon@peakbodyco.com')
    AND COALESCE(raw_app_meta_data->>'brand_id', '') IN ('', 'peak', 'peak-health');

  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', 'brand_admin')
  WHERE email = 'admin@peakbodyco.com'
    AND COALESCE(raw_app_meta_data->>'role', '') <> 'brand_admin';

  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', 'super_admin')
  WHERE email = 'brandon@peakbodyco.com'
    AND COALESCE(raw_app_meta_data->>'role', '') <> 'super_admin';

  -- Mirror into user_metadata for older clients
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('brand_id', peak_id)
  WHERE email IN ('admin@peakbodyco.com', 'brandon@peakbodyco.com')
    AND COALESCE(raw_user_meta_data->>'brand_id', '') IN ('', 'peak', 'peak-health');
END $$;

-- -----------------------------------------------------------------------------
-- PART 5 — Audit / PHI logging tables (admin Audit page)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid,
  actor_email text,
  role text,
  brand_scope text,
  action text NOT NULL,
  target_type text,
  target_id text,
  detail jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin audit: staff read" ON public.admin_audit_logs;
CREATE POLICY "Admin audit: staff read" ON public.admin_audit_logs
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IN ('brand_admin', 'super_admin'));

DROP POLICY IF EXISTS "Admin audit: staff insert" ON public.admin_audit_logs;
CREATE POLICY "Admin audit: staff insert" ON public.admin_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.get_auth_role() IN ('brand_admin', 'super_admin'));

CREATE TABLE IF NOT EXISTS public.phi_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid,
  actor_email text,
  role text,
  brand_scope text,
  access_type text DEFAULT 'staff',
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  subject_user_id uuid,
  route_path text,
  detail jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.phi_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PHI access: staff read" ON public.phi_access_logs;
CREATE POLICY "PHI access: staff read" ON public.phi_access_logs
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IN ('brand_admin', 'super_admin', 'doctor'));

DROP POLICY IF EXISTS "PHI access: staff insert" ON public.phi_access_logs;
CREATE POLICY "PHI access: staff insert" ON public.phi_access_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.get_auth_role() IN ('brand_admin', 'super_admin', 'doctor', 'patient'));

-- -----------------------------------------------------------------------------
-- PART 6 — Brand admin messages RLS (read patient↔doctor threads for brand)
-- -----------------------------------------------------------------------------
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

DROP POLICY IF EXISTS "Messages: brand admin view scoped" ON public.messages;
CREATE POLICY "Messages: brand admin view scoped" ON public.messages
  FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'brand_admin'
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE public.sub_brand_matches_auth_brand(o.sub_brand)
        AND o.user_id IS NOT NULL
        AND o.doctor_id IS NOT NULL
        AND messages.sender_id IN (o.user_id, o.doctor_id)
        AND messages.receiver_id IN (o.user_id, o.doctor_id)
        AND messages.sender_id <> messages.receiver_id
    )
  );

COMMIT;

-- =============================================================================
-- VERIFICATION (read-only — should all look good)
-- =============================================================================
SELECT 'peak_brand' AS check_name,
       id::text, slug, name
FROM public.brands WHERE slug = 'peak-health' LIMIT 1;

SELECT 'orders_sub_brand_sample' AS check_name,
       sub_brand, count(*) AS cnt
FROM public.orders
GROUP BY sub_brand
ORDER BY cnt DESC
LIMIT 5;

SELECT 'staff_jwt_brand' AS check_name,
       email,
       raw_app_meta_data->>'role' AS jwt_role,
       raw_app_meta_data->>'brand_id' AS jwt_brand_id
FROM auth.users
WHERE email IN ('admin@peakbodyco.com', 'brandon@peakbodyco.com');

SELECT 'staff_profiles' AS check_name,
       p.email, p.role, p.brand_id
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email IN ('admin@peakbodyco.com', 'brandon@peakbodyco.com');

SELECT 'audit_tables' AS check_name,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit_logs') AS admin_audit_ok,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'phi_access_logs') AS phi_audit_ok;

-- =============================================================================
-- DONE — Next steps:
--   1. Log out of /admin
--   2. Log back in as admin@peakbodyco.com
--   3. Open /admin/orders and /admin/analytics
-- Optional CLI (if SUPABASE_DB_URL in .env.local): npm run db:fix-brand-admin-orders
-- =============================================================================
