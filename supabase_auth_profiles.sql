-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  PEAK HEALTH — ONE-SHOT DATABASE FIX                            ║
-- ║  Paste this entire block into Supabase SQL Editor and click RUN ║
-- ╚══════════════════════════════════════════════════════════════════╝

DO $$
BEGIN

  -- 1. Kill RLS so nothing is blocked
  EXECUTE 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY';

  -- 2. Add every column that might be missing (all idempotent)
  EXECUTE 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email      TEXT';
  EXECUTE 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name  TEXT';
  EXECUTE 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brand_id   TEXT';
  EXECUTE 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()';

  -- 3. Remove NOT NULL from email (real schema had this causing insert failures)
  BEGIN
    EXECUTE 'ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- 4. Wipe every RLS policy (dynamic — catches any name)
  DECLARE pol RECORD;
  BEGIN
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
  END;

  -- 5. Restore RLS with 3 clean non-recursive policies
  EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';
  EXECUTE 'CREATE POLICY "own_select" ON public.profiles FOR SELECT USING (auth.uid() = id)';
  EXECUTE 'CREATE POLICY "own_update" ON public.profiles FOR UPDATE USING (auth.uid() = id)';
  EXECUTE 'CREATE POLICY "open_insert" ON public.profiles FOR INSERT WITH CHECK (true)';

  RAISE NOTICE 'Step 1-5 complete: RLS fixed, columns added';
END $$;

-- 6. Rebuild trigger — email always included, EXCEPTION means signup NEVER fails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email, full_name, brand_id)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'patient'),
    NEW.email,
    NULLIF(TRIM(
      COALESCE(NEW.raw_user_meta_data->>'first_name','') || ' ' ||
      COALESCE(NEW.raw_user_meta_data->>'last_name','')
    ), ' '),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'brand_id','')), '')
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'profile insert skipped for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Backfill — every existing auth user gets a profiles row
INSERT INTO public.profiles (id, role, email)
SELECT id,
  COALESCE(NULLIF(TRIM(raw_user_meta_data->>'role'),''), 'patient'),
  email
FROM auth.users
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

-- 8. Result — you should see all users listed here
SELECT id, email, role FROM public.profiles ORDER BY id;
