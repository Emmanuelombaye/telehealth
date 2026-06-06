-- =============================================================================
-- MULTI-TENANT PLATFORM — run once in Supabase SQL Editor (project kvopgyhcjcniaocjozje)
--   • Peak Health + North Star MD brand rows (stable UUIDs)
--   • brand_hostnames — care.brand.com, marketing domains, admin/affiliate subdomains
--   • partner_api_keys — per-brand API keys (service role only; hash stored)
--   • Public read of active brands + hostnames (anonymous enrollment + hostname resolve)
--   • Helper view brand_portal_config for Partner API + Super Admin
--
-- AFTER THIS SQL:
--   1. Supabase → Edge Functions → deploy partner-api (JWT OFF)
--   2. Set secrets: PARTNER_API_KEYS = {"north-star-md":"<key from verification query below>"}
--   3. Vercel: add care.northstarmd.com (+ admin/affiliate subdomains) → peak-health.io
--   4. npm run check:partner-api
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Extend brands table
-- -----------------------------------------------------------------------------
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS portal_origin TEXT,
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.brands.portal_origin IS
  'Canonical branded app origin, e.g. https://care.northstarmd.com or https://joinnorthstarmd.com';
COMMENT ON COLUMN public.brands.settings IS
  'White-label kit overrides: theme, copy, feature flags (optional — static frontend kit can override)';

-- -----------------------------------------------------------------------------
-- 2. brand_hostnames — map hostname → tenant + portal kind
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brand_hostnames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL,
  host_kind TEXT NOT NULL DEFAULT 'marketing'
    CHECK (host_kind IN ('marketing', 'care', 'admin', 'affiliate', 'api')),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT brand_hostnames_hostname_unique UNIQUE (hostname)
);

CREATE INDEX IF NOT EXISTS brand_hostnames_brand_id_idx ON public.brand_hostnames(brand_id);
CREATE INDEX IF NOT EXISTS brand_hostnames_kind_idx ON public.brand_hostnames(host_kind);

-- -----------------------------------------------------------------------------
-- 3. partner_api_keys — private Partner API credentials (never expose to browser)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.partner_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'default',
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT partner_api_keys_brand_label_unique UNIQUE (brand_id, label)
);

CREATE INDEX IF NOT EXISTS partner_api_keys_brand_id_idx ON public.partner_api_keys(brand_id);
CREATE INDEX IF NOT EXISTS partner_api_keys_prefix_idx ON public.partner_api_keys(key_prefix);

-- -----------------------------------------------------------------------------
-- 4. RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.brand_hostnames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_api_keys ENABLE ROW LEVEL SECURITY;

-- Active brands: public read (anonymous shop/enrollment hostname resolve)
DROP POLICY IF EXISTS "Public read active brands" ON public.brands;
CREATE POLICY "Public read active brands"
ON public.brands FOR SELECT
TO anon, authenticated
USING (status = 'active');

-- Hostnames: public read (care.brand.com routing)
DROP POLICY IF EXISTS "Public read brand hostnames" ON public.brand_hostnames;
CREATE POLICY "Public read brand hostnames"
ON public.brand_hostnames FOR SELECT
TO anon, authenticated
USING (true);

-- Partner keys: service role only (no client policies)
DROP POLICY IF EXISTS "Service role partner keys" ON public.partner_api_keys;
-- Intentionally no SELECT for anon/authenticated — Edge Functions use service role.

DROP POLICY IF EXISTS "Super admin manage partner keys" ON public.partner_api_keys;
CREATE POLICY "Super admin manage partner keys"
ON public.partner_api_keys FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
);

DROP POLICY IF EXISTS "Super admin manage brand hostnames" ON public.brand_hostnames;
CREATE POLICY "Super admin manage brand hostnames"
ON public.brand_hostnames FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
);

