-- Migration: Platform Settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Clear existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow super_admin to manage platform_settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Allow authenticated to view public platform_settings" ON public.platform_settings;

CREATE POLICY "Allow super_admin to manage platform_settings" ON public.platform_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

CREATE POLICY "Allow authenticated to view public platform_settings" ON public.platform_settings
    FOR SELECT USING (true);

-- Initial data
INSERT INTO public.platform_settings (key, value, category, description) VALUES
('platform_name', 'Peak Health', 'general', 'The display name of the platform'),
('support_email', 'support@peak-health.io', 'general', 'Primary support contact'),
('enable_2fa', 'true', 'security', 'Global 2FA requirement'),
('session_timeout', '30', 'security', 'Session timeout in minutes'),
('stripe_enabled', 'true', 'integrations', 'Enable Stripe processing'),
('referly_enabled', 'true', 'integrations', 'Enable Referly affiliate tracking')
ON CONFLICT (key) DO NOTHING;
