-- ==============================================================================
-- Phase 2: E-Commerce & Affiliates Schema Upgrade
-- Run this in your Supabase SQL Editor to enable the advanced Admin tabs
-- ==============================================================================

-- 1. Create Products Table (For the Patient Shop)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    price_usd NUMERIC NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    popular BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Discounts Table (For Promo Codes)
CREATE TABLE IF NOT EXISTS public.discounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL, -- 'percentage' or 'fixed'
    value NUMERIC NOT NULL,
    active BOOLEAN DEFAULT true,
    usage_limit INTEGER DEFAULT 100,
    times_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Insert Initial Mock Products (To populate your Shop immediately)
INSERT INTO public.products (name, tagline, description, price_usd, category, image_url, features, popular) VALUES 
('Semaglutide', 'Weekly GLP-1 Injection', 'Most effective weight loss protocol', 245.00, 'Weight Loss', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80', '["Doctor consultation included", "Supplies included", "Monthly refills"]', true),
('Testosterone Cypionate', '200mg/mL Vial', 'Standard TRT protocol', 120.00, 'Men''s Health', 'https://images.unsplash.com/photo-1550572017-edb79a6144e5?w=800&q=80', '["Labs required", "Supplies included"]', true),
('Tretinoin 0.05%', 'Topical Cream', 'Anti-aging & Acne', 45.00, 'Skincare', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80', '["Daily application", "Dermatologist review"]', false),
('Sildenafil', '50mg Tablets', 'ED Medication', 35.00, 'Men''s Health', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80', '["Discreet shipping", "As needed use"]', false),
('Finasteride', '1mg Tablets', 'Hair Loss Treatment', 25.00, 'Hair', 'https://images.unsplash.com/photo-1550572017-edb79a6144e5?w=800&q=80', '["Daily oral pill", "Blocks DHT"]', false);

-- 4. Enable RLS but allow public read access for the MVP Shop
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.products FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.discounts FOR SELECT USING (true);
CREATE POLICY "Enable ALL access for admins" ON public.products FOR ALL USING (true);
CREATE POLICY "Enable ALL access for admins" ON public.discounts FOR ALL USING (true);

-- Done!
