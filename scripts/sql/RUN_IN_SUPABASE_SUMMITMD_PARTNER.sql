-- =============================================================================
-- Summit MD — Partner API tenant (run once in Supabase SQL Editor)
-- =============================================================================
-- Fixes slug `s` → `summit-md`, hostnames, and issues a Partner API key.
-- Copy the revealed api_key into partner server env (never commit it).
--
-- After this:
--   Swagger: {SUPABASE_URL}/functions/v1/partner-api?action=docs_ui
--   Connect: GET ?action=connect&brand_slug=summit-md  (X-Partner-Api-Key)
--   Enroll:  POST enrollment_start with brand_slug=summit-md
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- partner_api_keys (skip if already ran RUN_IN_SUPABASE_MULTI_TENANT_PLATFORM.sql)
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

ALTER TABLE public.partner_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role partner keys" ON public.partner_api_keys;
CREATE POLICY "Service role partner keys"
ON public.partner_api_keys FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Super admin manage partner keys" ON public.partner_api_keys;
CREATE POLICY "Super admin manage partner keys"
ON public.partner_api_keys FOR ALL
USING (public.get_auth_role() = 'super_admin')
WITH CHECK (public.get_auth_role() = 'super_admin');

-- 1. Fix existing summitMD row (slug was mistakenly `s`)
UPDATE public.brands
SET
  name = 'Summit MD',
  slug = 'summit-md',
  domain = COALESCE(NULLIF(trim(domain), ''), 'summitmd.vercel.app'),
  portal_origin = COALESCE(
    NULLIF(trim(portal_origin), ''),
    'https://www.peak-health.io'
  ),
  status = 'active',
  updated_at = now()
WHERE slug IN ('s', 'summit-md')
   OR lower(name) IN ('summitmd', 'summit md');

-- Insert if missing (fresh env)
INSERT INTO public.brands (name, slug, domain, portal_origin, status, plan, since_date, compliance, gateways, languages)
SELECT
  'Summit MD',
  'summit-md',
  'summitmd.vercel.app',
  'https://www.peak-health.io',
  'active',
  'Enterprise',
  to_char(now(), 'Mon YYYY'),
  '{"hipaa": true, "gdpr": true, "soc2": false}'::jsonb,
  '["Stripe"]'::jsonb,
  '["English"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.brands WHERE slug = 'summit-md');

-- 2. Hostnames (Peak-hosted care paths until partner DNS is live)
INSERT INTO public.brand_hostnames (brand_id, hostname, host_kind, is_primary)
SELECT b.id, v.hostname, v.host_kind, v.is_primary
FROM public.brands b
CROSS JOIN (VALUES
  ('summitmd.vercel.app', 'marketing', true),
  ('summitmd.com', 'marketing', false),
  ('www.summitmd.com', 'marketing', false),
  ('care.summitmd.com', 'care', true),
  ('admin.summitmd.com', 'admin', true),
  ('affiliate.summitmd.com', 'affiliate', true)
) AS v(hostname, host_kind, is_primary)
WHERE b.slug = 'summit-md'
ON CONFLICT (hostname) DO UPDATE SET
  brand_id = EXCLUDED.brand_id,
  host_kind = EXCLUDED.host_kind,
  is_primary = EXCLUDED.is_primary;

-- 3. Partner API key (shown once below)
DO $$
DECLARE
  v_brand_id UUID;
  demo_key TEXT := 'pk_live_sm_' || encode(gen_random_bytes(24), 'hex');
  demo_prefix TEXT := left(demo_key, 12);
  demo_hash TEXT := encode(digest(demo_key, 'sha256'), 'hex');
BEGIN
  SELECT id INTO v_brand_id FROM public.brands WHERE slug = 'summit-md' LIMIT 1;
  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'summit-md brand row missing';
  END IF;

  INSERT INTO public.partner_api_keys (brand_id, label, key_prefix, key_hash, status)
  VALUES (v_brand_id, 'default', demo_prefix, demo_hash, 'active')
  ON CONFLICT (brand_id, label) DO UPDATE SET
    key_prefix = EXCLUDED.key_prefix,
    key_hash = EXCLUDED.key_hash,
    status = 'active';

  CREATE TEMP TABLE IF NOT EXISTS _summit_key_reveal (brand_slug TEXT, api_key TEXT);
  DELETE FROM _summit_key_reveal;
  INSERT INTO _summit_key_reveal VALUES ('summit-md', demo_key);
END $$;

COMMIT;

SELECT 'summit-md brand' AS check_name, id, slug, name, domain, portal_origin, status
FROM public.brands WHERE slug = 'summit-md';

SELECT 'summit-md hostnames' AS check_name, h.hostname, h.host_kind, h.is_primary
FROM public.brand_hostnames h
JOIN public.brands b ON b.id = h.brand_id
WHERE b.slug = 'summit-md'
ORDER BY h.host_kind, h.hostname;

SELECT
  'COPY THIS KEY (server env only)' AS check_name,
  brand_slug,
  api_key AS summitmd_partner_api_key,
  'Set PARTNER_API_KEY and PARTNER_BRAND_SLUG=summit-md on partner backend' AS hint
FROM _summit_key_reveal;
