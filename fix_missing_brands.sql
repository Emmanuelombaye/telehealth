
-- ============================================================
-- FIX: Missing brands table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    domain TEXT NOT NULL,
    country TEXT,
    plan TEXT DEFAULT 'Enterprise',
    status TEXT DEFAULT 'active',
    since_date TEXT,
    patients_count INTEGER DEFAULT 0,
    doctors_count INTEGER DEFAULT 0,
    staff_count INTEGER DEFAULT 0,
    mrr NUMERIC DEFAULT 0,
    growth NUMERIC DEFAULT 0,
    products TEXT[] DEFAULT '{}',
    gateways TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    revenue_data JSONB DEFAULT '[]'::jsonb,
    orders_data JSONB DEFAULT '{"total": 0, "pending": 0, "shipped": 0, "completed": 0}'::jsonb,
    compliance JSONB DEFAULT '{"hipaa": true, "gdpr": true, "soc2": false}'::jsonb,
    timezone TEXT DEFAULT 'America/New_York',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Allow Authenticated (Admins) to manage brands
CREATE POLICY "Admins manage brands" ON public.brands
    FOR ALL USING (auth.role() = 'authenticated');

-- Allow Public to read brands (for landing page info)
CREATE POLICY "Public read brands" ON public.brands
    FOR SELECT USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.brands;

-- Insert Mock Data for Testing
INSERT INTO public.brands (name, slug, domain, country, mrr, patients_count, doctors_count, status)
VALUES 
('Peak Health', 'peak-health', 'peak-health.io', '🇺🇸 United States', 128000, 18420, 142, 'active'),
('GlowRx', 'glow-rx', 'glowrx.health', '🇬🇧 United Kingdom', 45000, 5200, 38, 'active')
ON CONFLICT (slug) DO NOTHING;

SELECT 'Table brands created successfully!' as result;
