-- Normalize legacy JWT brand_id values ("peak", "peak-health") to Peak platform UUID
-- so brand_admin RLS matches orders.sub_brand.

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

GRANT EXECUTE ON FUNCTION public.get_auth_brand() TO anon, authenticated, service_role;
