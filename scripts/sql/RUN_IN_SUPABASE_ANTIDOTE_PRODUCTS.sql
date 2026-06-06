-- Antidote Health partner product records (safe seed)
-- Purpose:
-- 1) Keep Antidote product definitions in Peak database for partner mapping/reference
-- 2) Avoid impacting public Shop until explicitly activated
--
-- Notes:
-- - Rows are inserted with active = false to avoid unintended catalog exposure.
-- - features.partner_catalog stores partner metadata for mapping workflows.

BEGIN;

INSERT INTO public.products (
  name,
  category,
  tagline,
  description,
  price_usd,
  image_url,
  features,
  popular,
  active
)
SELECT * FROM (
  VALUES
    (
      'Antidote · Compounded Semaglutide Program',
      'Weight Loss',
      'Partner catalog record',
      'Antidote storefront product. Use for Partner API product_id mapping.',
      146,
      '/partners/antidote/semaglutide.png',
      jsonb_build_object(
        'partner_catalog',
        jsonb_build_object(
          'brand_slug', 'antidote-health',
          'partner_product_id', 'weightloss_semaglutide',
          'source', 'antidotehealth'
        )
      ),
      false,
      false
    ),
    (
      'Antidote · Compounded Tirzepatide Program',
      'Weight Loss',
      'Partner catalog record',
      'Antidote storefront product. Use for Partner API product_id mapping.',
      192,
      '/partners/antidote/tirzepatide.png',
      jsonb_build_object(
        'partner_catalog',
        jsonb_build_object(
          'brand_slug', 'antidote-health',
          'partner_product_id', 'weightloss_tirzepatide',
          'source', 'antidotehealth'
        )
      ),
      false,
      false
    ),
    (
      'Antidote · SummitMd Foundational Powder',
      'Nutrition',
      'Partner catalog record',
      'Antidote storefront product. Use for Partner API product_id mapping.',
      89,
      '/partners/antidote/foundational-powder.png',
      jsonb_build_object(
        'partner_catalog',
        jsonb_build_object(
          'brand_slug', 'antidote-health',
          'partner_product_id', 'travel',
          'source', 'antidotehealth'
        )
      ),
      false,
      false
    ),
    (
      'Antidote · AGZ Sleep Support',
      'Sleep',
      'Partner catalog record',
      'Antidote storefront product. Use for Partner API product_id mapping.',
      38,
      '/partners/antidote/sleep-support.png',
      jsonb_build_object(
        'partner_catalog',
        jsonb_build_object(
          'brand_slug', 'antidote-health',
          'partner_product_id', 'sleep',
          'source', 'antidotehealth'
        )
      ),
      false,
      false
    )
) AS v(name, category, tagline, description, price_usd, image_url, features, popular, active)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.products p
  WHERE p.name = v.name
);

COMMIT;

-- Verify
SELECT id, name, category, price_usd, active, features->'partner_catalog' AS partner_catalog
FROM public.products
WHERE name LIKE 'Antidote · %'
ORDER BY created_at DESC;
