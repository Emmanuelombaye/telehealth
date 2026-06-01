-- North Star MD partner brand (run in Supabase SQL Editor if PART 13 was skipped)
INSERT INTO public.brands (
  id, name, slug, domain, country, timezone, status, plan, since_date
) VALUES (
  'c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c'::uuid,
  'North Star MD',
  'north-star-md',
  'northstarmd.com',
  'United States',
  'America/New_York',
  'active',
  'Enterprise',
  to_char(now(), 'Mon YYYY')
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  status = 'active';
