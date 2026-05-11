-- ==============================================================================
-- PHARMACY DISPATCH: Adds pharmacy email support to orders
-- ==============================================================================

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS pharmacy_email TEXT DEFAULT 'dispatch@vialsrx.com';

-- ✅ Pharmacy email support added.
