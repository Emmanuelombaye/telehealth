-- =============================================================================
-- Peak Health — production core RBAC (orders, products, audit)
-- Apply with: supabase db push   OR   paste into Supabase SQL editor
--
-- After apply: set app_metadata.role + app_metadata.brand_id on users via
-- Supabase Dashboard or Auth Admin API (JWT is the source of truth for RLS).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Role / brand helpers (SECURITY DEFINER — avoids RLS recursion on profiles)
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
    NULLIF(trim(auth.jwt() -> 'app_metadata' ->> 'brand_id'), ''),
    NULLIF(trim(auth.jwt() -> 'user_metadata' ->> 'brand_id'), ''),
    (SELECT p.brand_id::text FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1),
    ''
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_auth_brand() TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 2) Admin audit log (non-clinical ops trail)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  actor_id uuid NOT NULL,
  actor_email text,
  role text NOT NULL,
  brand_scope text,
  action text NOT NULL,
  target_type text,
  target_id text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON public.admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_brand ON public.admin_audit_logs (brand_scope);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_audit_insert_authenticated_staff" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_insert_authenticated_staff" ON public.admin_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND public.get_auth_role() IN ('brand_admin', 'super_admin')
  );

DROP POLICY IF EXISTS "admin_audit_super_select" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_super_select" ON public.admin_audit_logs
  FOR SELECT TO authenticated
  USING (public.get_auth_role() = 'super_admin');

DROP POLICY IF EXISTS "admin_audit_brand_select" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_brand_select" ON public.admin_audit_logs
  FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'brand_admin'
    AND coalesce(brand_scope, '') = coalesce(nullif(public.get_auth_brand(), ''), '')
  );

COMMENT ON TABLE public.admin_audit_logs IS 'Non-clinical admin/superadmin action log; populated from the web app.';

-- -----------------------------------------------------------------------------
-- 3) Orders — replace broad / MVP policies with scoped access
-- -----------------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "MVP Public Select" ON public.orders;
DROP POLICY IF EXISTS "MVP Public Insert" ON public.orders;
DROP POLICY IF EXISTS "MVP Public Update" ON public.orders;
DROP POLICY IF EXISTS "Orders select policy" ON public.orders;
DROP POLICY IF EXISTS "Orders insert policy" ON public.orders;
DROP POLICY IF EXISTS "Orders update policy" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable update for all users" ON public.orders;
DROP POLICY IF EXISTS "Patients view own orders" ON public.orders;
DROP POLICY IF EXISTS "Patients insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can read own orders or if doctor/admin" ON public.orders;
DROP POLICY IF EXISTS "Brand Admins view own brand orders" ON public.orders;
DROP POLICY IF EXISTS "Doctors view all orders" ON public.orders;
DROP POLICY IF EXISTS "Super Admins view all orders" ON public.orders;
DROP POLICY IF EXISTS "Doctors and Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Brand Admins update own brand orders" ON public.orders;
DROP POLICY IF EXISTS "Orders: patient view own" ON public.orders;
DROP POLICY IF EXISTS "Orders: brand admin view" ON public.orders;
DROP POLICY IF EXISTS "Orders: global staff view" ON public.orders;
DROP POLICY IF EXISTS "Orders: staff update" ON public.orders;
DROP POLICY IF EXISTS "Orders: patient insert own" ON public.orders;
DROP POLICY IF EXISTS "Orders: brand admin insert scoped" ON public.orders;
DROP POLICY IF EXISTS "Orders: super admin insert" ON public.orders;
DROP POLICY IF EXISTS "Orders: clinical staff update" ON public.orders;
DROP POLICY IF EXISTS "Orders: brand admin update scoped" ON public.orders;

-- SELECT
CREATE POLICY "Orders: patient view own" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Orders: brand admin view" ON public.orders
  FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'brand_admin'
    AND coalesce(sub_brand, '') = coalesce(nullif(public.get_auth_brand(), ''), '')
  );

CREATE POLICY "Orders: global staff view" ON public.orders
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IN ('doctor', 'pharmacy', 'super_admin'));

-- INSERT
CREATE POLICY "Orders: patient insert own" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Orders: brand admin insert scoped" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_auth_role() = 'brand_admin'
    AND coalesce(sub_brand, '') = coalesce(nullif(public.get_auth_brand(), ''), '')
  );

CREATE POLICY "Orders: super admin insert" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (public.get_auth_role() = 'super_admin');

-- UPDATE
CREATE POLICY "Orders: clinical staff update" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.get_auth_role() IN ('doctor', 'pharmacy', 'super_admin'));

CREATE POLICY "Orders: brand admin update scoped" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    public.get_auth_role() = 'brand_admin'
    AND coalesce(sub_brand, '') = coalesce(nullif(public.get_auth_brand(), ''), '')
  );

-- -----------------------------------------------------------------------------
-- 4) Products — catalog readable without login; writes stay staff-only (app UI)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  ) THEN
    EXECUTE 'ALTER TABLE public.products ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "MVP Public Product Select" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "Products public read active" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "Products staff select all" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "Products staff insert" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "Products staff update" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "Products staff delete" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "Products staff write" ON public.products';

    EXECUTE $p$
      CREATE POLICY "Products public read active" ON public.products
      FOR SELECT TO anon, authenticated
      USING (coalesce(active, true) = true)
    $p$;

    EXECUTE $p$
      CREATE POLICY "Products staff select all" ON public.products
      FOR SELECT TO authenticated
      USING (public.get_auth_role() IN ('brand_admin', 'super_admin'))
    $p$;

    EXECUTE $p$
      CREATE POLICY "Products staff insert" ON public.products
      FOR INSERT TO authenticated
      WITH CHECK (public.get_auth_role() IN ('brand_admin', 'super_admin'))
    $p$;

    EXECUTE $p$
      CREATE POLICY "Products staff update" ON public.products
      FOR UPDATE TO authenticated
      USING (public.get_auth_role() IN ('brand_admin', 'super_admin'))
    $p$;

    EXECUTE $p$
      CREATE POLICY "Products staff delete" ON public.products
      FOR DELETE TO authenticated
      USING (public.get_auth_role() = 'super_admin')
    $p$;
  END IF;
END$$;

-- -----------------------------------------------------------------------------
-- 5) Affiliates — super-admin directory (optional table from supabase_affiliate_system.sql)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'affiliates'
  ) THEN
    EXECUTE 'ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Affiliates view own profile" ON public.affiliates';
    EXECUTE 'DROP POLICY IF EXISTS "Affiliates: affiliate self" ON public.affiliates';
    EXECUTE 'DROP POLICY IF EXISTS "Affiliates: super admin select" ON public.affiliates';

    EXECUTE $p$
      CREATE POLICY "Affiliates: affiliate self" ON public.affiliates
      FOR SELECT TO authenticated
      USING (id = auth.uid())
    $p$;

    EXECUTE $p$
      CREATE POLICY "Affiliates: super admin select" ON public.affiliates
      FOR SELECT TO authenticated
      USING (public.get_auth_role() = 'super_admin')
    $p$;
  END IF;
END$$;
