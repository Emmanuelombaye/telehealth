-- Brands Schema & Seed Data

-- 1. Create Brands Table
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    domain TEXT,
    country TEXT,
    timezone TEXT,
    status TEXT DEFAULT 'active',
    plan TEXT DEFAULT 'Starter',
    since_date TEXT,
    patients_count INTEGER DEFAULT 0,
    doctors_count INTEGER DEFAULT 0,
    staff_count INTEGER DEFAULT 0,
    mrr NUMERIC DEFAULT 0,
    growth NUMERIC DEFAULT 0,
    products JSONB DEFAULT '[]'::jsonb,
    gateways JSONB DEFAULT '[]'::jsonb,
    languages JSONB DEFAULT '[]'::jsonb,
    revenue_data JSONB DEFAULT '[]'::jsonb,
    orders_data JSONB DEFAULT '{"total":0,"pending":0,"shipped":0,"completed":0}'::jsonb,
    compliance JSONB DEFAULT '{"hipaa":false,"gdpr":false,"soc2":false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Enable Row Level Security
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Everyone can read brands for now, or just authenticated users
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.brands;
CREATE POLICY "Enable read access for authenticated users" 
ON public.brands FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Enable insert for super_admin" ON public.brands;
CREATE POLICY "Enable insert for super_admin" 
ON public.brands FOR INSERT 
TO authenticated 
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
);

DROP POLICY IF EXISTS "Enable update for super_admin" ON public.brands;
CREATE POLICY "Enable update for super_admin" 
ON public.brands FOR UPDATE
TO authenticated 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
);

-- 4. Seed Data
INSERT INTO public.brands (
  name, slug, domain, country, timezone, status, plan, since_date, 
  patients_count, doctors_count, staff_count, mrr, growth,
  products, gateways, languages, revenue_data, orders_data, compliance
) VALUES 
(
  'Brand A', 'brand-a', 'branda.health', '🇺🇸 United States', 'America/New_York', 'active', 'Enterprise', 'Jan 2025',
  18420, 142, 38, 128400, 24,
  '["Weight Loss", "ED Treatment", "Hair Loss", "Anxiety & Sleep"]'::jsonb,
  '["Stripe", "PayPal", "Apple Pay"]'::jsonb,
  '["English", "Spanish"]'::jsonb,
  '[{"month": "Nov", "v": 88000}, {"month": "Dec", "v": 95000}, {"month": "Jan", "v": 102000}, {"month": "Feb", "v": 110000}, {"month": "Mar", "v": 118000}, {"month": "Apr", "v": 124000}, {"month": "May", "v": 128400}]'::jsonb,
  '{"total": 4820, "pending": 34, "shipped": 210, "completed": 4576}'::jsonb,
  '{"hipaa": true, "gdpr": true, "soc2": true}'::jsonb
),
(
  'Brand B', 'brand-b', 'brandb.care', '🇬🇧 United Kingdom', 'Europe/London', 'active', 'Growth', 'Mar 2025',
  11230, 98, 24, 94200, 18,
  '["Weight Loss", "Mental Health", "Dermatology"]'::jsonb,
  '["Stripe", "PayPal", "SEPA"]'::jsonb,
  '["English", "French"]'::jsonb,
  '[{"month": "Nov", "v": 62000}, {"month": "Dec", "v": 68000}, {"month": "Jan", "v": 74000}, {"month": "Feb", "v": 80000}, {"month": "Mar", "v": 86000}, {"month": "Apr", "v": 91000}, {"month": "May", "v": 94200}]'::jsonb,
  '{"total": 2940, "pending": 18, "shipped": 142, "completed": 2780}'::jsonb,
  '{"hipaa": false, "gdpr": true, "soc2": true}'::jsonb
),
(
  'Brand C', 'brand-c', 'brandc.med', '🇦🇪 UAE', 'Asia/Dubai', 'active', 'Growth', 'Jun 2025',
  7840, 61, 15, 61000, 9,
  '["General Consult", "Weight Loss"]'::jsonb,
  '["Stripe", "Apple Pay"]'::jsonb,
  '["English", "Arabic"]'::jsonb,
  '[{"month": "Nov", "v": 42000}, {"month": "Dec", "v": 46000}, {"month": "Jan", "v": 50000}, {"month": "Feb", "v": 54000}, {"month": "Mar", "v": 57000}, {"month": "Apr", "v": 59000}, {"month": "May", "v": 61000}]'::jsonb,
  '{"total": 1820, "pending": 12, "shipped": 88, "completed": 1720}'::jsonb,
  '{"hipaa": false, "gdpr": true, "soc2": false}'::jsonb
),
(
  'Brand D', 'brand-d', 'brandd.clinic', '🇧🇷 Brazil', 'America/Sao_Paulo', 'trial', 'Starter', 'Apr 2026',
  3210, 28, 8, 35000, 5,
  '["General Consult"]'::jsonb,
  '["Stripe"]'::jsonb,
  '["Portuguese"]'::jsonb,
  '[{"month": "Jan", "v": 0}, {"month": "Feb", "v": 0}, {"month": "Mar", "v": 0}, {"month": "Apr", "v": 12000}, {"month": "May", "v": 35000}]'::jsonb,
  '{"total": 640, "pending": 8, "shipped": 32, "completed": 600}'::jsonb,
  '{"hipaa": false, "gdpr": false, "soc2": false}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  patients_count = EXCLUDED.patients_count,
  mrr = EXCLUDED.mrr,
  growth = EXCLUDED.growth,
  revenue_data = EXCLUDED.revenue_data;
