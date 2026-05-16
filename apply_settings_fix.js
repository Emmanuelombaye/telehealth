import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvopgyhcjcniaocjozje.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // I'll hope this is in environment

if (!supabaseServiceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY. Please run the SQL in supabase/migrations/20240516_platform_settings.sql manually.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sql = `
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow super_admin to manage platform_settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Allow authenticated to view public platform_settings" ON public.platform_settings;

CREATE POLICY "Allow super_admin to manage platform_settings" ON public.platform_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
    );

CREATE POLICY "Allow authenticated to view public platform_settings" ON public.platform_settings
    FOR SELECT USING (true);

INSERT INTO public.platform_settings (key, value, category, description) VALUES
('platform_name', 'Peak Health', 'general', 'The display name of the platform'),
('support_email', 'support@peak-health.io', 'general', 'Primary support contact'),
('enable_2fa', 'true', 'security', 'Global 2FA requirement'),
('session_timeout', '30', 'security', 'Session timeout in minutes'),
('stripe_enabled', 'true', 'integrations', 'Enable Stripe processing'),
('referly_enabled', 'true', 'integrations', 'Enable Referly affiliate tracking')
ON CONFLICT (key) DO NOTHING;
`;

async function apply() {
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    console.error("Migration Error:", error);
  } else {
    console.log("Migration Success!");
  }
}

apply();