-- -----------------------------------------------------------------------------
-- 5. Seed tenants (stable UUIDs — keep in sync with src/lib/brands/*.ts)
-- -----------------------------------------------------------------------------
INSERT INTO public.brands (
  id, name, slug, domain, country, timezone, status, plan, since_date,
  logo_url, portal_origin, settings
) VALUES (
  'a009d8db-c770-4287-a15e-cc82515437ef'::uuid,
  'Peak Health',
  'peak-health',
  'peak-health.io',
  'United States',
  'America/New_York',
  'active',
  'Enterprise',
  to_char(now(), 'Mon YYYY'),
  '/PeakHealthLogo.png',
  'https://www.peak-health.io',
  '{"platform_owner": true}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  status = 'active',
  logo_url = COALESCE(public.brands.logo_url, EXCLUDED.logo_url),
  portal_origin = COALESCE(public.brands.portal_origin, EXCLUDED.portal_origin);

INSERT INTO public.brands (
  id, name, slug, domain, country, timezone, status, plan, since_date,
  logo_url, portal_origin, settings
) VALUES (
  'c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c'::uuid,
  'North Star MD',
  'north-star-md',
  'northstarmd.com',
  'United States',
  'America/New_York',
  'active',
  'Enterprise',
  to_char(now(), 'Mon YYYY'),
  '/brands/north-star-md-logo.svg',
  'https://joinnorthstarmd.com',
  jsonb_build_object(
    'tagline', 'Guided by science. Designed for you.',
    'support_email', 'support@northstarmd.com',
    'theme', jsonb_build_object(
      'primary', '#0f2341',
      'primaryForeground', '#ffffff',
      'accent', '#c4a35a',
      'headerBg', '#f8f9fa'
    )
  )
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  status = 'active',
  logo_url = COALESCE(public.brands.logo_url, EXCLUDED.logo_url),
  portal_origin = COALESCE(public.brands.portal_origin, EXCLUDED.portal_origin),
  settings = public.brands.settings || EXCLUDED.settings;

-- -----------------------------------------------------------------------------
-- 6. Hostnames — marketing, care portal, staff subdomains
-- -----------------------------------------------------------------------------
INSERT INTO public.brand_hostnames (brand_id, hostname, host_kind, is_primary)
SELECT b.id, v.hostname, v.host_kind, v.is_primary
FROM public.brands b
CROSS JOIN (
  VALUES
    -- Peak Health (platform owner — staff on peak-health.io subdomains)
    ('peak-health.io', 'marketing', true),
    ('www.peak-health.io', 'marketing', false),
    ('peakhealth.io', 'marketing', false),
    ('www.peakhealth.io', 'marketing', false),
    -- North Star marketing
    ('northstarmd.com', 'marketing', true),
    ('www.northstarmd.com', 'marketing', false),
    ('joinnorthstarmd.com', 'marketing', false),
    ('www.joinnorthstarmd.com', 'marketing', false),
    ('northstarmed.vercel.app', 'marketing', false),
    ('www.northstarmed.vercel.app', 'marketing', false),
    -- North Star care portal (dedicated subdomain → Peak app with path rewrite)
    ('care.northstarmd.com', 'care', true),
    ('care.northstarmed.vercel.app', 'care', false),
    ('care.joinnorthstarmd.com', 'care', false),
    -- Branded staff portals on partner domain
    ('admin.northstarmd.com', 'admin', true),
    ('affiliate.northstarmd.com', 'affiliate', true)
) AS v(hostname, host_kind, is_primary)
WHERE b.slug = 'north-star-md'
ON CONFLICT (hostname) DO UPDATE SET
  brand_id = EXCLUDED.brand_id,
  host_kind = EXCLUDED.host_kind,
  is_primary = EXCLUDED.is_primary;

-- Peak care hostname (optional — same as apex for Peak-native experience)
INSERT INTO public.brand_hostnames (brand_id, hostname, host_kind, is_primary)
SELECT id, 'care.peak-health.io', 'care', true
FROM public.brands WHERE slug = 'peak-health'
ON CONFLICT (hostname) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. Partner API key for North Star (demo — rotate in production)
--    Full key shown ONCE in verification query at bottom of this script.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  ns_brand_id UUID;
  demo_key TEXT := 'pk_live_ns_' || encode(gen_random_bytes(24), 'hex');
  demo_prefix TEXT := left(demo_key, 12);
  demo_hash TEXT := encode(digest(demo_key, 'sha256'), 'hex');
BEGIN
  SELECT id INTO ns_brand_id FROM public.brands WHERE slug = 'north-star-md' LIMIT 1;
  IF ns_brand_id IS NULL THEN
    RAISE NOTICE 'North Star brand row missing — skip partner key seed';
    RETURN;
  END IF;

  INSERT INTO public.partner_api_keys (brand_id, label, key_prefix, key_hash, status)
  VALUES (ns_brand_id, 'default', demo_prefix, demo_hash, 'active')
  ON CONFLICT (brand_id, label) DO UPDATE SET
    key_prefix = EXCLUDED.key_prefix,
    key_hash = EXCLUDED.key_hash,
    status = 'active';

  -- Store plaintext once in a temp table for the verification SELECT below
  CREATE TEMP TABLE IF NOT EXISTS _partner_key_reveal (brand_slug TEXT, api_key TEXT);
  DELETE FROM _partner_key_reveal;
  INSERT INTO _partner_key_reveal VALUES ('north-star-md', demo_key);
END $$;

-- -----------------------------------------------------------------------------
-- 8. Helper view — portal config for Super Admin + Partner API
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.brand_portal_config AS
SELECT
  b.id AS brand_id,
  b.slug,
  b.name,
  b.domain,
  b.status,
  b.logo_url,
  b.portal_origin,
  b.settings,
  (SELECT h.hostname FROM public.brand_hostnames h
   WHERE h.brand_id = b.id AND h.host_kind = 'care' AND h.is_primary
   ORDER BY h.created_at LIMIT 1) AS care_hostname,
  (SELECT h.hostname FROM public.brand_hostnames h
   WHERE h.brand_id = b.id AND h.host_kind = 'admin' AND h.is_primary
   ORDER BY h.created_at LIMIT 1) AS admin_hostname,
  (SELECT h.hostname FROM public.brand_hostnames h
   WHERE h.brand_id = b.id AND h.host_kind = 'affiliate' AND h.is_primary
   ORDER BY h.created_at LIMIT 1) AS affiliate_hostname
FROM public.brands b
WHERE b.status = 'active';

GRANT SELECT ON public.brand_portal_config TO anon, authenticated;

COMMIT;

-- =============================================================================
-- VERIFICATION — review output before closing SQL Editor
-- =============================================================================
SELECT 'brands' AS check_name, slug, name, status, portal_origin
FROM public.brands
WHERE slug IN ('peak-health', 'north-star-md')
ORDER BY slug;

SELECT 'brand_hostnames' AS check_name, b.slug, h.hostname, h.host_kind, h.is_primary
FROM public.brand_hostnames h
JOIN public.brands b ON b.id = h.brand_id
WHERE b.slug = 'north-star-md'
ORDER BY h.host_kind, h.hostname;

SELECT 'brand_portal_config' AS check_name, slug, care_hostname, admin_hostname, affiliate_hostname, portal_origin
FROM public.brand_portal_config
WHERE slug IN ('peak-health', 'north-star-md');

SELECT
  'partner_api_key_reveal' AS check_name,
  brand_slug,
  api_key AS north_star_partner_api_key,
  'Set Edge secret PARTNER_API_KEYS = {"north-star-md":"' || api_key || '"}' AS supabase_secret_hint
FROM _partner_key_reveal;

SELECT 'MULTI-TENANT PLATFORM SQL complete' AS status;
