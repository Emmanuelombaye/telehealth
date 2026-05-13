-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  PEAK HEALTH — ELITE USA AFFILIATE SYSTEM                      ║
-- ║  Run this in Supabase SQL Editor to enable Affiliate Tracking   ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. Affiliate Profiles Table
CREATE TABLE IF NOT EXISTS public.affiliates (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    company_name TEXT,
    website_url TEXT,
    referral_code TEXT UNIQUE NOT NULL, -- The custom slug (e.g., 'fitness-pro')
    tier TEXT DEFAULT 'silver' CHECK (tier IN ('silver', 'gold', 'emerald', 'platinum')),
    commission_rate NUMERIC DEFAULT 10.0, -- Percentage
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
    tax_verified BOOLEAN DEFAULT false, -- W-9 Status
    total_earned NUMERIC DEFAULT 0,
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Referral Tracking Table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID REFERENCES public.affiliates(id),
    order_id UUID REFERENCES public.orders(id),
    patient_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')),
    order_amount NUMERIC NOT NULL,
    commission_amount NUMERIC NOT NULL,
    click_source TEXT, -- UTM source
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Payout Requests Table
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID REFERENCES public.affiliates(id),
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    method TEXT CHECK (method IN ('stripe', 'bank_transfer', 'paypal')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    transaction_id TEXT, -- ID from payment provider
    requested_at TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ
);

-- 4. Marketing Assets Table
CREATE TABLE IF NOT EXISTS public.marketing_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    asset_type TEXT CHECK (asset_type IN ('banner', 'logo', 'social_post', 'email_template')),
    image_url TEXT NOT NULL,
    download_url TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Enable Row Level Security
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_assets ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Affiliates: Read own profile
CREATE POLICY "Affiliates view own profile" ON public.affiliates
    FOR SELECT USING (auth.uid() = id);

-- Referrals: Affiliates view own referrals (Anonymized)
CREATE POLICY "Affiliates view own referrals" ON public.referrals
    FOR SELECT USING (auth.uid() = affiliate_id);

-- Payouts: Affiliates view own payouts
CREATE POLICY "Affiliates view own payouts" ON public.affiliate_payouts
    FOR SELECT USING (auth.uid() = affiliate_id);

-- Marketing Assets: All authenticated users can view
CREATE POLICY "Public view marketing assets" ON public.marketing_assets
    FOR SELECT USING (true);

-- 7. Trigger to update balance when referral is confirmed
CREATE OR REPLACE FUNCTION public.update_affiliate_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'confirmed' AND OLD.status = 'pending') THEN
        UPDATE public.affiliates 
        SET balance = balance + NEW.commission_amount,
            total_earned = total_earned + NEW.commission_amount
        WHERE id = NEW.affiliate_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_referral_confirmed
    AFTER UPDATE ON public.referrals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_affiliate_balance();
