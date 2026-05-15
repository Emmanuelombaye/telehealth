-- Run in Supabase SQL Editor if enrollment fails on missing ship-to columns.
-- Shop checkout writes shipping_state (not patient_state).

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_state TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address_line1 TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_city TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_zip TEXT;
