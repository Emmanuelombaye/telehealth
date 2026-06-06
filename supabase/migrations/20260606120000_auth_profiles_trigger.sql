-- Peak Health — auto-create profiles row on auth.users INSERT (safe / idempotent)
-- Fixes signup 500s when handle_new_user was missing or threw uncaught errors.

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

-- Backfill any auth users missing a profiles row
INSERT INTO public.profiles (id, role, email, full_name, brand_id)
SELECT
  u.id,
  COALESCE(NULLIF(trim(u.raw_user_meta_data->>'role'), ''), 'patient'),
  u.email,
  NULLIF(trim(
    COALESCE(u.raw_user_meta_data->>'first_name', '') || ' ' ||
    COALESCE(u.raw_user_meta_data->>'last_name', '')
  ), ''),
  NULLIF(trim(COALESCE(u.raw_user_meta_data->>'brand_id', '')), '')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;
