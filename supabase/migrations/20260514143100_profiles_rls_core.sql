-- =============================================================================
-- Peak Health — profiles RLS (depends on get_auth_role in prior migration)
-- Apply after: 20260514143000_production_core_rbac.sql
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Profiles: view own" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Profiles: staff view all" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Profiles: insert self" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Profiles: update own" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "own_select" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "own_update" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "open_insert" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.profiles';

    EXECUTE $p$
      CREATE POLICY "Profiles: view own" ON public.profiles
      FOR SELECT TO authenticated
      USING (auth.uid() = id)
    $p$;

    EXECUTE $p$
      CREATE POLICY "Profiles: staff view all" ON public.profiles
      FOR SELECT TO authenticated
      USING (
        public.get_auth_role() IN ('doctor', 'pharmacy', 'brand_admin', 'super_admin')
      )
    $p$;

    EXECUTE $p$
      CREATE POLICY "Profiles: insert self" ON public.profiles
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = id)
    $p$;

    EXECUTE $p$
      CREATE POLICY "Profiles: update own" ON public.profiles
      FOR UPDATE TO authenticated
      USING (auth.uid() = id)
    $p$;
  END IF;
END$$;
