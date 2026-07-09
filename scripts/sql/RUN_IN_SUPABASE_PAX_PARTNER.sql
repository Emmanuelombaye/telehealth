-- =============================================================================
-- Pax Longevity — Partner API tenant (run once in Supabase SQL Editor)
-- =============================================================================
-- Or use: npm run auth:provision-pax  (service role, no SQL Editor)
--
-- Care portals (Peak-hosted until partner DNS is live):
--   https://www.peak-health.io/care/pax/shop
--   https://www.peak-health.io/care/pax/login
--   https://www.peak-health.io/care/pax/admin/login
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

INSERT INTO public.brands (
  id, name, slug, domain, portal_origin, logo_url, status, plan, since_date,
  compliance, gateways, languages, settings
)
VALUES (
  'b7e8f9a0-1c2d-4e3f-9a5b-6c7d8e9f0a1b',
  'Pax Longevity',
  'pax',
  'pax-longevity.com',
  'https://www.peak-health.io',
  'https://www.pax-longevity.com/images/pax-logo.webp',
  'active',
  'Enterprise',
  to_char(now(), 'Mon YYYY'),
  '{"hipaa": true, "gdpr": true, "soc2": false}'::jsonb,
  '["Stripe"]'::jsonb,
  '["English"]'::jsonb,
  '{"marketing_url":"https://www.pax-longevity.com","tagline":"Prevent decline years before symptoms.","theme":{"primary":"#A0594E","accent":"#C17D74","headerBg":"#FAF6F0"}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  domain = EXCLUDED.domain,
  portal_origin = EXCLUDED.portal_origin,
  logo_url = EXCLUDED.logo_url,
  status = EXCLUDED.status,
  settings = EXCLUDED.settings,
  updated_at = now();

INSERT INTO public.brand_hostnames (brand_id, hostname, host_kind, is_primary)
SELECT b.id, v.hostname, v.host_kind, v.is_primary
FROM public.brands b
CROSS JOIN (VALUES
  ('pax-longevity.com', 'marketing', true),
  ('www.pax-longevity.com', 'marketing', false),
  ('portal.pax-longevity.com', 'care', true),
  ('care.pax-longevity.com', 'care', false),
  ('admin.pax-longevity.com', 'admin', true),
  ('affiliate.pax-longevity.com', 'affiliate', true)
) AS v(hostname, host_kind, is_primary)
WHERE b.slug = 'pax'
ON CONFLICT (hostname) DO UPDATE SET
  brand_id = EXCLUDED.brand_id,
  host_kind = EXCLUDED.host_kind,
  is_primary = EXCLUDED.is_primary;

-- Issue Partner API key (save plaintext from NOTICE)
DO $$
DECLARE
  v_brand_id UUID;
  v_key TEXT;
  v_prefix TEXT;
  v_hash TEXT;
BEGIN
  SELECT id INTO v_brand_id FROM public.brands WHERE slug = 'pax' LIMIT 1;
  v_key := 'pk_live_px_' || encode(gen_random_bytes(24), 'hex');
  v_prefix := left(v_key, 12);
  v_hash := encode(digest(v_key, 'sha256'), 'hex');

  INSERT INTO public.partner_api_keys (brand_id, label, key_prefix, key_hash, status)
  VALUES (v_brand_id, 'default', v_prefix, v_hash, 'active')
  ON CONFLICT (brand_id, label) DO UPDATE SET
    key_prefix = EXCLUDED.key_prefix,
    key_hash = EXCLUDED.key_hash,
    status = 'active';

  RAISE NOTICE 'PAX_PARTNER_API_KEY=%', v_key;
END $$;

COMMIT;
