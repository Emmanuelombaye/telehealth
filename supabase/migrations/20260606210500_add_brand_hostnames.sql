CREATE TABLE IF NOT EXISTS public.brand_hostnames (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  hostname text NOT NULL UNIQUE,
  host_kind text DEFAULT 'marketing',
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.brand_hostnames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_hostnames are viewable by everyone" ON public.brand_hostnames FOR SELECT USING (true);

INSERT INTO public.brand_hostnames (id, brand_id, hostname, host_kind, is_primary, created_at) VALUES 
('c5d4d1e3-9309-438c-ba59-33439e8f6669', 'a2d55ab2-3b84-4fca-81d3-eeabbc5a6901', 'care.peak-health.io', 'care', true, '2026-06-03T19:10:37.981228+00:00'),
('8c607423-0d46-4923-873d-f3c08a17b6f0', 'c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c', 'peak-health.io', 'marketing', true, '2026-06-03T19:10:37.981228+00:00'),
('6c5d6045-7e9c-48a1-9ffc-70603d057cfb', 'c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c', 'www.peak-health.io', 'marketing', false, '2026-06-03T19:10:37.981228+00:00'),
('7a4fa5e3-94c5-4054-a980-7a8817b279b1', 'c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c', 'peakhealth.io', 'marketing', false, '2026-06-03T19:10:37.981228+00:00'),
('bbaa1c8e-97d3-41f9-ac8b-65fda44333ea', 'c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c', 'www.peakhealth.io', 'marketing', false, '2026-06-03T19:10:37.981228+00:00'),
('94530435-5d36-4a75-8ab0-65bc001240b6', 'c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c', 'northstarmd.com', 'marketing', true, '2026-06-03T19:10:37.981228+00:00'),
('81809c14-44e0-4b5c-8fbd-99517b6c3da5', 'c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c', 'www.northstarmd.com', 'marketing', false, '2026-06-03T19:10:37.981228+00:00'),
('a3389659-deb2-4f92-a947-48d300c3014a', 'c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c', 'joinnorthstarmd.com', 'marketing', false, '2026-06-03T19:10:37.981228+00:00'),
('a7e6244e-6bb8-4174-a59f-819dcd79cc55', 'c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c', 'www.joinnorthstarmd.com', 'marketing', false, '2026-06-03T19:10:37.981228+00:00'),
('aa42faff-d258-4928-937d-4eb8b9a23bee', 'c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c', 'northstarmed.vercel.app', 'marketing', false, '2026-06-03T19:10:37.981228+00:00'),
('b1dd3fa4-6718-49c3-89e8-4308ef5a9f67', 'c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c', 'www.northstarmed.vercel.app', 'marketing', false, '2026-06-03T19:10:37.981228+00:00'),
('54e9caf7-1c7d-40ba-82b2-baff0eb69492', 'c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c', 'care.northstarmd.com', 'care', true, '2026-06-03T19:10:37.981228+00:00'),
('e173b149-bd57-474f-a36e-f5c4d79a2dde', 'c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c', 'care.northstarmed.vercel.app', 'care', false, '2026-06-03T19:10:37.981228+00:00'),
('3a92c625-40c9-424f-ada0-c2dd7ec04109', 'c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c', 'care.joinnorthstarmd.com', 'care', false, '2026-06-03T19:10:37.981228+00:00'),
('e9be0f12-3fd4-457e-9b1b-0fb3a4c5316d', 'c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c', 'admin.northstarmd.com', 'admin', true, '2026-06-03T19:10:37.981228+00:00'),
('193b7b84-6988-4be1-95f0-0e0a477aba56', 'c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c', 'affiliate.northstarmd.com', 'affiliate', true, '2026-06-03T19:10:37.981228+00:00')
ON CONFLICT (hostname) DO NOTHING;
