-- ============================================================
-- Peak Health — Platform Tools Database Schema & Seed
-- Run in Supabase SQL Editor to wire Tools & Services in real-time
-- ============================================================

CREATE TABLE IF NOT EXISTS public.platform_tools (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    status BOOLEAN DEFAULT false,
    category TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_tools ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage platform tools
DROP POLICY IF EXISTS "SuperAdmins manage platform tools" ON public.platform_tools;
CREATE POLICY "SuperAdmins manage platform tools" ON public.platform_tools
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow public read of platform tools
DROP POLICY IF EXISTS "Anyone can read platform tools" ON public.platform_tools;
CREATE POLICY "Anyone can read platform tools" ON public.platform_tools
    FOR SELECT USING (true);

-- Seed initial tools data
INSERT INTO public.platform_tools (id, name, description, status, category)
VALUES 
  (1, 'AI Symptom Checker', 'AI-powered triage tool for patients before booking.', true, 'AI'),
  (2, 'Automated Reminders', 'SMS/email reminders for appointments and refills.', true, 'Automation'),
  (3, 'Workflow Builder', 'Visual drag-and-drop workflow automation.', false, 'Automation'),
  (4, 'Chatbot Assistant', '24/7 patient support chatbot.', true, 'AI'),
  (5, 'E-Prescribing Integration', 'Direct integration with pharmacy networks.', true, 'Integration'),
  (6, 'Insurance Verification API', 'Real-time insurance eligibility checks.', false, 'Integration')
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description,
    category = EXCLUDED.category;

SELECT 'Platform tools database schema fully loaded and seeded!' AS result;
