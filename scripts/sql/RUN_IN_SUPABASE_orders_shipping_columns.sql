-- Run in Supabase SQL Editor if enrollment fails on missing ship-to columns.
-- Shop checkout writes shipping_* (not patient_state).

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_state TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address_line1 TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_city TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_zip TEXT;

-- If you use trigger_assign_doctor_fn, point it at shipping_state (not patient_state):
-- CREATE OR REPLACE FUNCTION trigger_assign_doctor_fn() ... body := jsonb_build_object(
--   'order_id', NEW.id,
--   'patient_state', COALESCE(NEW.shipping_state, NEW.patient_state)
-- );
