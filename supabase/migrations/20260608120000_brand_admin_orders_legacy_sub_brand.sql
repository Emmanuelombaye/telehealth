-- Brand admin RLS: match legacy sub_brand "Peak Health" to Peak platform UUID in JWT.

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
        AND auth.bid = peak.pid
        AND coalesce(p_sub_brand, '') IN ('Peak Health', 'peak', 'peak-health', peak.pid)
      )
      OR (
        peak.pid IS NOT NULL
        AND lower(coalesce(auth.bid, '')) IN ('peak', 'peak-health')
        AND coalesce(p_sub_brand, '') IN ('Peak Health', 'peak', 'peak-health', peak.pid)
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
